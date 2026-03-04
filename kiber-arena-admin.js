/* Админ-панель — управление мероприятиями и лидербордом */

initStorage();

var eventsList = document.getElementById('events-list');
var leaderboardList = document.getElementById('leaderboard-list');
var usersList = document.getElementById('users-list');
var tournamentsAdminList = document.getElementById('tournaments-admin-list');
var exchangeFramesPricesEl = document.getElementById('exchange-frames-prices');
var exchangeBannersPricesEl = document.getElementById('exchange-banners-prices');
var modal = document.getElementById('modal');
var userBookingsModal = document.getElementById('user-bookings-modal');
var giveCoinsModal = document.getElementById('give-coins-modal');
var tournamentMatchesModal = document.getElementById('tournament-matches-modal');
var tournamentRewardsModal = document.getElementById('tournament-rewards-modal');
var currentUserBookingsEmail = null;
var currentGiveCoinsUser = null;
var currentTournamentMatchesEventId = null;
var currentTournamentMatchesFormat = '1v1';
var currentTournamentRewardsEventId = null;
var modalTitle = document.getElementById('modal-title');
var modalForm = document.getElementById('modal-form');
var modalFields = document.getElementById('modal-fields');
var modalCancel = document.getElementById('modal-cancel');
var currentEditId = null;
var currentMode = null;

renderEvents();
renderLeaderboard();
renderTournamentsAdmin();
renderExchangePrices();
renderUsers();

if (document.getElementById('exchange-prices-save')) {
  document.getElementById('exchange-prices-save').addEventListener('click', saveExchangePrices);
}

document.getElementById('add-event-btn').addEventListener('click', function() {
  openEventModal(null);
});

document.getElementById('add-leader-btn').addEventListener('click', function() {
  openLeaderModal(null);
});

modalCancel.addEventListener('click', closeModal);
modal.querySelector('.modal__overlay').addEventListener('click', closeModal);
if (userBookingsModal) {
  userBookingsModal.querySelector('#user-bookings-close').addEventListener('click', closeUserBookingsModal);
  userBookingsModal.querySelector('.modal__overlay').addEventListener('click', closeUserBookingsModal);
}
if (giveCoinsModal) {
  giveCoinsModal.querySelector('#give-coins-cancel').addEventListener('click', closeGiveCoinsModal);
  giveCoinsModal.querySelector('.modal__overlay').addEventListener('click', closeGiveCoinsModal);
  document.getElementById('give-coins-form').addEventListener('submit', function(e) {
    e.preventDefault();
    saveGiveCoins();
  });
}
if (tournamentMatchesModal) {
  document.getElementById('tournament-matches-close').addEventListener('click', closeTournamentMatchesModal);
  tournamentMatchesModal.querySelector('.modal__overlay').addEventListener('click', closeTournamentMatchesModal);
  document.getElementById('tournament-matches-save').addEventListener('click', saveTournamentMatches);
}
if (tournamentRewardsModal) {
  document.getElementById('tournament-rewards-close').addEventListener('click', closeTournamentRewardsModal);
  tournamentRewardsModal.querySelector('.modal__overlay').addEventListener('click', closeTournamentRewardsModal);
  document.getElementById('tournament-rewards-save').addEventListener('click', saveTournamentRewards);
  document.getElementById('tournament-rewards-add-row').addEventListener('click', addTournamentRewardRow);
}

modalForm.addEventListener('submit', function(e) {
  e.preventDefault();
  if (currentMode === 'event') saveEvent();
  else if (currentMode === 'leader') saveLeader();
  closeModal();
});

