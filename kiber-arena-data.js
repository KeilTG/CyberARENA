/* Хранилище данных — localStorage */

const STORAGE_KEYS = {
  events: 'kiber_arena_events',
  leaderboard: 'kiber_arena_leaderboard',
  bookings: 'kiber_arena_bookings',
  bookingHistory: 'kiber_arena_booking_history',
  users: 'kiber_arena_users',
  currentUser: 'kiber_arena_current_user'
};

var PC_SPECS = [];
function initPcSpecs() {
  var gpus = ['RTX 4060', 'RTX 4070', 'RTX 4060 Ti', 'RTX 4070 Ti', 'RX 7600', 'RX 7700 XT'];
  var cpus = ['Ryzen 5 7600', 'Ryzen 7 7700X', 'Core i5-13400', 'Core i7-13700'];
  var rams = ['16 GB DDR5', '32 GB DDR5'];
  for (var i = 0; i < 36; i++) {
    PC_SPECS.push({
      id: i + 1,
      gpu: gpus[i % gpus.length],
      cpu: cpus[i % cpus.length],
      ram: rams[i % 2],
      monitor: '24" 165Hz'
    });
  }
}

const EVENT_CATEGORIES = ['CS2', 'Valorant', 'Clash Royale', 'Brawl Stars', 'Fortnite', 'WOT'];

const DEFAULT_EVENTS = [
  { id: '1', name: 'Турнир по CS2', category: 'CS2', image: 'https://picsum.photos/400/300?random=1', description: '' },
  { id: '2', name: 'Лига Valorant', category: 'Valorant', image: 'https://picsum.photos/400/300?random=2', description: '' },
  { id: '3', name: 'Кубок Fortnite', category: 'Fortnite', image: 'https://picsum.photos/400/300?random=3', description: '' },
  { id: '4', name: 'Арена Clash Royale', category: 'Clash Royale', image: 'https://picsum.photos/400/300?random=4', description: '' },
  { id: '5', name: 'Битва Brawl Stars', category: 'Brawl Stars', image: 'https://picsum.photos/400/300?random=5', description: '' },
  { id: '6', name: 'Танковый марафон WOT', category: 'WOT', image: 'https://picsum.photos/400/300?random=6', description: '' }
];

function initStorage() {
  initPcSpecs();
  if (!localStorage.getItem(STORAGE_KEYS.events)) {
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(DEFAULT_EVENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.leaderboard)) {
    localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify([]));
  } else {
    var users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
    var lb = JSON.parse(localStorage.getItem(STORAGE_KEYS.leaderboard) || '[]');
    var lbByName = {};
    lb.forEach(function(entry) { lbByName[(entry.name || '').trim()] = entry; });
    var newLb = [];
    users.forEach(function(u, i) {
      var name = (u.fio || '').trim();
      if (!name) return;
      var existing = lbByName[name];
      if (existing) {
        newLb.push(existing);
      } else {
        newLb.push({
          name: name,
          initials: getInitialsFromName(name),
          avatarColor: AVATAR_COLORS[newLb.length % AVATAR_COLORS.length],
          group: u.group || '',
          coins: 0
        });
      }
    });
    localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(newLb));
  }
  if (!localStorage.getItem(STORAGE_KEYS.bookings)) {
    localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify({}));
  }
  if (!localStorage.getItem(STORAGE_KEYS.bookingHistory)) {
    localStorage.setItem(STORAGE_KEYS.bookingHistory, JSON.stringify([]));
  }
}

function getBookingHistory() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.bookingHistory) || '[]');
}

function addToBookingHistory(entry) {
  var history = getBookingHistory();
  history.unshift(entry);
  localStorage.setItem(STORAGE_KEYS.bookingHistory, JSON.stringify(history));
}

function getBookingHistoryByUser(userEmail) {
  return getBookingHistory().filter(function(e) { return e.userEmail === userEmail; });
}

function getBookings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || '{}');
}

function setBookings(bookings) {
  localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
}

function getEvents() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.events) || '[]');
}

function setEvents(events) {
  localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
}

function getLeaderboard() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.leaderboard) || '[]');
}

function setLeaderboard(items) {
  localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(items));
}

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
}

function setUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function getCurrentUser() {
  var data = localStorage.getItem(STORAGE_KEYS.currentUser);
  return data ? JSON.parse(data) : null;
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }
}

function updateUserAvatar(userEmail, avatarUrl) {
  var users = getUsers();
  var idx = users.findIndex(function(u) { return u.email === userEmail; });
  if (idx >= 0) {
    users[idx].avatarUrl = avatarUrl || null;
    setUsers(users);
  }
  var cur = getCurrentUser();
  if (cur && cur.email === userEmail) {
    cur.avatarUrl = avatarUrl || null;
    setCurrentUser(cur);
  }
}

function getInitialsFromName(name) {
  if (!name || !name.trim()) return '?';
  var parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

function formatNameAsSurnameInitials(name) {
  if (!name || !name.trim()) return '';
  var parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  var surname = parts[0];
  var initials = parts.slice(1).map(function(p) { return p.charAt(0).toUpperCase() + '.'; }).join('');
  return surname + ' ' + initials;
}

var AVATAR_COLORS = [
  'linear-gradient(135deg, #e8b923, #d4942e)',
  'linear-gradient(135deg, #6eb5ff, #4a90d9)',
  'linear-gradient(135deg, #ff9ecd, #e85a9a)',
  'linear-gradient(135deg, #7ed957, #5cb83d)',
  'linear-gradient(135deg, #b388ff, #7c4dff)',
  'linear-gradient(135deg, #80deea, #26c6da)'
];

function addUserToLeaderboard(name, group) {
  var items = getLeaderboard();
  var initials = getInitialsFromName(name);
  var colorIndex = items.length % AVATAR_COLORS.length;
  items.push({
    name: name,
    initials: initials,
    avatarColor: AVATAR_COLORS[colorIndex],
    group: group || '',
    coins: 0
  });
  setLeaderboard(items);
}
