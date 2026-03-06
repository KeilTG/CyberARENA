/* Профиль пользователя */

(function() {
  initStorage();
  var user = getCurrentUser();
  var profileAuth = document.getElementById('profile-auth');
  var profileContent = document.getElementById('profile-content');

  if (!user || !user.fio) {
    if (profileAuth) profileAuth.classList.remove('profile-content--hidden');
    if (profileContent) profileContent.classList.add('profile-content--hidden');
    return;
  }

  if (profileAuth) profileAuth.classList.add('profile-content--hidden');
  if (profileContent) profileContent.classList.remove('profile-content--hidden');

  // Делегированный обработчик «Создать команду» — фаза захвата, чтобы сработать при любом окружении (в т.ч. при запущенном сервере)
  var profileTeamEl = document.getElementById('profile-team');
  if (profileTeamEl && !profileTeamEl._createTeamDelegated) {
    profileTeamEl._createTeamDelegated = true;
    profileTeamEl.addEventListener('click', function(e) {
      var btn = e.target && e.target.closest && e.target.closest('#profile-team-create');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      try {
        var currentUser = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || user;
        if (!currentUser || !currentUser.email) return;
        if (typeof createTeam !== 'function') return;
        var team = createTeam(currentUser.email, 'Моя команда');
        if (team) {
          if (typeof syncTeamToBackend === 'function') syncTeamToBackend(team);
          renderProfileTeam(currentUser);
          setupTeamSection(currentUser);
          renderTeamInvitations(currentUser);
          // Чтобы поиск по ФИО и приглашения работали после создания — подгружаем список пользователей с сервера, если ещё не загружен
          if (!profileUsersFromDB.length && (typeof getProfileApiBase === 'function') && getProfileApiBase().indexOf('file') !== 0) {
            loadUserFromDB(currentUser.email).then(function() {
              renderProfileTeam(currentUser);
              setupTeamSection(currentUser);
            });
          }
        } else {
          renderProfileTeam(currentUser);
          setupTeamSection(currentUser);
        }
      } catch (err) {
        console.error('Создание команды:', err);
        var u = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || user;
        if (u) { renderProfileTeam(u); setupTeamSection(u); }
      }
    }, true);
  }

  var teamParam = /[?&]team=([^&]+)/.exec(window.location.search);
  if (teamParam && teamParam[1] && typeof joinTeamByInviteToken === 'function') {
    var token = decodeURIComponent(teamParam[1]);
    if (joinTeamByInviteToken(token, user.email)) {
      if (history.replaceState) history.replaceState(null, '', window.location.pathname + '#team');
      else window.location.hash = 'team';
    }
  }
  
  // Загружаем актуальные данные пользователя с сервера; при любой ошибке всё равно показываем блок команды и кнопку «Создать команду»
  function initTeamAndRest() {
    var u = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || user;
    if (!u || !u.email) return;
    loadTeamsFromBackend(u.email).then(
      function() {
        renderProfileTeam(u);
        setupTeamSection(u);
        renderTeamInvitations(u);
      },
      function() {
        renderProfileTeam(u);
        setupTeamSection(u);
        renderTeamInvitations(u);
      }
    );
  }
  loadUserFromDB(user.email).then(function(updatedUser) {
    if (updatedUser) {
      user = updatedUser;
      renderProfile(user);
    } else {
      renderProfile(user);
    }
    try {
      applyProfileCustomization(user.email);
      renderProfileAchievements(user.email);
      renderBookingHistory(user.email);
      renderUpcomingBookingNotice(user.email);
    } catch (e) { console.error('Profile init:', e); }
    initTeamAndRest();
    setupAvatarEdit(user);
    setupBannerGif(user);
    renderProfileCustomization(user.email);
  }).catch(function(err) {
    console.error('Загрузка пользователя с сервера:', err);
    renderProfile(user);
    initTeamAndRest();
  });
  
  if (window.location.hash === '#team') {
    var teamSection = document.getElementById('profile-team-section');
    if (teamSection) teamSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
  var profileSettingsBtn = document.getElementById('profile-settings-btn');
  var profileCustomizationSection = document.getElementById('profile-customization-section');
  if (profileSettingsBtn && profileCustomizationSection) {
    profileSettingsBtn.addEventListener('click', function() {
      profileCustomizationSection.classList.toggle('profile-card--customization--hidden');
      if (!profileCustomizationSection.classList.contains('profile-card--customization--hidden') && user) {
        renderProfileCustomization(user.email);
      }
    });
  }
  
  setupLogout();
})();

function profileShowToast(message) {
  if (typeof showToast === 'function') {
    showToast(message);
    return;
  }
  var el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 20px;background:rgba(30,30,40,0.95);border:1px solid rgba(85,130,255,0.3);border-radius:12px;color:#fff;font-size:0.9rem;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.4);';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(function() { el.remove(); }, 3000);
}

// Список пользователей из БД — для отображения ФИО участников команды
var profileUsersFromDB = [];

function getProfileApiBase() {
  var o = window.location.origin;
  if (o && o !== 'null' && o.indexOf('file') !== 0) return o;
  return (window.PROFILE_API_BASE || 'http://localhost:8000');
}

function loadTeamsFromBackend(email) {
  var apiBase = getProfileApiBase();
  return fetch(apiBase + '/api/teams?email=' + encodeURIComponent(email))
    .then(function(r) { return r.ok ? r.json() : []; })
    .then(function(teams) {
      if (Array.isArray(teams) && typeof addTeamFromBackend === 'function') {
        teams.forEach(function(t) { addTeamFromBackend(t); });
      }
    });
}

function syncTeamToBackend(team) {
  if (!team || !team.inviteToken) return Promise.resolve();
  var apiBase = getProfileApiBase();
  return fetch(apiBase + '/api/teams/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invite_token: team.inviteToken,
      name: team.name || 'Моя команда',
      owner_email: team.ownerEmail,
      members: team.members || []
    })
  }).then(function() {}, function() {});
}