function openEventModal(ev) {
  currentMode = 'event';
  currentEditId = ev ? ev.id : null;
  modalTitle.textContent = ev ? 'Редактировать мероприятие' : 'Добавить мероприятие';
  var cats = typeof EVENT_CATEGORIES !== 'undefined' ? EVENT_CATEGORIES : ['CS2', 'Valorant', 'Clash Royale', 'Brawl Stars', 'Fortnite', 'WOT'];
  var catOpts = cats.map(function(c) {
    var sel = (ev && ev.category === c) ? ' selected' : '';
    return '<option value="' + c + '"' + sel + '>' + c + '</option>';
  }).join('');
  var formats = typeof TOURNAMENT_FORMATS !== 'undefined' ? TOURNAMENT_FORMATS : ['1v1', '3v3', '5v5'];
  var formatOpts = formats.map(function(f) {
    var sel = (ev && (ev.format || '1v1') === f) ? ' selected' : (!ev && f === '1v1') ? ' selected' : '';
    return '<option value="' + f + '"' + sel + '>' + f + '</option>';
  }).join('');
  modalFields.innerHTML =
    '<div class="form-group"><label>Название</label><input type="text" name="name" value="' + (ev ? (ev.name || '').replace(/"/g, '&quot;') : '') + '" required></div>' +
    '<div class="form-group"><label>Категория</label><select name="category"><option value="">—</option>' + catOpts + '</select></div>' +
    '<div class="form-group"><label>Формат турнира</label><select name="format">' + formatOpts + '</select></div>' +
    '<div class="form-group"><label>URL изображения</label><input type="url" name="image" value="' + (ev ? (ev.image || '').replace(/"/g, '&quot;') : '') + '" placeholder="https://..."></div>';
  modal.classList.remove('modal--hidden');
}

function openLeaderModal(item) {
  currentMode = 'leader';
  currentEditId = item ? item.place : null;
  modalTitle.textContent = item ? 'Редактировать участника' : 'Добавить участника';
  modalFields.innerHTML =
    '<div class="form-group"><label>ФИО</label><input type="text" name="name" value="' + (item ? (item.name || '').replace(/"/g, '&quot;') : '') + '" required></div>' +
    '<div class="form-group"><label>Инициалы (2 буквы)</label><input type="text" name="initials" maxlength="2" value="' + (item ? (item.initials || '') : '') + '" placeholder="ИИ"></div>' +
    '<div class="form-group"><label>Группа</label><input type="text" name="group" value="' + (item ? (item.group || '') : '') + '" placeholder="1ИП-1-25"></div>' +
    '<div class="form-group"><label>ARcoin</label><input type="number" name="coins" value="' + (item ? item.coins : 0) + '" min="0"></div>' +
    '<div class="form-group"><label>Цвет аватарки (CSS)</label><input type="text" name="avatarColor" value="' + (item ? (item.avatarColor || '') : 'linear-gradient(135deg, #5582FF, #3d6ae6)') + '"></div>';
  modal.classList.remove('modal--hidden');
}

function closeModal() {
  modal.classList.add('modal--hidden');
  currentEditId = null;
  currentMode = null;
}

function saveEvent() {
  var form = modalForm;
  var events = getEvents();
  var data = { name: form.name.value, category: (form.category && form.category.value) || '', format: (form.format && form.format.value) || '1v1', image: form.image.value || '' };
  if (currentEditId) {
    var idx = events.findIndex(function(e) { return e.id === currentEditId; });
    if (idx >= 0) events[idx] = Object.assign({}, events[idx], data);
  } else {
    data.id = '' + (Date.now());
    events.push(data);
  }
  setEvents(events);
  renderEvents();
}

function saveLeader() {
  var form = modalForm;
  var items = getLeaderboard();
  var data = {
    name: form.name.value,
    initials: (form.initials.value || '??').slice(0, 2),
    group: form.group.value || '',
    coins: parseInt(form.coins.value, 10) || 0,
    avatarColor: form.avatarColor.value || 'linear-gradient(135deg, #5582FF, #3d6ae6)'
  };
  if (currentEditId !== null) {
    var idx = items.findIndex(function(i) { return i.place === currentEditId; });
    if (idx >= 0) items[idx] = Object.assign({}, items[idx], data);
  } else {
    data.place = items.length + 1;
    items.push(data);
  }
  reorderLeaderboard(items);
  setLeaderboard(items);
  renderLeaderboard();
}

function reorderLeaderboard(items) {
  items.forEach(function(item, i) { item.place = i + 1; });
}

function deleteEvent(id) {
  if (!confirm('Удалить мероприятие?')) return;
  var events = getEvents().filter(function(e) { return e.id !== id; });
  setEvents(events);
  renderEvents();
}

function deleteLeader(place) {
  if (!confirm('Удалить участника из лидерборда?')) return;
  var items = getLeaderboard().filter(function(i) { return i.place !== place; });
  reorderLeaderboard(items);
  setLeaderboard(items);
  renderLeaderboard();
}

function renderEvents() {
  var events = getEvents();
  eventsList.innerHTML = events.map(function(ev) {
    return '<div class="admin-item">' +
      '<div class="admin-item__info">' +
      '<p class="admin-item__title">' + (ev.name || 'Без названия') + '</p>' +
      '<p class="admin-item__sub">' + (ev.image ? 'Изображение задано' : 'Без изображения') + '</p>' +
      '</div>' +
      '<div class="admin-item__actions">' +
      '<button class="admin-btn admin-btn--small" data-edit-event="' + ev.id + '">Изменить</button>' +
      '<button class="admin-btn admin-btn--small admin-btn--danger" data-delete-event="' + ev.id + '">Удалить</button>' +
      '</div></div>';
  }).join('');

  eventsList.querySelectorAll('[data-edit-event]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var ev = events.find(function(e) { return e.id === btn.dataset.editEvent; });
      if (ev) openEventModal(ev);
    });
  });
  eventsList.querySelectorAll('[data-delete-event]').forEach(function(btn) {
    btn.addEventListener('click', function() { deleteEvent(btn.dataset.deleteEvent); });
  });
}

function renderLeaderboard() {
  var items = getLeaderboard();
  leaderboardList.innerHTML = items.map(function(item) {
    return '<div class="admin-item">' +
      '<div class="admin-item__info">' +
      '<p class="admin-item__title">' + item.place + '. ' + (item.name || '') + '</p>' +
      '<p class="admin-item__sub">' + (item.group || '') + ' · ' + (item.coins || 0) + ' ARcoin</p>' +
      '</div>' +
      '<div class="admin-item__actions">' +
      '<button class="admin-btn admin-btn--small" data-edit-leader="' + item.place + '">Изменить</button>' +
      '<button class="admin-btn admin-btn--small admin-btn--danger" data-delete-leader="' + item.place + '">Удалить</button>' +
      '</div></div>';
  }).join('');

  leaderboardList.querySelectorAll('[data-edit-leader]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = items.find(function(i) { return i.place === parseInt(btn.dataset.editLeader, 10); });
      if (item) openLeaderModal(item);
    });
  });
  leaderboardList.querySelectorAll('[data-delete-leader]').forEach(function(btn) {
    btn.addEventListener('click', function() { deleteLeader(parseInt(btn.dataset.deleteLeader, 10)); });
  });
}

