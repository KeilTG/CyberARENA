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
  renderBookingHistory(user.email);
  setupAvatarEdit(user);
  setupLogout();
})();

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