// ==================== ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ ИЗ БД ====================
async function loadUserFromDB(email) {
  try {
    const baseUrl = getProfileApiBase();
    const response = await fetch(`${baseUrl}/api/admin/users`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const users = await response.json();
    profileUsersFromDB = users || [];
    const userFromDB = users.find(u => u.email === email);
    
    if (userFromDB) {
      // Обновляем данные текущего пользователя
      const currentUser = getCurrentUser();
      if (currentUser) {
        currentUser.arcoins = userFromDB.arcoins;
        setCurrentUser(currentUser);
      }
      return userFromDB;
    }
    return null;
  } catch (error) {
    console.error('Ошибка загрузки данных пользователя:', error);
    return null;
  }
}

function renderProfileCustomization(userEmail) {
  var cust = typeof getUserCustomization === 'function' ? getUserCustomization(userEmail) : { ownedFrames: [], ownedBanners: [], equippedFrame: 'frame-none', equippedBanner: 'banner-none' };
  var framesEl = document.getElementById('profile-owned-frames');
  var bannersEl = document.getElementById('profile-owned-banners');
  if (!framesEl || !bannersEl) return;
  var frames = typeof getCustomizationFrames === 'function' ? getCustomizationFrames() : [];
  var banners = typeof getCustomizationBanners === 'function' ? getCustomizationBanners() : [];
  var readyGifs = typeof getReadyGifBanners === 'function' ? getReadyGifBanners() : [];
  var ownedFrames = (cust.ownedFrames || []).filter(function(id) { return frames.some(function(f) { return f.id === id; }); });
  if (ownedFrames.indexOf('frame-none') === -1) ownedFrames.unshift('frame-none');
  var ownedBannerIds = (cust.ownedBanners || []).slice();
  if (ownedBannerIds.indexOf('banner-none') === -1) ownedBannerIds.unshift('banner-none');
  framesEl.innerHTML = ownedFrames.length === 0
    ? '<p class="profile-owned__empty">Нет купленных рамок. Приобретите во вкладке <a href="../kiber-arena.html#exchange">Обмен коинов</a>.</p>'
    : ownedFrames.map(function(id) {
        var f = frames.find(function(x) { return x.id === id; });
        if (!f) return '';
        var equipped = cust.equippedFrame === id;
        return '<div class="profile-owned-item" data-frame-id="' + id + '">' +
          '<div class="profile-owned-item__preview profile-owned-item__preview--frame custom-frame custom-frame--' + id + '"></div>' +
          '<span class="profile-owned-item__name">' + (f.name || id) + '</span>' +
          '<button type="button" class="profile-owned-item__btn' + (equipped ? ' profile-owned-item__btn--on' : '') + '" data-frame="' + id + '">' + (equipped ? 'Надето' : 'Надеть') + '</button></div>';
      }).join('');
  var bannerItems = [];
  ownedBannerIds.forEach(function(id) {
    if (id.indexOf('gif-banner-') === 0) {
      var g = readyGifs.find(function(x) { return x.id === id; });
      if (g) bannerItems.push({ id: id, name: g.name, type: 'gif', gifUrl: g.gifUrl });
    } else {
      var b = banners.find(function(x) { return x.id === id; });
      if (b) bannerItems.push({ id: id, name: b.name, type: 'banner' });
    }
  });
  bannersEl.innerHTML = bannerItems.length === 0
    ? '<p class="profile-owned__empty">Нет купленных баннеров. Приобретите во вкладке <a href="../kiber-arena.html#exchange">Обмен коинов</a>.</p>'
    : bannerItems.map(function(item) {
        var equipped = cust.equippedBanner === item.id;
        var previewClass = item.type === 'gif' ? 'profile-owned-item__preview--gif' : 'profile-owned-item__preview--banner custom-banner custom-banner--' + item.id;
        var previewStyle = item.gifUrl ? ' style="background-image:url(\'' + (item.gifUrl || '').replace(/'/g, '\\27') + '\');background-size:cover;background-position:center"' : '';
        return '<div class="profile-owned-item" data-banner-id="' + item.id + '">' +
          '<div class="profile-owned-item__preview ' + previewClass + '"' + previewStyle + '></div>' +
          '<span class="profile-owned-item__name">' + (item.name || item.id) + '</span>' +
          '<button type="button" class="profile-owned-item__btn' + (equipped ? ' profile-owned-item__btn--on' : '') + '" data-banner="' + item.id + '" data-banner-type="' + item.type + '">' + (equipped ? 'Надето' : 'Надеть') + '</button></div>';
      }).join('');
  framesEl.querySelectorAll('[data-frame]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = btn.dataset.frame;
      if (typeof purchaseFrame === 'function' && userEmail) {
        purchaseFrame(userEmail, id);
        applyProfileCustomization(userEmail);
        renderProfileCustomization(userEmail);
      }
    });
  });
  bannersEl.querySelectorAll('[data-banner]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = btn.dataset.banner;
      var type = btn.dataset.bannerType || 'banner';
      if (type === 'gif' && typeof purchaseReadyGifBanner === 'function' && userEmail) {
        purchaseReadyGifBanner(userEmail, id);
      } else if (typeof purchaseBanner === 'function' && userEmail) {
        purchaseBanner(userEmail, id);
      }
      if (userEmail) {
        applyProfileCustomization(userEmail);
        renderProfileCustomization(userEmail);
      }
    });
  });
}