function renderUsers() {
  if (!usersList) return;
  var users = getUsers();
  if (users.length === 0) {
    usersList.innerHTML = '<p class="admin-section__sub" style="margin-top:8px;color:rgba(255,255,255,0.5)">Нет зарегистрированных пользователей</p>';
    return;
  }
  usersList.innerHTML = users.map(function(u) {
    var email = (u.email || '').replace(/"/g, '&quot;');
    return '<div class="admin-item">' +
      '<div class="admin-item__info">' +
      '<p class="admin-item__title">' + (u.fio || '—') + '</p>' +
      '<p class="admin-item__sub">' + (u.email || '') + ' · ' + (u.group || '') + '</p>' +
      '</div>' +
      '<div class="admin-item__actions">' +
      '<button class="admin-btn admin-btn--small" data-user-email="' + email + '" data-user-fio="' + (u.fio || '').replace(/"/g, '&quot;') + '">Управление бронями</button>' +
      '<button class="admin-btn admin-btn--small admin-btn--primary" data-give-coins-email="' + email + '" data-give-coins-fio="' + (u.fio || '').replace(/"/g, '&quot;') + '">Выдать коины</button>' +
      '</div></div>';
  }).join('');

  usersList.querySelectorAll('[data-user-email]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openUserBookingsModal({ email: btn.dataset.userEmail, fio: btn.dataset.userFio || '' });
    });
  });
  usersList.querySelectorAll('[data-give-coins-email]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openGiveCoinsModal({ email: btn.dataset.giveCoinsEmail, fio: btn.dataset.giveCoinsFio || '' });
    });
  });
}

function openGiveCoinsModal(user) {
  currentGiveCoinsUser = user;
  document.getElementById('give-coins-title').textContent = 'Выдать коины: ' + (user.fio || user.email || '');
  document.getElementById('give-coins-amount').value = 10;
  giveCoinsModal.classList.remove('modal--hidden');
}

function closeGiveCoinsModal() {
  giveCoinsModal.classList.add('modal--hidden');
  currentGiveCoinsUser = null;
}

function saveGiveCoins() {
  if (!currentGiveCoinsUser) return;
  var amount = parseInt(document.getElementById('give-coins-amount').value, 10);
  if (isNaN(amount) || amount < 1) return;
  var items = getLeaderboard();
  var name = (currentGiveCoinsUser.fio || '').trim();
  var found = items.find(function(entry) { return (entry.name || '').trim() === name; });
  if (found) {
    found.coins = (found.coins || 0) + amount;
    setLeaderboard(items);
  } else {
    var users = getUsers();
    var u = users.find(function(x) { return (x.email || '') === (currentGiveCoinsUser.email || ''); });
    if (u) {
      items.push({
        name: u.fio || '',
        initials: typeof getInitialsFromName === 'function' ? getInitialsFromName(u.fio || '') : '?',
        avatarColor: u.avatarColor || 'linear-gradient(135deg, #5582FF, #3d6ae6)',
        group: u.group || '',
        coins: amount
      });
      setLeaderboard(items);
    }
  }
  closeGiveCoinsModal();
}

