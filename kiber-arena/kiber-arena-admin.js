/* Админ-панель — управление мероприятиями и лидербордом */

initStorage();

var eventsList = document.getElementById('events-list');
var leaderboardList = document.getElementById('leaderboard-list');
var modal = document.getElementById('modal');
var modalTitle = document.getElementById('modal-title');
var modalForm = document.getElementById('modal-form');
var modalFields = document.getElementById('modal-fields');
var modalCancel = document.getElementById('modal-cancel');
var currentEditId = null;
var currentMode = null;

renderEvents();
renderLeaderboard();

document.getElementById('add-event-btn').addEventListener('click', function() {
  openEventModal(null);
});

document.getElementById('add-leader-btn').addEventListener('click', function() {
  openLeaderModal(null);
});

modalCancel.addEventListener('click', closeModal);
modal.querySelector('.modal__overlay').addEventListener('click', closeModal);

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
  modalFields.innerHTML =
    '<div class="form-group"><label>Название</label><input type="text" name="name" value="' + (ev ? (ev.name || '').replace(/"/g, '&quot;') : '') + '" required></div>' +
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
  var data = { name: form.name.value, image: form.image.value || '' };
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