function renderProfileAchievements(userEmail) {
  var container = document.getElementById('profile-achievements-list');
  if (!container) return;
  var data = typeof getUserAchievements === 'function' ? getUserAchievements(userEmail) : { unlocked: [] };
  var list = typeof ACHIEVEMENTS_LIST !== 'undefined' ? ACHIEVEMENTS_LIST : [];
  var unlockedIds = data.unlocked || [];
  var unlocked = list.filter(function(a) { return unlockedIds.indexOf(a.id) !== -1; });
  if (unlocked.length === 0) {
    container.innerHTML = '<p class="profile-achievements__empty">Пока нет полученных достижений. Выполняйте условия во вкладке <a href="../kiber-arena.html">Мои достижения</a> на главной.</p>';
    return;
  }
  container.innerHTML = '<div class="profile-achievements__grid">' + unlocked.map(function(a) {
    return '<span class="profile-achievement-badge" title="' + (a.description || '').replace(/"/g, '&quot;') + '">' +
      '<span class="profile-achievement-badge__icon">' + (a.icon || '🏅') + '</span>' +
      '<span class="profile-achievement-badge__name">' + (a.name || '') + '</span>' +
      '</span>';
  }).join('') + '</div>';
}

function isBannerVideo(url) {
  if (!url) return false;
  return url.indexOf('video/mp4') !== -1 || (url.toLowerCase && url.toLowerCase().indexOf('.mp4') !== -1);
}

function applyProfileCustomization(userEmail) {
  var cust = typeof getUserCustomization === 'function' ? getUserCustomization(userEmail) : { equippedFrame: 'frame-none', equippedBanner: 'banner-none', bannerGifUrl: '' };
  var heroCard = document.getElementById('profile-hero-card');
  var wrapEl = document.getElementById('profile-avatar-wrap');
  if (heroCard) {
    heroCard.className = 'profile-card profile-card--hero custom-banner custom-banner--' + (cust.equippedBanner || 'banner-none');
    var existingVideo = heroCard.querySelector('.profile-hero-banner-video');
    var bannerUrl = '';
    if ((cust.equippedBanner || '').indexOf('gif-banner-') === 0 && typeof getReadyGifBannerById === 'function') {
      var readyGif = getReadyGifBannerById(cust.equippedBanner);
      if (readyGif && readyGif.gifUrl) bannerUrl = readyGif.gifUrl;
    } else if ((cust.equippedBanner || '') === 'banner-gif' && cust.bannerGifUrl) {
      bannerUrl = cust.bannerGifUrl;
    }
    if (bannerUrl) {
      if (isBannerVideo(bannerUrl)) {
        heroCard.style.backgroundImage = '';
        heroCard.style.backgroundSize = '';
        heroCard.style.backgroundPosition = '';
        if (!existingVideo) {
          var video = document.createElement('video');
          video.className = 'profile-hero-banner-video';
          video.autoplay = true;
          video.loop = true;
          video.muted = true;
          video.playsInline = true;
          heroCard.insertBefore(video, heroCard.firstChild);
          existingVideo = video;
        }
        existingVideo.src = bannerUrl;
        existingVideo.style.display = '';
      } else {
        if (existingVideo) {
          existingVideo.src = '';
          existingVideo.style.display = 'none';
        }
        heroCard.style.backgroundImage = 'url(' + bannerUrl + ')';
        heroCard.style.backgroundSize = 'cover';
        heroCard.style.backgroundPosition = 'center';
      }
    } else {
      if (existingVideo) {
        existingVideo.src = '';
        existingVideo.style.display = 'none';
      }
      heroCard.style.backgroundImage = '';
      heroCard.style.backgroundSize = '';
      heroCard.style.backgroundPosition = '';
    }
  }
  if (wrapEl) {
    wrapEl.className = 'profile-avatar-wrap custom-frame custom-frame--' + (cust.equippedFrame || 'frame-none');
  }
}

function setupBannerGif(user) {
  var wrap = document.getElementById('profile-gif-banner-wrap');
  var input = document.getElementById('profile-banner-gif-url');
  var saveBtn = document.getElementById('profile-banner-gif-save');
  var fileInput = document.getElementById('profile-banner-gif-file');
  var fileHint = document.getElementById('profile-banner-gif-file-hint');
  if (!wrap || !input || !saveBtn) return;
  var cust = typeof getUserCustomization === 'function' ? getUserCustomization(user.email) : {};
  var hasGifBanner = (cust.ownedBanners || []).indexOf('banner-gif') !== -1;
  if (hasGifBanner) {
    wrap.classList.remove('profile-gif-banner-wrap--hidden');
    var currentUrl = cust.bannerGifUrl || '';
    input.value = currentUrl && currentUrl.indexOf('data:') !== 0 ? currentUrl : '';
    if (currentUrl && currentUrl.indexOf('data:') === 0) {
      if (fileHint) fileHint.textContent = 'Сейчас используется загруженный файл (GIF или MP4). Вставьте ссылку или выберите другой файл.';
    }
    saveBtn.addEventListener('click', function() {
      var url = (input.value || '').trim();
      var c = typeof getUserCustomization === 'function' ? getUserCustomization(user.email) : {};
      c.bannerGifUrl = url;
      if (typeof setUserCustomization === 'function') setUserCustomization(user.email, c);
      applyProfileCustomization(user.email);
      if (fileHint) fileHint.textContent = '';
    });
    if (fileInput) {
      fileInput.addEventListener('change', function() {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        var isGif = file.type === 'image/gif' || (file.name && file.name.toLowerCase().endsWith('.gif'));
        var isMp4 = file.type === 'video/mp4' || (file.name && file.name.toLowerCase().endsWith('.mp4'));
        if (!isGif && !isMp4) {
          if (fileHint) fileHint.textContent = 'Выберите файл GIF или MP4.';
          return;
        }
        if (isMp4) {
          var objectUrl = URL.createObjectURL(file);
          var video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = function() {
            URL.revokeObjectURL(objectUrl);
            var duration = video.duration;
            if (duration > 5) {
              if (fileHint) fileHint.textContent = 'Видео должно быть не длиннее 5 секунд (у вас ' + duration.toFixed(1) + ' сек).';
              return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
              var dataUrl = e.target.result;
              var c = typeof getUserCustomization === 'function' ? getUserCustomization(user.email) : {};
              c.bannerGifUrl = dataUrl;
              if (typeof setUserCustomization === 'function') setUserCustomization(user.email, c);
              applyProfileCustomization(user.email);
              input.value = '';
              if (fileHint) fileHint.textContent = 'Файл «' + (file.name || '') + '» загружен (' + duration.toFixed(1) + ' сек).';
              fileInput.value = '';
            };
            reader.readAsDataURL(file);
          };
          video.onerror = function() {
            URL.revokeObjectURL(objectUrl);
            if (fileHint) fileHint.textContent = 'Не удалось прочитать видео.';
          };
          video.src = objectUrl;
          return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
          var dataUrl = e.target.result;
          var c = typeof getUserCustomization === 'function' ? getUserCustomization(user.email) : {};
          c.bannerGifUrl = dataUrl;
          if (typeof setUserCustomization === 'function') setUserCustomization(user.email, c);
          applyProfileCustomization(user.email);
          input.value = '';
          if (fileHint) fileHint.textContent = 'Файл «' + (file.name || '') + '» загружен.';
          fileInput.value = '';
        };
        reader.readAsDataURL(file);
      });
    }
  } else {
    wrap.classList.add('profile-gif-banner-wrap--hidden');
  }
}

function setupLogout() {
  var btn = document.getElementById('profile-logout');
  if (!btn) return;
  btn.addEventListener('click', function() {
    if (typeof setCurrentUser === 'function') setCurrentUser(null);
    window.location.href = '../kiber-arena.html';
  });
}

function renderProfile(user) {
  var fio = document.getElementById('profile-fio');
  var email = document.getElementById('profile-email');
  var group = document.getElementById('profile-group');
  var coins = document.getElementById('profile-coins');
  var avatar = document.getElementById('profile-avatar');

  var displayName = user.fio || '—';
  var displayInitials = typeof getInitialsFromName === 'function' ? getInitialsFromName(user.fio) : '?';
  var displayAvatarColor = user.avatarColor || 'linear-gradient(135deg, #5582FF, #4568dc)';
  var displayGroup = user.group || '—';
  
  // Используем коины из объекта пользователя (получены из БД)
  var coinsVal = user.arcoins || 0;

  if (fio) fio.textContent = displayName;
  if (email) email.textContent = user.email || '—';
  if (group) group.textContent = displayGroup;
  if (coins) coins.textContent = coinsVal;

  if (avatar) {
    if (user.avatarUrl) {
      avatar.style.backgroundImage = 'url(' + user.avatarUrl + ')';
      avatar.textContent = '';
    } else {
      avatar.style.backgroundImage = 'none';
      avatar.textContent = displayInitials;
      avatar.style.background = displayAvatarColor;
    }
  }
}

function renderProfileTeam(user) {
  var emptyEl = document.getElementById('profile-team-empty');
  var hasEl = document.getElementById('profile-team-has');
  var noEl = document.getElementById('profile-team-no');
  var membersList = document.getElementById('profile-team-members');
  var inviteInput = document.getElementById('profile-team-invite-input');
  var nameEl = document.getElementById('profile-team-name');
  if (!emptyEl || !hasEl || !noEl) return;
  var emptyWrap = document.getElementById('profile-team-empty-wrap');
  var team = typeof getTeamByUserEmail === 'function' ? getTeamByUserEmail(user.email) : null;
  if (!team) {
    if (emptyWrap) emptyWrap.classList.remove('profile-team__empty-wrap--hidden');
    hasEl.classList.add('profile-team__has-team--hidden');
    if (noEl) noEl.classList.add('profile-team__no-team--hidden');
    return;
  }
  if (emptyWrap) emptyWrap.classList.add('profile-team__empty-wrap--hidden');
  hasEl.classList.remove('profile-team__has-team--hidden');
  if (noEl) noEl.classList.add('profile-team__no-team--hidden');
  if (nameEl) nameEl.textContent = team.name || 'Моя команда';
  var owner = (team.ownerEmail || team.owner_email || '').toString().toLowerCase();
  var userMail = (user.email || '').toString().toLowerCase();
  var isCaptain = owner && userMail && owner === userMail;
  var editBtn = document.getElementById('profile-team-edit-name');
  var editRow = document.getElementById('profile-team-name-edit');
  var nameInput = document.getElementById('profile-team-name-input');
  var searchWrap = document.getElementById('profile-team-search-wrap');
  if (editBtn) editBtn.classList.toggle('profile-team__edit-name--hidden', !isCaptain);
  if (editRow) editRow.classList.add('profile-team__name-edit--hidden');
  if (nameInput) nameInput.value = team.name || '';
  if (searchWrap) searchWrap.classList.toggle('profile-team__search-wrap--hidden', !isCaptain);
  var usersSource = profileUsersFromDB.length ? profileUsersFromDB : (typeof getUsers === 'function' ? getUsers() : []);
  if (membersList) {
    membersList.innerHTML = (team.members || []).map(function(email) {
      var u = usersSource.find(function(x) { return x.email === email; });
      var display = u && u.fio ? u.fio : email;
      var isOwner = team.ownerEmail === email;
      return '<li class="profile-team__member">' + display + (isOwner ? ' <span class="profile-team__owner-badge">капитан</span>' : '') + '</li>';
    }).join('');
  }
  var token = team.inviteToken || team.invite_token || '';
  var inviteUrl = '';
  try {
    inviteUrl = (new URL('../kiber-arena.html', window.location.href)).href + (token ? '?team=' + encodeURIComponent(token) : '');
  } catch (e) {
    inviteUrl = (window.location.origin || '') + '/kiber-arena.html' + (token ? '?team=' + encodeURIComponent(token) : '');
  }
  if (inviteInput) inviteInput.value = inviteUrl;
  if (team && isCaptain) syncTeamToBackend(team);
}

function renderTeamInvitations(user) {
  var wrap = document.getElementById('profile-team-invitations-wrap');
  var listEl = document.getElementById('profile-team-invitations-list');
  if (!wrap || !listEl) return;
  var apiBase = getProfileApiBase();
  fetch(apiBase + '/api/team-invitations?email=' + encodeURIComponent(user.email))
    .then(function(r) { return r.ok ? r.json() : []; })
    .then(function(invitations) {
      if (!Array.isArray(invitations)) invitations = [];
      if (invitations.length === 0) {
        listEl.innerHTML = '<p class="profile-team__invitations-empty">Нет входящих приглашений</p>';
        return;
      }
      var usersSource = profileUsersFromDB.length ? profileUsersFromDB : (typeof getUsers === 'function' ? getUsers() : []);
      function fioFor(email) {
        var u = usersSource.find(function(x) { return x.email === email; });
        return (u && u.fio) ? u.fio : email;
      }
      listEl.innerHTML = invitations.map(function(inv) {
        var membersList = (inv.members || []).map(function(email) { return fioFor(email); }).join(', ');
        var membersEsc = (membersList || '—').replace(/</g, '&lt;');
        var nameEsc = (inv.team_name || '').replace(/</g, '&lt;');
        var inviteLink = '';
        if (inv.invite_token) {
          try {
            inviteLink = (new URL('../kiber-arena.html', window.location.href)).href + '?team=' + encodeURIComponent(inv.invite_token);
          } catch (e) {
            inviteLink = (window.location.origin || '') + '/kiber-arena.html?team=' + encodeURIComponent(inv.invite_token);
          }
        }
        var linkBlock = inviteLink ? '<div class="profile-team__invitation-link-row"><input type="text" class="profile-team__invitation-link" value="' + inviteLink.replace(/"/g, '&quot;') + '" readonly><button type="button" class="profile-team__invitation-copy-link" data-link="' + inviteLink.replace(/"/g, '&quot;') + '">Копировать ссылку</button></div>' : '';
        return '<div class="profile-team__invitation" data-invitation-id="' + inv.id + '">' +
          '<p class="profile-team__invitation-text">Команда <strong>«' + nameEsc + '»</strong> хочет пригласить вас в команду.</p>' +
          '<p class="profile-team__invitation-members">Участники: ' + membersEsc + '</p>' +
          linkBlock +
          '<div class="profile-team__invitation-actions">' +
          '<button type="button" class="profile-team__invitation-btn profile-team__invitation-btn--accept" data-accept="' + inv.id + '">Принять</button>' +
          '<button type="button" class="profile-team__invitation-btn profile-team__invitation-btn--decline" data-decline="' + inv.id + '">Отклонить</button>' +
          '</div></div>';
      }).join('');
      listEl.querySelectorAll('[data-accept]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id = parseInt(btn.dataset.accept, 10);
          fetch(apiBase + '/api/team-invitations/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invitation_id: id, user_email: user.email })
          }).then(function(r) { return r.json(); }).then(function(data) {
            if (data.team && typeof addTeamFromBackend === 'function') addTeamFromBackend(data.team);
            profileShowToast('Вы присоединились к команде!');
            renderProfileTeam(user);
            renderTeamInvitations(user);
          }).catch(function() { profileShowToast('Ошибка при принятии приглашения'); });
        });
      });
      listEl.querySelectorAll('.profile-team__invitation-copy-link').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var link = btn.dataset.link || '';
          if (!link) return;
          navigator.clipboard.writeText(link).then(function() {
            profileShowToast('Ссылка скопирована');
          }).catch(function() {
            var inp = btn.closest('.profile-team__invitation-link-row') && btn.closest('.profile-team__invitation-link-row').querySelector('input');
            if (inp) { inp.select(); document.execCommand('copy'); profileShowToast('Ссылка скопирована'); }
          });
        });
      });
      listEl.querySelectorAll('[data-decline]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var id = parseInt(btn.dataset.decline, 10);
          fetch(apiBase + '/api/team-invitations/decline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invitation_id: id, user_email: user.email })
          }).then(function() {
            profileShowToast('Приглашение отклонено');
            renderTeamInvitations(user);
          });
        });
      });
    })
    .catch(function() {
      listEl.innerHTML = '<p class="profile-team__invitations-empty">Не удалось загрузить приглашения</p>';
    });
}