function openUserBookingsModal(user) {
  currentUserBookingsEmail = user.email;
  document.getElementById('user-bookings-title').textContent = 'Бронирования: ' + (user.fio || user.email || '');
  var bookings = getBookings();
  var activeByUser = [];
  Object.keys(bookings).forEach(function(seatId) {
    var b = bookings[seatId];
    if (b && b.userEmail === user.email) activeByUser.push({ seatId: seatId, time: b.time || '' });
  });
  var history = typeof getBookingHistoryByUser === 'function' ? getBookingHistoryByUser(user.email) : [];

  var activeList = document.getElementById('user-active-bookings');
  var activeEmpty = document.getElementById('user-active-empty');
  var historyList = document.getElementById('user-history-bookings');
  var historyEmpty = document.getElementById('user-history-empty');

  activeList.innerHTML = '';
  if (activeByUser.length === 0) {
    activeEmpty.style.display = 'block';
  } else {
    activeEmpty.style.display = 'none';
    activeByUser.forEach(function(b) {
      var row = document.createElement('div');
      row.className = 'user-booking-row';
      row.innerHTML = '<span class="user-booking-row__info">ПК №' + b.seatId + ' · ' + (b.time || '—') + '</span>' +
        '<button type="button" class="admin-btn admin-btn--small admin-btn--danger user-booking-row__btn" data-cancel-seat="' + b.seatId + '">Снять бронь</button>';
      activeList.appendChild(row);
      row.querySelector('[data-cancel-seat]').addEventListener('click', function() {
        cancelUserBooking(b.seatId);
        openUserBookingsModal(user);
      });
    });
  }

  historyList.innerHTML = '';
  if (history.length === 0) {
    historyEmpty.style.display = 'block';
  } else {
    historyEmpty.style.display = 'none';
    history.forEach(function(h, idx) {
      var dateStr = '';
      if (h.bookedAt) {
        try {
          var d = new Date(h.bookedAt);
          dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) {}
      }
      var row = document.createElement('div');
      row.className = 'user-booking-row user-booking-row--history';
      row.innerHTML = '<span class="user-booking-row__info">ПК №' + (h.seatId || '?') + ' · ' + (h.time || '—') + (dateStr ? ' · ' + dateStr : '') + '</span>' +
        '<button type="button" class="admin-btn admin-btn--small admin-btn--danger user-booking-row__btn" data-history-index="' + idx + '">Удалить</button>';
      historyList.appendChild(row);
      row.querySelector('[data-history-index]').addEventListener('click', function() {
        removeHistoryEntryByUserAndIndex(user.email, parseInt(this.dataset.historyIndex, 10));
        openUserBookingsModal(user);
      });
    });
  }

  userBookingsModal.classList.remove('modal--hidden');
}

function closeUserBookingsModal() {
  userBookingsModal.classList.add('modal--hidden');
  currentUserBookingsEmail = null;
}

function cancelUserBooking(seatId) {
  var bookings = getBookings();
  delete bookings[seatId];
  setBookings(bookings);
}

function removeHistoryEntryByUserAndIndex(userEmail, indexInUserList) {
  var history = getBookingHistory();
  var idx = -1;
  var count = 0;
  for (var i = 0; i < history.length; i++) {
    if (history[i].userEmail === userEmail) {
      if (count === indexInUserList) { idx = i; break; }
      count++;
    }
  }
  if (idx < 0) return;
  history.splice(idx, 1);
  setBookingHistory(history);
}

function renderTournamentsAdmin() {
  if (!tournamentsAdminList) return;
  var events = getEvents();
  if (events.length === 0) {
    tournamentsAdminList.innerHTML = '<p class="admin-section__sub" style="margin-top:8px;color:rgba(255,255,255,0.5)">Сначала добавьте мероприятия в разделе «Мероприятия»</p>';
    return;
  }
  tournamentsAdminList.innerHTML = events.map(function(ev) {
    var regCount = typeof getRegistrationsForEvent === 'function' ? getRegistrationsForEvent(ev.id).length : 0;
    var matchCount = typeof getMatchesForEvent === 'function' ? getMatchesForEvent(ev.id).length : 0;
    return '<div class="admin-item">' +
      '<div class="admin-item__info">' +
      '<p class="admin-item__title">' + (ev.name || 'Турнир') + '</p>' +
      '<p class="admin-item__sub">Записано: ' + regCount + ' · Матчей: ' + matchCount + ' · Наград: ' + (ev.rewards && ev.rewards.length ? ev.rewards.length : 0) + '</p>' +
      '</div>' +
      '<div class="admin-item__actions">' +
      '<button class="admin-btn admin-btn--small" data-tournament-matches="' + ev.id + '">Матчи</button>' +
      '<button class="admin-btn admin-btn--small admin-btn--primary" data-tournament-rewards="' + ev.id + '">Награды</button>' +
      '</div></div>';
  }).join('');

  tournamentsAdminList.querySelectorAll('[data-tournament-matches]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var ev = events.find(function(e) { return e.id === btn.dataset.tournamentMatches; });
      if (ev) openTournamentMatchesModal(ev);
    });
  });
  tournamentsAdminList.querySelectorAll('[data-tournament-rewards]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var ev = events.find(function(e) { return e.id === btn.dataset.tournamentRewards; });
      if (ev) openTournamentRewardsModal(ev);
    });
  });
}

