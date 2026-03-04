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

  renderProfile(user);
  applyProfileCustomization(user.email);
  renderProfileAchievements(user.email);
  renderBookingHistory(user.email);
  setupAvatarEdit(user);
  setupBannerGif(user);
  setupLogout();
})();

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
    if ((cust.equippedBanner || '') === 'banner-gif' && cust.bannerGifUrl) {
      if (isBannerVideo(cust.bannerGifUrl)) {
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
        existingVideo.src = cust.bannerGifUrl;
        existingVideo.style.display = '';
      } else {
        if (existingVideo) {
          existingVideo.src = '';
          existingVideo.style.display = 'none';
        }
        heroCard.style.backgroundImage = 'url(' + cust.bannerGifUrl + ')';
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

  if (fio) fio.textContent = user.fio || '—';
  if (email) email.textContent = user.email || '—';
  if (group) group.textContent = user.group || '—';

  var coinsVal = 0;
  if (typeof getLeaderboard === 'function') {
    var lb = getLeaderboard();
    var entry = lb.find(function(e) { return (e.name || '').trim() === (user.fio || '').trim(); });
    if (entry) coinsVal = entry.coins || 0;
  }
  if (coins) coins.textContent = coinsVal;

  if (avatar) {
    if (user.avatarUrl) {
      avatar.style.backgroundImage = 'url(' + user.avatarUrl + ')';
      avatar.textContent = '';
    } else {
      avatar.style.backgroundImage = 'none';
      avatar.textContent = typeof getInitialsFromName === 'function' ? getInitialsFromName(user.fio) : '?';
      avatar.style.background = user.avatarColor || 'linear-gradient(135deg, #5582FF, #4568dc)';
    }
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
    var div = document.createElement('div');
    div.className = 'profile-history__item';
    div.innerHTML =
      '<div class="profile-history__item-info">' +
        '<div class="profile-history__item-pc">ПК № ' + (h.seatId || '?') + '</div>' +
        '<div class="profile-history__item-time">Время: ' + (h.time || '—') + '</div>' +
        (dateStr ? '<div class="profile-history__item-date">' + dateStr + '</div>' : '') +
      '</div>';
    list.appendChild(div);
  });
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