var teamSearchDebounceTimer = null;
function setupTeamSearch(user) {
  var searchInput = document.getElementById('profile-team-search-input');
  var dropdown = document.getElementById('profile-team-search-dropdown');
  if (!searchInput || !dropdown) return;
  searchInput.value = '';
  dropdown.innerHTML = '';
  dropdown.classList.remove('profile-team__search-dropdown--open');
  searchInput.removeEventListener('input', window._teamSearchInputHandler);
  searchInput.removeEventListener('blur', window._teamSearchBlurHandler);
  searchInput.addEventListener('input', window._teamSearchInputHandler = function() {
    var q = (searchInput.value || '').trim();
    if (teamSearchDebounceTimer) clearTimeout(teamSearchDebounceTimer);
    if (q.length < 2) {
      dropdown.innerHTML = '';
      dropdown.classList.remove('profile-team__search-dropdown--open');
      return;
    }
    teamSearchDebounceTimer = setTimeout(function() {
      var team = typeof getTeamByUserEmail === 'function' ? getTeamByUserEmail(user.email) : null;
      var excludeEmails = [user.email];
      if (team && (team.members || []).length) excludeEmails = excludeEmails.concat(team.members);
      var apiBase = getProfileApiBase();
      fetch(apiBase + '/api/users/search?q=' + encodeURIComponent(q))
        .then(function(r) {
          if (!r.ok) return r.json().then(function(err) { throw new Error(err.detail || 'HTTP ' + r.status); });
          return r.json();
        })
        .then(function(list) {
          if (!Array.isArray(list)) list = [];
          var filtered = list.filter(function(u) { return u && excludeEmails.indexOf(u.email) === -1; });
          dropdown.innerHTML = filtered.length === 0
            ? '<div class="profile-team__search-empty">Никого не найдено</div>'
            : filtered.map(function(u) {
                var fioEsc = (u.fio || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
                var emailEsc = (u.email || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
                return '<div class="profile-team__search-item">' +
                  '<span class="profile-team__search-item-info">' + fioEsc + (u.email ? ' <span class="profile-team__search-email">' + emailEsc + '</span>' : '') + '</span>' +
                  '<button type="button" class="profile-team__search-invite-btn" data-email="' + emailEsc + '">Пригласить</button>' +
                  '</div>';
              }).join('');
          dropdown.classList.add('profile-team__search-dropdown--open');
          dropdown.querySelectorAll('.profile-team__search-invite-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
              e.stopPropagation();
              var invitedEmail = btn.dataset.email;
              var team = typeof getTeamByUserEmail === 'function' ? getTeamByUserEmail(user.email) : null;
              if (!team) {
                profileShowToast('Сначала создайте команду');
                return;
              }
              syncTeamToBackend(team).then(function() {
                return fetch(getProfileApiBase() + '/api/team-invitations', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    invite_token: team.inviteToken || team.invite_token,
                    invited_email: invitedEmail,
                    captain_email: user.email
                  })
                });
              }).then(function(r) {
                if (!r.ok) return r.json().then(function(err) { throw new Error(err.detail || 'Ошибка'); });
                return r.json();
              }).then(function() {
                searchInput.value = '';
                dropdown.innerHTML = '';
                dropdown.classList.remove('profile-team__search-dropdown--open');
                profileShowToast('Приглашение отправлено');
              }).catch(function(err) {
                profileShowToast(err.message || 'Не удалось отправить приглашение');
              });
            });
          });
        })
        .catch(function(err) {
          console.error('Поиск участников:', err);
          var is404 = (err && (err.message === 'Not Found' || err.message.indexOf('404') !== -1));
          var hint = is404 ? ' Перезапустите сервер (python main.py из папки forma-kiber).' : ' Проверьте, что сервер запущен и страница открыта с того же адреса (не file://).';
          dropdown.innerHTML = '<div class="profile-team__search-empty">Ошибка поиска.' + hint + '</div>';
          dropdown.classList.add('profile-team__search-dropdown--open');
        });
    }, 300);
  });
  searchInput.addEventListener('blur', window._teamSearchBlurHandler = function() {
    setTimeout(function() {
      dropdown.classList.remove('profile-team__search-dropdown--open');
    }, 150);
  });
}