function renderExchangePrices() {
  if (!exchangeFramesPricesEl || !exchangeBannersPricesEl) return;
  var frames = typeof getCustomizationFrames === 'function' ? getCustomizationFrames() : [];
  var banners = typeof getCustomizationBanners === 'function' ? getCustomizationBanners() : [];
  exchangeFramesPricesEl.innerHTML = frames.map(function(f, i) {
    return '<div class="admin-item admin-item--exchange-price">' +
      '<div class="admin-item__info">' +
      '<p class="admin-item__title">' + (f.name || f.id) + '</p>' +
      '<p class="admin-item__sub">id: ' + (f.id || '') + '</p>' +
      '</div>' +
      '<div class="admin-item__actions"><label class="admin-exchange-price-label">Цена (ARcoins)</label><input type="number" class="admin-input admin-input--score" data-exchange-id="' + (f.id || '') + '" data-exchange-type="frame" value="' + (f.price != null ? f.price : 0) + '" min="0"></div></div>';
  }).join('');
  exchangeBannersPricesEl.innerHTML = banners.map(function(b, i) {
    return '<div class="admin-item admin-item--exchange-price">' +
      '<div class="admin-item__info">' +
      '<p class="admin-item__title">' + (b.name || b.id) + '</p>' +
      '<p class="admin-item__sub">id: ' + (b.id || '') + (b.customGif ? ' · своя гифка' : '') + '</p>' +
      '</div>' +
      '<div class="admin-item__actions"><label class="admin-exchange-price-label">Цена (ARcoins)</label><input type="number" class="admin-input admin-input--score" data-exchange-id="' + (b.id || '') + '" data-exchange-type="banner" value="' + (b.price != null ? b.price : 0) + '" min="0"></div></div>';
  }).join('');
}

function saveExchangePrices() {
  var frames = typeof getCustomizationFrames === 'function' ? getCustomizationFrames() : [];
  var banners = typeof getCustomizationBanners === 'function' ? getCustomizationBanners() : [];
  exchangeFramesPricesEl.querySelectorAll('input[data-exchange-type="frame"]').forEach(function(inp) {
    var id = inp.dataset.exchangeId;
    var price = parseInt(inp.value, 10);
    if (isNaN(price) || price < 0) price = 0;
    var f = frames.find(function(x) { return x.id === id; });
    if (f) f.price = price;
  });
  exchangeBannersPricesEl.querySelectorAll('input[data-exchange-type="banner"]').forEach(function(inp) {
    var id = inp.dataset.exchangeId;
    var price = parseInt(inp.value, 10);
    if (isNaN(price) || price < 0) price = 0;
    var b = banners.find(function(x) { return x.id === id; });
    if (b) b.price = price;
  });
  if (typeof setCustomizationFrames === 'function') setCustomizationFrames(frames);
  if (typeof setCustomizationBanners === 'function') setCustomizationBanners(banners);
}

function openTournamentMatchesModal(ev) {
  currentTournamentMatchesEventId = ev.id;
  currentTournamentMatchesFormat = ev.format || '1v1';
  var teamSize = currentTournamentMatchesFormat === '5v5' ? 5 : currentTournamentMatchesFormat === '3v3' ? 3 : 0;
  var isTeamFormat = teamSize > 0;

  document.getElementById('tournament-matches-title').textContent = 'Матчи турнира';
  document.getElementById('tournament-matches-event-name').textContent = (ev.name || ev.id) + ' (' + (ev.format || '1v1') + ')';

  var matches = typeof getMatchesForEvent === 'function' ? getMatchesForEvent(ev.id) : [];
  if (matches.length === 0 && typeof ensureDefaultMatchesForEvent === 'function') {
    matches = ensureDefaultMatchesForEvent(ev.id);
  }
  if (matches.length === 0) {
    matches = [];
    if (isTeamFormat) {
      for (var i = 0; i < 4; i++) {
        var t1 = []; var t2 = [];
        for (var k = 0; k < teamSize; k++) { t1.push(null); t2.push(null); }
        matches.push({ id: i + 1, round: 1, team1: t1, team2: t2, score1: null, score2: null });
      }
    } else {
      for (var j = 0; j < 8; j++) {
        matches.push({ id: j + 1, round: 1, player1: null, player2: null, score1: null, score2: null });
      }
    }
  }

  var thead = document.getElementById('tournament-matches-thead');
  var tbody = document.getElementById('tournament-matches-tbody');
  var users = typeof getUsers === 'function' ? getUsers() : [];
  var regs = typeof getRegistrationsForEvent === 'function' ? getRegistrationsForEvent(ev.id) : [];

  if (isTeamFormat) {
    var thTeam1 = '';
    var thTeam2 = '';
    for (var t = 0; t < teamSize; t++) {
      thTeam1 += '<th>Ком1 · ' + (t + 1) + '</th>';
      thTeam2 += '<th>Ком2 · ' + (t + 1) + '</th>';
    }
    thead.innerHTML = '<tr><th>Матч</th>' + thTeam1 + thTeam2 + '<th>Счёт 1</th><th>Счёт 2</th><th class="tournament-matches-admin-table__th--narrow"></th></tr>';
    tbody.innerHTML = matches.map(function(m) {
      var team1 = m.team1 || [];
      var team2 = m.team2 || [];
      var s1 = m.score1 != null && m.score1 !== '' ? m.score1 : '';
      var s2 = m.score2 != null && m.score2 !== '' ? m.score2 : '';
      var row = '<tr data-match-id="' + m.id + '"><td>Матч ' + m.id + '</td>';
      for (var s = 0; s < teamSize; s++) {
        var v = (team1[s] || '').replace(/"/g, '&quot;');
        row += '<td><input type="text" class="admin-input admin-input--team" data-team="1" data-slot="' + s + '" value="' + v + '" list="tournament-matches-datalist" placeholder="email"></td>';
      }
      for (var s2 = 0; s2 < teamSize; s2++) {
        var v2 = (team2[s2] || '').replace(/"/g, '&quot;');
        row += '<td><input type="text" class="admin-input admin-input--team" data-team="2" data-slot="' + s2 + '" value="' + v2 + '" list="tournament-matches-datalist" placeholder="email"></td>';
      }
      row += '<td><input type="number" class="admin-input admin-input--score" data-field="score1" value="' + s1 + '" min="0" placeholder="0"></td>';
      row += '<td><input type="number" class="admin-input admin-input--score" data-field="score2" value="' + s2 + '" min="0" placeholder="0"></td>';
      row += '<td class="tournament-matches-admin-table__td--narrow"><button type="button" class="admin-btn admin-btn--small admin-btn--danger tournament-match-remove" title="Удалить матч">×</button></td></tr>';
      return row;
    }).join('');
  } else {
    thead.innerHTML = '<tr><th>Матч</th><th>Участник 1 (email)</th><th>Участник 2 (email)</th><th>Счёт 1</th><th>Счёт 2</th><th class="tournament-matches-admin-table__th--narrow"></th></tr>';
    tbody.innerHTML = matches.map(function(m) {
      var p1 = (m.player1 || '').replace(/"/g, '&quot;');
      var p2 = (m.player2 || '').replace(/"/g, '&quot;');
      var s1 = m.score1 != null && m.score1 !== '' ? m.score1 : '';
      var s2 = m.score2 != null && m.score2 !== '' ? m.score2 : '';
      return '<tr data-match-id="' + m.id + '">' +
        '<td>Матч ' + m.id + '</td>' +
        '<td><input type="text" class="admin-input admin-input--full" data-field="player1" value="' + p1 + '" list="tournament-matches-datalist" placeholder="email"></td>' +
        '<td><input type="text" class="admin-input admin-input--full" data-field="player2" value="' + p2 + '" list="tournament-matches-datalist" placeholder="email"></td>' +
        '<td><input type="number" class="admin-input admin-input--score" data-field="score1" value="' + s1 + '" min="0" placeholder="0"></td>' +
        '<td><input type="number" class="admin-input admin-input--score" data-field="score2" value="' + s2 + '" min="0" placeholder="0"></td>' +
        '<td class="tournament-matches-admin-table__td--narrow"><button type="button" class="admin-btn admin-btn--small admin-btn--danger tournament-match-remove" title="Удалить матч">×</button></td>' +
        '</tr>';
    }).join('');
  }

  tbody.querySelectorAll('.tournament-match-remove').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tr = btn.closest('tr');
      if (tbody.querySelectorAll('tr').length <= 1) return;
      tr.remove();
      renumberTournamentMatchesRows();
      updateTournamentMatchesCount();
    });
  });

  var addBtn = document.getElementById('tournament-matches-add');
  if (addBtn) {
    addBtn.onclick = function() {
      addOneTournamentMatchRow(tbody, isTeamFormat, teamSize);
    };
  }
  updateTournamentMatchesCount();

  var dl = document.getElementById('tournament-matches-datalist');
  if (!dl) {
    dl = document.createElement('datalist');
    dl.id = 'tournament-matches-datalist';
    tournamentMatchesModal.querySelector('.modal__content').appendChild(dl);
  }
  dl.innerHTML = '';
  regs.forEach(function(email) {
    var opt = document.createElement('option');
    opt.value = email || '';
    dl.appendChild(opt);
  });
  users.forEach(function(u) {
    if (regs.indexOf(u.email || '') === -1) {
      var opt = document.createElement('option');
      opt.value = u.email || '';
      dl.appendChild(opt);
    }
  });

  tournamentMatchesModal.classList.remove('modal--hidden');
}