function setupTeamSection(user) {
  var leaveBtn = document.getElementById('profile-team-leave');
  var copyBtn = document.getElementById('profile-team-invite-copy');
  // Кнопка «Создать команду» обрабатывается делегированным обработчиком на #profile-team
  if (leaveBtn) {
    if (leaveBtn._leaveHandler) leaveBtn.removeEventListener('click', leaveBtn._leaveHandler);
    leaveBtn._leaveHandler = function() {
      if (!user || !user.email) return;
      if (!confirm('Выйти из команды?')) return;
      var team = typeof getTeamByUserEmail === 'function' ? getTeamByUserEmail(user.email) : null;
      var token = team && (team.inviteToken || team.invite_token);
      if (typeof leaveTeam === 'function') leaveTeam(user.email);
      if (token) {
        fetch(getProfileApiBase() + '/api/teams/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invite_token: token, user_email: user.email })
        }).then(function() {}, function() {});
      }
      renderProfileTeam(user);
      setupTeamSection(user);
      renderTeamInvitations(user);
    };
    leaveBtn.addEventListener('click', leaveBtn._leaveHandler);
  }
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      var input = document.getElementById('profile-team-invite-input');
      if (!input) return;
      input.select();
      input.setSelectionRange(0, 99999);
      try {
        document.execCommand('copy');
        copyBtn.textContent = 'Скопировано!';
        setTimeout(function() { copyBtn.textContent = 'Копировать'; }, 2000);
      } catch (e) {
        navigator.clipboard.writeText(input.value).then(function() {
          copyBtn.textContent = 'Скопировано!';
          setTimeout(function() { copyBtn.textContent = 'Копировать'; }, 2000);
        });
      }
    });
  }
  setupTeamSearch(user);
  var editNameBtn = document.getElementById('profile-team-edit-name');
  var nameEditRow = document.getElementById('profile-team-name-edit');
  var nameInputEl = document.getElementById('profile-team-name-input');
  var nameSaveBtn = document.getElementById('profile-team-name-save');
  var nameCancelBtn = document.getElementById('profile-team-name-cancel');
  if (editNameBtn && nameEditRow && nameInputEl && nameSaveBtn && nameCancelBtn) {
    if (editNameBtn._editHandler) editNameBtn.removeEventListener('click', editNameBtn._editHandler);
    if (nameSaveBtn._saveHandler) nameSaveBtn.removeEventListener('click', nameSaveBtn._saveHandler);
    if (nameCancelBtn._cancelHandler) nameCancelBtn.removeEventListener('click', nameCancelBtn._cancelHandler);
    editNameBtn._editHandler = function() {
      var team = typeof getTeamByUserEmail === 'function' ? getTeamByUserEmail(user.email) : null;
      if (!team) return;
      nameInputEl.value = team.name || '';
      nameEditRow.classList.remove('profile-team__name-edit--hidden');
    };
    nameSaveBtn._saveHandler = function() {
      var team = typeof getTeamByUserEmail === 'function' ? getTeamByUserEmail(user.email) : null;
      if (!team) return;
      var newName = (nameInputEl.value || '').trim();
      if (!newName) return;
      if (typeof updateTeamName === 'function' && updateTeamName(team.id, user.email, newName)) {
        nameEditRow.classList.add('profile-team__name-edit--hidden');
        team = getTeamByUserEmail(user.email);
        if (team) syncTeamToBackend(team);
        renderProfileTeam(user);
      }
    };
    nameCancelBtn._cancelHandler = function() {
      nameEditRow.classList.add('profile-team__name-edit--hidden');
    };
    editNameBtn.addEventListener('click', editNameBtn._editHandler);
    nameSaveBtn.addEventListener('click', nameSaveBtn._saveHandler);
    nameCancelBtn.addEventListener('click', nameCancelBtn._cancelHandler);
  }
}