function addOneTournamentMatchRow(tbody, isTeamFormat, teamSize) {
  var rows = tbody.querySelectorAll('tr[data-match-id]');
  var nextId = 1;
  rows.forEach(function(r) {
    var id = parseInt(r.dataset.matchId, 10);
    if (!isNaN(id) && id >= nextId) nextId = id + 1;
  });
  var tr = document.createElement('tr');
  tr.dataset.matchId = nextId;
  if (isTeamFormat) {
    var row = '<td>Матч ' + nextId + '</td>';
    for (var s = 0; s < teamSize; s++) {
      row += '<td><input type="text" class="admin-input admin-input--team" data-team="1" data-slot="' + s + '" value="" list="tournament-matches-datalist" placeholder="email"></td>';
    }
    for (var s2 = 0; s2 < teamSize; s2++) {
      row += '<td><input type="text" class="admin-input admin-input--team" data-team="2" data-slot="' + s2 + '" value="" list="tournament-matches-datalist" placeholder="email"></td>';
    }
    row += '<td><input type="number" class="admin-input admin-input--score" data-field="score1" value="" min="0" placeholder="0"></td>';
    row += '<td><input type="number" class="admin-input admin-input--score" data-field="score2" value="" min="0" placeholder="0"></td>';
    row += '<td class="tournament-matches-admin-table__td--narrow"><button type="button" class="admin-btn admin-btn--small admin-btn--danger tournament-match-remove" title="Удалить матч">×</button></td>';
    tr.innerHTML = row;
  } else {
    tr.innerHTML = '<td>Матч ' + nextId + '</td>' +
      '<td><input type="text" class="admin-input admin-input--full" data-field="player1" value="" list="tournament-matches-datalist" placeholder="email"></td>' +
      '<td><input type="text" class="admin-input admin-input--full" data-field="player2" value="" list="tournament-matches-datalist" placeholder="email"></td>' +
      '<td><input type="number" class="admin-input admin-input--score" data-field="score1" value="" min="0" placeholder="0"></td>' +
      '<td><input type="number" class="admin-input admin-input--score" data-field="score2" value="" min="0" placeholder="0"></td>' +
      '<td class="tournament-matches-admin-table__td--narrow"><button type="button" class="admin-btn admin-btn--small admin-btn--danger tournament-match-remove" title="Удалить матч">×</button></td>';
  }
  tbody.appendChild(tr);
  tr.querySelector('.tournament-match-remove').addEventListener('click', function() {
    if (tbody.querySelectorAll('tr').length <= 1) return;
    tr.remove();
    renumberTournamentMatchesRows();
    updateTournamentMatchesCount();
  });
  renumberTournamentMatchesRows();
  updateTournamentMatchesCount();
}

function closeTournamentMatchesModal() {
  tournamentMatchesModal.classList.add('modal--hidden');
  currentTournamentMatchesEventId = null;
}

function updateTournamentMatchesCount() {
  var tbody = document.getElementById('tournament-matches-tbody');
  var countEl = document.getElementById('tournament-matches-count');
  if (countEl && tbody) {
    var n = tbody.querySelectorAll('tr[data-match-id]').length;
    countEl.textContent = n;
  }
}

function renumberTournamentMatchesRows() {
  var tbody = document.getElementById('tournament-matches-tbody');
  if (!tbody) return;
  var rows = tbody.querySelectorAll('tr[data-match-id]');
  rows.forEach(function(row, i) {
    var newId = i + 1;
    row.dataset.matchId = newId;
    var firstTd = row.querySelector('td:first-child');
    if (firstTd) firstTd.textContent = 'Матч ' + newId;
  });
}

function saveTournamentMatches() {
  if (!currentTournamentMatchesEventId) return;
  var tbody = document.getElementById('tournament-matches-tbody');
  var rows = tbody.querySelectorAll('tr[data-match-id]');
  var matches = [];
  var teamSize = currentTournamentMatchesFormat === '5v5' ? 5 : currentTournamentMatchesFormat === '3v3' ? 3 : 0;
  var isTeamFormat = teamSize > 0;

  rows.forEach(function(row, i) {
    var matchId = i + 1;
    var score1Val = row.querySelector('[data-field="score1"]').value;
    var score2Val = row.querySelector('[data-field="score2"]').value;
    var score1 = score1Val === '' ? null : parseInt(score1Val, 10);
    var score2 = score2Val === '' ? null : parseInt(score2Val, 10);

    if (isTeamFormat) {
      var team1 = [];
      var team2 = [];
      for (var s = 0; s < teamSize; s++) {
        var in1 = row.querySelector('[data-team="1"][data-slot="' + s + '"]');
        var in2 = row.querySelector('[data-team="2"][data-slot="' + s + '"]');
        team1.push((in1 && in1.value) ? (in1.value.trim() || null) : null);
        team2.push((in2 && in2.value) ? (in2.value.trim() || null) : null);
      }
      matches.push({ id: matchId, round: 1, team1: team1, team2: team2, score1: score1, score2: score2 });
    } else {
      var player1 = (row.querySelector('[data-field="player1"]') && row.querySelector('[data-field="player1"]').value) ? (row.querySelector('[data-field="player1"]').value.trim() || null) : null;
      var player2 = (row.querySelector('[data-field="player2"]') && row.querySelector('[data-field="player2"]').value) ? (row.querySelector('[data-field="player2"]').value.trim() || null) : null;
      matches.push({ id: matchId, round: 1, player1: player1, player2: player2, score1: score1, score2: score2 });
    }
  });
  var all = typeof getTournamentMatches === 'function' ? getTournamentMatches() : {};
  all[currentTournamentMatchesEventId] = matches;
  if (typeof setTournamentMatches === 'function') setTournamentMatches(all);
  renderTournamentsAdmin();
  closeTournamentMatchesModal();
}

function openTournamentRewardsModal(ev) {
  currentTournamentRewardsEventId = ev.id;
  document.getElementById('tournament-rewards-title').textContent = 'Награды турнира';
  document.getElementById('tournament-rewards-event-name').textContent = ev.name || ev.id;

  var rewards = ev.rewards && ev.rewards.length ? ev.rewards.slice() : [
    { place: 1, text: '100 ARcoins' },
    { place: 2, text: '50 ARcoins' },
    { place: 3, text: '25 ARcoins' }
  ];

  var tbody = document.getElementById('tournament-rewards-tbody');
  tbody.innerHTML = rewards.map(function(r, idx) {
    var text = (r.text || '').replace(/"/g, '&quot;');
    return '<tr data-reward-index="' + idx + '">' +
      '<td><input type="number" class="admin-input admin-input--place" data-field="place" value="' + (r.place != null ? r.place : idx + 1) + '" min="1"></td>' +
      '<td><input type="text" class="admin-input admin-input--full" data-field="text" value="' + text + '" placeholder="100 ARcoins"></td>' +
      '<td><button type="button" class="admin-btn admin-btn--small admin-btn--danger tournament-reward-remove">×</button></td>' +
      '</tr>';
  }).join('');

  tbody.querySelectorAll('.tournament-reward-remove').forEach(function(btn) {
    btn.addEventListener('click', function() {
      btn.closest('tr').remove();
    });
  });

  tournamentRewardsModal.classList.remove('modal--hidden');
}

function addTournamentRewardRow() {
  var tbody = document.getElementById('tournament-rewards-tbody');
  var rows = tbody.querySelectorAll('tr');
  var nextPlace = 1;
  rows.forEach(function(row) {
    var placeInput = row.querySelector('[data-field="place"]');
    if (placeInput) {
      var p = parseInt(placeInput.value, 10);
      if (!isNaN(p) && p >= nextPlace) nextPlace = p + 1;
    }
  });
  var idx = rows.length;
  var tr = document.createElement('tr');
  tr.dataset.rewardIndex = idx;
  tr.innerHTML = '<td><input type="number" class="admin-input admin-input--place" data-field="place" value="' + nextPlace + '" min="1"></td>' +
    '<td><input type="text" class="admin-input admin-input--full" data-field="text" value="" placeholder="Награда"></td>' +
    '<td><button type="button" class="admin-btn admin-btn--small admin-btn--danger tournament-reward-remove">×</button></td>';
  tbody.appendChild(tr);
  tr.querySelector('.tournament-reward-remove').addEventListener('click', function() {
    tr.remove();
  });
}

function closeTournamentRewardsModal() {
  tournamentRewardsModal.classList.add('modal--hidden');
  currentTournamentRewardsEventId = null;
}

function saveTournamentRewards() {
  if (!currentTournamentRewardsEventId) return;
  var tbody = document.getElementById('tournament-rewards-tbody');
  var rows = tbody.querySelectorAll('tr[data-reward-index]');
  var rewards = [];
  rows.forEach(function(row) {
    var place = parseInt(row.querySelector('[data-field="place"]').value, 10);
    var text = (row.querySelector('[data-field="text"]').value || '').trim();
    if (!isNaN(place) && place >= 1) rewards.push({ place: place, text: text });
  });
  rewards.sort(function(a, b) { return a.place - b.place; });

  var events = getEvents();
  var ev = events.find(function(e) { return e.id === currentTournamentRewardsEventId; });
  if (ev) {
    ev.rewards = rewards;
    setEvents(events);
  }
  renderTournamentsAdmin();
  closeTournamentRewardsModal();
}