function renderBookingHistory(userEmail) {
  var list = document.getElementById('profile-history-list');
  var empty = document.getElementById('profile-history-empty');
  if (!list || !empty) return;

  var history = typeof getBookingHistoryByUser === 'function' ? getBookingHistoryByUser(userEmail) : [];
  list.innerHTML = '';

  if (history.length === 0) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  history.forEach(function(h) {
    var dateStr = '';
    if (h.bookedAt) {
      try {
        var d = new Date(h.bookedAt);
        dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } catch (e) {}
    }
    var zoneText = (h.zoneName || h.zoneId) ? (h.zoneName || h.zoneId) + ', ' : '';
    var div = document.createElement('div');
    div.className = 'profile-history__item';
    div.innerHTML =
      '<div class="profile-history__item-info">' +
        '<div class="profile-history__item-pc">' + (zoneText ? 'Зона: ' + zoneText.replace(/</g, '&lt;') : '') + 'ПК № ' + (h.seatId || '?') + '</div>' +
        '<div class="profile-history__item-time">Время: ' + (h.time || '—') + '</div>' +
        (dateStr ? '<div class="profile-history__item-date">' + dateStr + '</div>' : '') +
      '</div>';
    list.appendChild(div);
  });
}

function renderUpcomingBookingNotice(userEmail) {
  var notice = document.getElementById('profile-booking-notice');
  if (!notice) return;

  var history = typeof getBookingHistoryByUser === 'function' ? getBookingHistoryByUser(userEmail) : [];
  if (!history.length) {
    notice.classList.add('profile-booking-notice--hidden');
    notice.textContent = '';
    return;
  }

  var now = new Date();
  var nowMs = now.getTime();
  var oneDayMs = 24 * 60 * 60 * 1000;
  var hasUpcoming = history.some(function(h) {
    if (!h || !h.date || !h.time) return false;
    var parts = String(h.time).split(/[–\-]/);
    if (!parts.length) return false;
    var start = parts[0].trim();
    if (!start) return false;
    try {
      var dt = new Date(h.date + 'T' + start + ':00');
      if (isNaN(dt.getTime())) return false;
      var diff = dt.getTime() - nowMs;
      return diff > 0 && diff <= oneDayMs;
    } catch (e) {
      return false;
    }
  });

  if (!hasUpcoming) {
    notice.classList.add('profile-booking-notice--hidden');
    notice.textContent = '';
    return;
  }

  notice.textContent = 'У вас есть активные бронирования на ближайшее время. Не забудьте посетить забронированное место. Если вы не успеваете, вы можете отменить бронь максимум за 30 минут до начала, иначе будет засчитана неявка на забронированное место.';
  notice.classList.remove('profile-booking-notice--hidden');
}

function setupAvatarEdit(user) {
  var input = document.getElementById('avatar-input');
  if (!input) return;

  input.addEventListener('change', function() {
    var file = input.files && input.files[0];
    if (!file || !file.type.match(/^image\//)) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      var dataUrl = e.target.result;
      if (typeof updateUserAvatar === 'function') {
        updateUserAvatar(user.email, dataUrl);
      }
      var cur = getCurrentUser();
      if (cur) cur.avatarUrl = dataUrl;
      if (typeof setCurrentUser === 'function') setCurrentUser(cur);
      var avatar = document.getElementById('profile-avatar');
      if (avatar) {
        avatar.style.backgroundImage = 'url(' + dataUrl + ')';
        avatar.textContent = '';
      }
    };
    reader.readAsDataURL(file);
    input.value = '';
  });
}