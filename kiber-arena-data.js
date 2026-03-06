/* Хранилище данных — localStorage */

// Для совместимости с localStorage
const STORAGE_KEYS = {
  events: 'kiber_arena_events',
  leaderboard: 'kiber_arena_leaderboard',
  bookings: 'kiber_arena_bookings',
  bookingHistory: 'kiber_arena_booking_history',
  bookingScheme: 'kiber_arena_booking_scheme',
  users: 'kiber_arena_users',
  currentUser: 'kiber_arena_current_user',
  userCustomization: 'kiber_arena_user_customization',
  customizationFrames: 'kiber_arena_customization_frames',
  customizationBanners: 'kiber_arena_customization_banners',
  tournamentRegistrations: 'kiber_arena_tournament_registrations',
  tournamentMatches: 'kiber_arena_tournament_matches',
  tournamentResults: 'kiber_arena_tournament_results',
  userAchievements: 'kiber_arena_user_achievements',
  activityLog: 'kiber_arena_activity_log',
  noShows: 'kiber_arena_no_shows'
};
const STORAGE_KEYS = {
  
  events: 'kiber_arena_events',
  leaderboard: 'kiber_arena_leaderboard',
  bookings: 'kiber_arena_bookings',
  bookingHistory: 'kiber_arena_booking_history',
  bookingScheme: 'kiber_arena_booking_scheme',
  bookingSlots: 'kiber_arena_booking_slots',
  users: 'kiber_arena_users',
  currentUser: 'kiber_arena_current_user',
  userCustomization: 'kiber_arena_user_customization',
  customizationFrames: 'kiber_arena_customization_frames',
  customizationBanners: 'kiber_arena_customization_banners',
  tournamentRegistrations: 'kiber_arena_tournament_registrations',
  tournamentMatches: 'kiber_arena_tournament_matches',
  tournamentResults: 'kiber_arena_tournament_results',
  userAchievements: 'kiber_arena_user_achievements',
  activityLog: 'kiber_arena_activity_log',
  noShows: 'kiber_arena_no_shows',
  teams: 'kiber_arena_teams'
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

/**
 * Редактируемая схема зала для бронирования.
 * Можно менять размеры, позиции и количество мест под своё пространство.
 * Зоны PS1, PS2, VIP в схему не входят — только компьютерные места.
 *
 * Формат зоны: x, y — позиция блока в % от размера пола; width, height — размер блока в %;
 * rows, cols — сетка мест; startSeatId — с какого номера места начинается нумерация.
 * Можно добавить несколько зон (например, два блока по разным сторонам зала).
 */
var DEFAULT_BOOKING_SCHEME = {
  floorWidth: 100,
  floorHeight: 100,
  zones: [
    {
      id: 'hall',
      name: 'Основной зал',
      x: 10,
      y: 15,
      width: 80,
      height: 70,
      rows: 4,
      cols: 7,
      startSeatId: 1,
      status: 'open',
      accessRule: 'all',
      maxHoursPerUser: 0,
      priority: 1
    }
  ]
};

/** Для обратной совместимости */
var BOOKING_SCHEME = DEFAULT_BOOKING_SCHEME;

/** Стандартные слоты времени для бронирования (если админ ещё ничего не настроил). */
var DEFAULT_BOOKING_SLOTS = [
  { start: '10:00', end: '10:20' },
  { start: '10:30', end: '10:50' },
  { start: '11:50', end: '12:10' },
  { start: '12:20', end: '12:40' },
  { start: '13:40', end: '14:00' },
  { start: '14:10', end: '14:30' },
  { start: '15:30', end: '15:50' },
  { start: '16:00', end: '16:20' }
];

const EVENT_CATEGORIES = ['CS2', 'Valorant', 'Clash Royale', 'Brawl Stars', 'Fortnite', 'WOT'];

var DEFAULT_CUSTOMIZATION_FRAMES = [
  { id: 'frame-none', name: 'Без рамки', price: 0 },
  { id: 'frame-gold', name: 'Золотая рамка', price: 15 },
  { id: 'frame-neon', name: 'Неоновая рамка', price: 25 },
  { id: 'frame-silver', name: 'Серебряная рамка', price: 20 },
  { id: 'frame-rainbow', name: 'Радужная рамка', price: 35 }
];
var DEFAULT_CUSTOMIZATION_BANNERS = [
  { id: 'banner-none', name: 'Без баннера', price: 0 },
  { id: 'banner-blue', name: 'Синий градиент', price: 20 },
  { id: 'banner-purple', name: 'Фиолетовый градиент', price: 25 },
  { id: 'banner-fire', name: 'Огненный градиент', price: 30 },
  { id: 'banner-cyber', name: 'Кибер-сетка', price: 40 },
  { id: 'banner-gif', name: 'Баннер с гифкой', price: 700, customGif: true }
];

/** Готовые гифки для баннеров — покупаются за коины и отображаются в профиле */
var DEFAULT_READY_GIF_BANNERS = [
  { id: 'gif-banner-1', name: 'Кибер-неон', gifUrl: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif', price: 35 },
  { id: 'gif-banner-2', name: 'Огонь', gifUrl: 'https://media.giphy.com/media/3o7TKsQ8MJHyTASOry/giphy.gif', price: 45 },
  { id: 'gif-banner-3', name: 'Звёзды', gifUrl: 'https://media.giphy.com/media/3o6ZtaO9BZHlOJa8oo/giphy.gif', price: 55 },
  { id: 'gif-banner-4', name: 'Волны', gifUrl: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif', price: 65 },
  { id: 'gif-banner-5', name: 'Геометрия', gifUrl: 'https://media.giphy.com/media/3o6Mbk5SYnByJ8QCyE/giphy.gif', price: 80 },
  { id: 'gif-banner-6', name: 'Космос', gifUrl: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif', price: 100 }
];

const TOURNAMENT_FORMATS = ['1v1', '3v3', '5v5'];

function getTeamSizeForFormat(format) {
  if (format === '3v3') return 3;
  if (format === '5v5') return 5;
  return 1;
}

const DEFAULT_EVENTS = [
  { id: '1', name: 'Турнир по CS2', category: 'CS2', format: '1v1', image: 'https://picsum.photos/400/300?random=1', description: 'Одиночный турнир 1v1. Формат: до двух побед. Регистрация до начала турнира.', date: '15.04.2026', time: '18:00', maxParticipants: 16, rewards: [{ place: 1, text: '100 ARcoins' }, { place: 2, text: '50 ARcoins' }, { place: 3, text: '25 ARcoins' }] },
  { id: '2', name: 'Лига Valorant', category: 'Valorant', format: '5v5', image: 'https://picsum.photos/400/300?random=2', description: 'Командный турнир 5v5. Составы формируются на месте.', date: '22.04.2026', time: '17:00', maxParticipants: 32, rewards: [{ place: 1, text: '200 ARcoins (команда)' }, { place: 2, text: '100 ARcoins' }, { place: 3, text: '50 ARcoins' }] },
  { id: '3', name: 'Кубок Fortnite', category: 'Fortnite', format: '1v1', image: 'https://picsum.photos/400/300?random=3', description: 'Королевская битва. Три игры по лучшему результату.', date: '10.04.2026', time: '19:00', maxParticipants: 24, rewards: [{ place: 1, text: '150 ARcoins' }, { place: 2, text: '75 ARcoins' }, { place: 3, text: '30 ARcoins' }] },
  { id: '4', name: 'Арена Clash Royale', category: 'Clash Royale', format: '1v1', image: 'https://picsum.photos/400/300?random=4', description: 'Турнир в формате лестницы. Один проигрыш — выбывание.', date: '18.04.2026', time: '18:30', maxParticipants: 16, rewards: [{ place: 1, text: '80 ARcoins' }, { place: 2, text: '40 ARcoins' }, { place: 3, text: '20 ARcoins' }] },
  { id: '5', name: 'Битва Brawl Stars', category: 'Brawl Stars', format: '3v3', image: 'https://picsum.photos/400/300?random=5', description: 'Командные матчи 3v3. Групповая стадия и плей-офф.', date: '25.04.2026', time: '17:30', maxParticipants: 24, rewards: [{ place: 1, text: '120 ARcoins' }, { place: 2, text: '60 ARcoins' }, { place: 3, text: '30 ARcoins' }] },
  { id: '6', name: 'Танковый марафон WOT', category: 'WOT', format: '5v5', image: 'https://picsum.photos/400/300?random=6', description: 'Серия командных боёв. Побеждает команда с большим числом побед.', date: '12.04.2026', time: '18:00', maxParticipants: 20, rewards: [{ place: 1, text: '100 ARcoins' }, { place: 2, text: '50 ARcoins' }, { place: 3, text: '25 ARcoins' }] }
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
  if (!localStorage.getItem(STORAGE_KEYS.bookingScheme)) {
    localStorage.setItem(STORAGE_KEYS.bookingScheme, JSON.stringify(DEFAULT_BOOKING_SCHEME));
  }
  if (!localStorage.getItem(STORAGE_KEYS.activityLog)) {
    localStorage.setItem(STORAGE_KEYS.activityLog, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.noShows)) {
    localStorage.setItem(STORAGE_KEYS.noShows, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.teams)) {
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.customizationFrames)) {
    localStorage.setItem(STORAGE_KEYS.customizationFrames, JSON.stringify(DEFAULT_CUSTOMIZATION_FRAMES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.customizationBanners)) {
    localStorage.setItem(STORAGE_KEYS.customizationBanners, JSON.stringify(DEFAULT_CUSTOMIZATION_BANNERS));
  }
  migrateBookingsToZoneKeys();
}

/** Ключ бронирования: зона и место не пересекаются между зонами */
function getBookingKey(zoneId, seatId) {
  return (zoneId || 'hall') + '_' + seatId;
}

function migrateBookingsToZoneKeys() {
  var b = JSON.parse(localStorage.getItem(STORAGE_KEYS.bookings) || '{}');
  var scheme = getBookingScheme();
  var first = scheme.zones && scheme.zones[0];
  if (!first) return;
  var changed = false;
  var out = {};
  for (var k in b) {
    if (k.indexOf('_') >= 0) {
      out[k] = b[k];
      continue;
    }
    changed = true;
    var newKey = getBookingKey(first.id, k);
    out[newKey] = Object.assign({}, b[k], { zoneId: first.id, zoneName: first.name || first.id, seatId: parseInt(k, 10) || k });
  }
  if (changed) localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(out));
}

function getBookingHistory() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.bookingHistory) || '[]');
}

function setBookingHistory(history) {
  localStorage.setItem(STORAGE_KEYS.bookingHistory, JSON.stringify(history || []));
}

function addToBookingHistory(entry) {
  var history = getBookingHistory();
  history.unshift(entry);
  setBookingHistory(history);
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

/**
 * Текущее состояние компьютеров (ПК №1–28) в формате JSON.
 * Использует схему зала и локальные бронирования.
 */
function getComputersBookingJson() {
  var scheme = getBookingScheme();
  var zone = scheme && scheme.zones && scheme.zones[0];
  var rows = zone && zone.rows ? zone.rows : 0;
  var cols = zone && zone.cols ? zone.cols : 0;
  var total = rows * cols || 28; // по умолчанию 28 мест
  var bookings = getBookings();
  var out = [];
  var zoneId = zone && zone.id ? zone.id : 'hall';
  for (var i = 1; i <= total; i++) {
    var key = typeof getBookingKey === 'function' ? getBookingKey(zoneId, i) : i;
    var b = bookings[key] || null;
    out.push({
      pcNumber: i,
      booked: !!b,
      userEmail: b && b.userEmail ? b.userEmail : null,
      userFio: b && b.userFio ? b.userFio : null,
      time: b && b.time ? b.time : null,
      date: b && b.date ? b.date : null
    });
  }
  return JSON.stringify(out, null, 2);
}

function getBookingScheme() {
  try {
    var raw = localStorage.getItem(STORAGE_KEYS.bookingScheme);
    if (!raw) return DEFAULT_BOOKING_SCHEME;
    var scheme = JSON.parse(raw);
    if (!scheme || !scheme.zones || !scheme.zones.length) return DEFAULT_BOOKING_SCHEME;
    scheme.zones.forEach(function(z) {
      if (z.status === undefined) z.status = 'open';
      if (z.accessRule === undefined) z.accessRule = 'all';
      if (z.maxHoursPerUser === undefined) z.maxHoursPerUser = 0;
      if (z.priority === undefined) z.priority = 1;
    });
    return scheme;
  } catch (e) {
    return DEFAULT_BOOKING_SCHEME;
  }
}

function setBookingScheme(scheme) {
  localStorage.setItem(STORAGE_KEYS.bookingScheme, JSON.stringify(scheme || DEFAULT_BOOKING_SCHEME));
}

/** Получить конфигурацию слотов бронирования (для выбора времени). */
function getBookingSlotsConfig() {
  try {
    var raw = localStorage.getItem(STORAGE_KEYS.bookingSlots);
    var fallback = (typeof DEFAULT_BOOKING_SLOTS !== 'undefined' ? DEFAULT_BOOKING_SLOTS.slice() : []);
    if (!raw) return fallback;
    var slots = JSON.parse(raw);
    if (!Array.isArray(slots)) return fallback;
    return slots
      .map(function(s) {
        var start = (s && s.start) ? String(s.start).trim() : '';
        var end = (s && s.end) ? String(s.end).trim() : '';
        return start && end ? { start: start, end: end } : null;
      })
      .filter(function(s) { return s != null; });
  } catch (e) {
    return (typeof DEFAULT_BOOKING_SLOTS !== 'undefined' ? DEFAULT_BOOKING_SLOTS.slice() : []);
  }
}

/** Сохранить конфигурацию слотов бронирования. */
function setBookingSlotsConfig(slots) {
  if (!Array.isArray(slots)) {
    localStorage.removeItem(STORAGE_KEYS.bookingSlots);
    return;
  }
  var normalized = slots
    .map(function(s) {
      var start = (s && s.start) ? String(s.start).trim() : '';
      var end = (s && s.end) ? String(s.end).trim() : '';
      return start && end ? { start: start, end: end } : null;
    })
    .filter(function(s) { return s != null; });
  if (!normalized.length) {
    // Если админ всё удалил, просто очищаем конфиг — фронт упадёт обратно на дефолт.
    localStorage.removeItem(STORAGE_KEYS.bookingSlots);
  } else {
    localStorage.setItem(STORAGE_KEYS.bookingSlots, JSON.stringify(normalized));
  }
}

/** Парсит время слота "10:00–10:20" в минуты длительности */
function parseBookingDurationMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  var parts = timeStr.split(/[–\-]/);
  if (parts.length !== 2) return 0;
  var a = parts[0].trim().split(':');
  var b = parts[1].trim().split(':');
  if (a.length < 2 || b.length < 2) return 0;
  var min1 = parseInt(a[0], 10) * 60 + parseInt(a[1], 10);
  var min2 = parseInt(b[0], 10) * 60 + parseInt(b[1], 10);
  return Math.max(0, min2 - min1);
}

/** Суммарные минуты бронирований пользователя по истории */
function getTotalBookedMinutesByUser(userEmail) {
  var history = getBookingHistoryByUser(userEmail || '');
  var total = 0;
  history.forEach(function(h) {
    total += parseBookingDurationMinutes(h.time);
  });
  return total;
}

function getActivityLog() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.activityLog) || '[]');
}

function addActivityLog(entry) {
  var log = getActivityLog();
  log.unshift(Object.assign({ at: new Date().toISOString() }, entry));
  if (log.length > 500) log.length = 500;
  localStorage.setItem(STORAGE_KEYS.activityLog, JSON.stringify(log));
}

function getActivityLogByUser(userEmail) {
  return getActivityLog().filter(function(e) { return e.userEmail === userEmail; }).slice(0, 50);
}

function getNoShows() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.noShows) || '[]');
}

function setNoShows(arr) {
  localStorage.setItem(STORAGE_KEYS.noShows, JSON.stringify(arr || []));
}

function getNoShowCountByUser(userEmail) {
  return getNoShows().filter(function(n) { return n.userEmail === userEmail; }).length;
}

/* Команды: создание, приглашение по ссылке, список сокомандников */
function getTeams() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.teams) || '[]');
}

function setTeams(teams) {
  localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams || []));
}

function _emailEq(a, b) {
  return a && b && String(a).toLowerCase().trim() === String(b).toLowerCase().trim();
}
function getTeamByUserEmail(userEmail) {
  var teams = getTeams();
  return teams.find(function(t) {
    var members = Array.isArray(t.members) ? t.members : [];
    return members.some(function(m) { return _emailEq(m, userEmail); });
  }) || null;
}

function getTeamByInviteToken(token) {
  if (!token) return null;
  var teams = getTeams();
  return teams.find(function(t) { return (t.inviteToken || t.invite_token) === token; }) || null;
}

function generateInviteToken() {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var s = '';
  for (var i = 0; i < 12; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

function createTeam(ownerEmail, name) {
  var teams = getTeams();
  var existing = getTeamByUserEmail(ownerEmail);
  if (existing) return null;
  var token = generateInviteToken();
  while (getTeamByInviteToken(token)) token = generateInviteToken();
  var team = {
    id: 'team-' + Date.now(),
    name: (name || 'Моя команда').trim() || 'Моя команда',
    ownerEmail: ownerEmail,
    members: [ownerEmail],
    inviteToken: token
  };
  teams.push(team);
  setTeams(teams);
  return team;
}

function joinTeamByInviteToken(token, userEmail) {
  var team = getTeamByInviteToken(token);
  if (!team || !userEmail) return false;
  var members = Array.isArray(team.members) ? team.members.slice() : [];
  if (members.indexOf(userEmail) !== -1) return true;
  var alreadyInOther = getTeamByUserEmail(userEmail);
  if (alreadyInOther) return false;
  team.members = members;
  team.members.push(userEmail);
  var teams = getTeams().filter(function(t) { return t.id !== team.id; });
  teams.push(team);
  setTeams(teams);
  return true;
}

function leaveTeam(userEmail) {
  var team = getTeamByUserEmail(userEmail);
  if (!team) return;
  var teams = getTeams();
  var teamId = team.id;
  var t = teams.find(function(x) { return String(x.id) === String(teamId); });
  if (!t) return;
  var mem = Array.isArray(t.members) ? t.members : [];
  t.members = mem.filter(function(e) { return !_emailEq(e, userEmail); });
  if (t.members.length === 0) {
    teams = teams.filter(function(x) { return String(x.id) !== String(teamId); });
  }
  setTeams(teams);
}

/** Изменить название команды. Может только капитан (ownerEmail). */
function updateTeamName(teamId, captainEmail, newName) {
  var teams = getTeams();
  var t = teams.find(function(x) { return String(x.id) === String(teamId); });
  if (!t) return false;
  var owner = (t.ownerEmail || t.owner_email || '').toString().toLowerCase();
  var cap = (captainEmail || '').toString().toLowerCase();
  if (owner !== cap) return false;
  var name = (newName || '').trim();
  if (!name) return false;
  t.name = name;
  setTeams(teams);
  return true;
}

/** Добавить или обновить команду из ответа API (после принятия приглашения или синхронизации). */
function addTeamFromBackend(teamFromApi) {
  if (!teamFromApi || !teamFromApi.invite_token && !teamFromApi.inviteToken) return null;
  var teams = getTeams();
  var token = teamFromApi.invite_token || teamFromApi.inviteToken;
  var existing = teams.find(function(t) { return (t.inviteToken || t.invite_token) === token; });
  var membersRaw = teamFromApi.members;
  var members = Array.isArray(membersRaw) ? membersRaw : [];
  var team = {
    id: existing ? existing.id : ('team-' + token),
    name: teamFromApi.name || 'Моя команда',
    ownerEmail: teamFromApi.owner_email || teamFromApi.ownerEmail || '',
    members: members,
    inviteToken: token
  };
  var rest = teams.filter(function(t) { return (t.inviteToken || t.invite_token) !== token; });
  rest.push(team);
  setTeams(rest);
  return team;
}

/** Если все email в массиве — участники одной команды, вернуть название команды; иначе null. */
function getTeamNameForMemberEmails(emails) {
  var list = emails || [];
  var filled = list.filter(function(e) { return e; });
  if (filled.length === 0) return null;
  var team = getTeamByUserEmail(filled[0]);
  if (!team || !team.name) return null;
  var members = Array.isArray(team.members) ? team.members : [];
  for (var i = 0; i < filled.length; i++) {
    if (members.indexOf(filled[i]) === -1) return null;
  }
  return team.name;
}

function getEvents() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.events) || '[]');
}

function setEvents(events) {
  localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
}

function getTournamentRegistrations() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.tournamentRegistrations) || '{}');
}

function setTournamentRegistrations(data) {
  localStorage.setItem(STORAGE_KEYS.tournamentRegistrations, JSON.stringify(data));
}

function getRegistrationsForEvent(eventId) {
  var reg = getTournamentRegistrations();
  return reg[eventId] || [];
}

function registerForTournament(userEmail, eventId) {
  var reg = getTournamentRegistrations();
  if (!reg[eventId]) reg[eventId] = [];
  if (reg[eventId].indexOf(userEmail) !== -1) return false;
  var ev = getEvents().find(function(e) { return e.id === eventId; });
  var max = (ev && ev.maxParticipants) || 999;
  if (reg[eventId].length >= max) return false;
  reg[eventId].push(userEmail);
  setTournamentRegistrations(reg);

  var format = (ev && ev.format) || '1v1';
  var teamSize = getTeamSizeForFormat(format);
  var all = getTournamentMatches();
  var matches = all[eventId] || [];

  if (matches.length === 0) {
    ensureDefaultMatchesForEvent(eventId);
    return true;
  }

  if (format === '1v1') {
    var placed = false;
    for (var m = 0; m < matches.length; m++) {
      if (!matches[m].player1) { matches[m].player1 = userEmail; placed = true; break; }
      if (!matches[m].player2) { matches[m].player2 = userEmail; placed = true; break; }
    }
    if (!placed) {
      matches.push({ id: matches.length + 1, round: 1, player1: userEmail, player2: null, score1: null, score2: null });
    }
  } else {
    var placedTeam = false;
    for (var m = 0; m < matches.length && !placedTeam; m++) {
      var t1 = matches[m].team1 || [];
      var t2 = matches[m].team2 || [];
      for (var s = 0; s < teamSize; s++) {
        if (!t1[s]) { t1[s] = userEmail; placedTeam = true; break; }
      }
      if (!placedTeam) {
        for (var s2 = 0; s2 < teamSize; s2++) {
          if (!t2[s2]) { t2[s2] = userEmail; placedTeam = true; break; }
        }
      }
      if (placedTeam) {
        matches[m].team1 = t1.slice(0, teamSize);
        matches[m].team2 = t2.slice(0, teamSize);
        break;
      }
    }
    if (!placedTeam) {
      var newTeam1 = [];
      var newTeam2 = [];
      for (var i = 0; i < teamSize; i++) newTeam1.push(null);
      for (var j = 0; j < teamSize; j++) newTeam2.push(null);
      newTeam1[0] = userEmail;
      matches.push({ id: matches.length + 1, round: 1, team1: newTeam1, team2: newTeam2, score1: null, score2: null });
    }
  }
  all[eventId] = matches;
  setTournamentMatches(all);
  return true;
}

function unregisterFromTournament(userEmail, eventId) {
  var reg = getTournamentRegistrations();
  if (!reg[eventId]) return false;
  var i = reg[eventId].indexOf(userEmail);
  if (i === -1) return false;
  reg[eventId].splice(i, 1);
  setTournamentRegistrations(reg);

  var ev = getEvents().find(function(e) { return e.id === eventId; });
  var format = (ev && ev.format) || '1v1';
  var all = getTournamentMatches();
  var matches = all[eventId];
  if (matches && matches.length > 0) {
    for (var m = 0; m < matches.length; m++) {
      if (format === '1v1') {
        if (matches[m].player1 === userEmail) matches[m].player1 = null;
        if (matches[m].player2 === userEmail) matches[m].player2 = null;
      } else {
        var t1 = matches[m].team1 || [];
        var t2 = matches[m].team2 || [];
        for (var s = 0; s < t1.length; s++) { if (t1[s] === userEmail) t1[s] = null; }
        for (var s2 = 0; s2 < t2.length; s2++) { if (t2[s2] === userEmail) t2[s2] = null; }
        matches[m].team1 = t1;
        matches[m].team2 = t2;
      }
    }
    all[eventId] = matches;
    setTournamentMatches(all);
  }
  return true;
}

function getTournamentMatches() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.tournamentMatches) || '{}');
}

function setTournamentMatches(data) {
  localStorage.setItem(STORAGE_KEYS.tournamentMatches, JSON.stringify(data));
}

function getMatchesForEvent(eventId) {
  var all = getTournamentMatches();
  return all[eventId] || [];
}

function ensureDefaultMatchesForEvent(eventId) {
  var ev = getEvents().find(function(e) { return e.id === eventId; });
  var format = (ev && ev.format) || '1v1';
  var teamSize = getTeamSizeForFormat(format);
  var all = getTournamentMatches();
  if (all[eventId] && all[eventId].length > 0) return all[eventId];
  var reg = getRegistrationsForEvent(eventId);
  var matches = [];

  if (format === '1v1') {
    for (var i = 0; i < 8; i++) {
      matches.push({ id: i + 1, round: 1, player1: reg[i * 2] || null, player2: reg[i * 2 + 1] || null, score1: null, score2: null });
    }
  } else {
    var slotsPerMatch = teamSize * 2;
    var numMatches = Math.max(1, Math.ceil(reg.length / slotsPerMatch));
    if (numMatches < 4) numMatches = 4;
    for (var j = 0; j < numMatches; j++) {
      var team1 = [];
      var team2 = [];
      for (var t = 0; t < teamSize; t++) {
        team1.push(reg[j * slotsPerMatch + t] || null);
        team2.push(reg[j * slotsPerMatch + teamSize + t] || null);
      }
      matches.push({ id: j + 1, round: 1, team1: team1, team2: team2, score1: null, score2: null });
    }
  }
  all[eventId] = matches;
  setTournamentMatches(all);
  return matches;
}

function getTournamentResults() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.tournamentResults) || '{}');
}

function setTournamentResults(data) {
  localStorage.setItem(STORAGE_KEYS.tournamentResults, JSON.stringify(data));
}

function getResultsForEvent(eventId) {
  var all = getTournamentResults();
  return all[eventId] || [];
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

/* Кастомизация профиля: рамки и баннеры */
function getCustomizationFrames() {
  var raw = localStorage.getItem(STORAGE_KEYS.customizationFrames);
  if (!raw) return DEFAULT_CUSTOMIZATION_FRAMES.slice();
  return JSON.parse(raw);
}

function setCustomizationFrames(list) {
  localStorage.setItem(STORAGE_KEYS.customizationFrames, JSON.stringify(list || []));
}

function getCustomizationBanners() {
  var raw = localStorage.getItem(STORAGE_KEYS.customizationBanners);
  if (!raw) return DEFAULT_CUSTOMIZATION_BANNERS.slice();
  return JSON.parse(raw);
}

function setCustomizationBanners(list) {
  localStorage.setItem(STORAGE_KEYS.customizationBanners, JSON.stringify(list || []));
}

function getReadyGifBanners() {
  var raw = localStorage.getItem('kiber_arena_ready_gif_banners');
  if (!raw) return DEFAULT_READY_GIF_BANNERS.slice();
  try {
    var list = JSON.parse(raw);
    return Array.isArray(list) && list.length ? list : DEFAULT_READY_GIF_BANNERS.slice();
  } catch (e) {
    return DEFAULT_READY_GIF_BANNERS.slice();
  }
}

function getReadyGifBannerById(id) {
  return getReadyGifBanners().find(function(b) { return b.id === id; }) || null;
}

function getUserCustomization(userEmail) {
  var all = JSON.parse(localStorage.getItem(STORAGE_KEYS.userCustomization) || '{}');
  var data = all[userEmail] || {};
  return {
    ownedFrames: data.ownedFrames || ['frame-none'],
    ownedBanners: data.ownedBanners || ['banner-none'],
    equippedFrame: data.equippedFrame || 'frame-none',
    equippedBanner: data.equippedBanner || 'banner-none',
    bannerGifUrl: data.bannerGifUrl || ''
  };
}

function setUserCustomization(userEmail, data) {
  var all = JSON.parse(localStorage.getItem(STORAGE_KEYS.userCustomization) || '{}');
  all[userEmail] = data;
  localStorage.setItem(STORAGE_KEYS.userCustomization, JSON.stringify(all));
}

/* Достижения и прогресс */
var ACHIEVEMENTS_LIST = [
  { id: 'first_booking', name: 'Первое посещение', description: 'Забронировать место один раз', condition: { type: 'bookings_count', value: 1 }, icon: '📅', rewardCoins: 5, rare: false },
  { id: 'five_bookings', name: 'Постоянный гость', description: 'Совершить 5 бронирований', condition: { type: 'bookings_count', value: 5 }, icon: '⭐', rewardCoins: 10, rare: false },
  { id: 'ten_bookings', name: 'Игрок', description: 'Совершить 10 бронирований', condition: { type: 'bookings_count', value: 10 }, icon: '🌟', rewardCoins: 20, rare: true },
  { id: 'first_tournament', name: 'Участник турнира', description: 'Записаться на один турнир', condition: { type: 'tournaments_registered', value: 1 }, icon: '🏆', rewardCoins: 5, rare: false },
  { id: 'three_tournaments', name: 'Турнирный боец', description: 'Записаться на 3 турнира', condition: { type: 'tournaments_registered', value: 3 }, icon: '⚔️', rewardCoins: 15, rare: false },
  { id: 'coins_50', name: 'Накопитель', description: 'Накопить 50 ARcoins', condition: { type: 'coins_total', value: 50 }, icon: '💰', rewardCoins: 0, rare: false },
  { id: 'coins_100', name: 'Богач арены', description: 'Накопить 100 ARcoins', condition: { type: 'coins_total', value: 100 }, icon: '💎', rewardCoins: 0, rare: true },
  { id: 'customizer', name: 'Кастомизатор', description: 'Приобрести рамку или баннер', condition: { type: 'frames_or_banners_owned', value: 1 }, icon: '✨', rewardCoins: 0, rare: false },
  { id: 'collector', name: 'Коллекционер', description: 'Иметь 3 предмета кастомизации (рамки/баннеры)', condition: { type: 'frames_or_banners_owned', value: 3 }, icon: '🎨', rewardCoins: 10, rare: false }
];

function getUserAchievements(userEmail) {
  var raw = localStorage.getItem(STORAGE_KEYS.userAchievements);
  var all = raw ? JSON.parse(raw) : {};
  return all[userEmail] || { unlocked: [], rewardedCoins: {} };
}

function setUserAchievements(userEmail, data) {
  var all = JSON.parse(localStorage.getItem(STORAGE_KEYS.userAchievements) || '{}');
  all[userEmail] = data;
  localStorage.setItem(STORAGE_KEYS.userAchievements, JSON.stringify(all));
}

function getAchievementProgressValue(userEmail, conditionType) {
  if (conditionType === 'bookings_count') {
    var history = getBookingHistoryByUser(userEmail);
    return history.length;
  }
  if (conditionType === 'tournaments_registered') {
    var reg = getTournamentRegistrations();
    var count = 0;
    for (var eid in reg) { if (reg[eid].indexOf(userEmail) !== -1) count++; }
    return count;
  }
  if (conditionType === 'coins_total') {
    var cur = getCurrentUser();
    if (cur && cur.email === userEmail && (cur.arcoins !== undefined && cur.arcoins !== null)) return cur.arcoins;
    return getCoinsForUserEmail(userEmail);
  }
  if (conditionType === 'frames_or_banners_owned') {
    var cust = getUserCustomization(userEmail);
    var frames = (cust.ownedFrames || []).filter(function(id) { return id !== 'frame-none'; });
    var banners = (cust.ownedBanners || []).filter(function(id) { return id !== 'banner-none'; });
    return frames.length + banners.length;
  }
  return 0;
}

/** Проверяет прогресс и разблокирует достижения. Коины за награду не начисляются здесь — только по кнопке «Получить награду». */
function checkAndAwardAchievements(userEmail) {
  if (!userEmail) return;
  var data = getUserAchievements(userEmail);
  var changed = false;
  ACHIEVEMENTS_LIST.forEach(function(a) {
    if (data.unlocked.indexOf(a.id) !== -1) return;
    var current = getAchievementProgressValue(userEmail, a.condition.type);
    if (current >= a.condition.value) {
      data.unlocked = data.unlocked.concat(a.id);
      changed = true;
    }
  });
  if (changed) setUserAchievements(userEmail, data);
}

/** Отметить награду за достижение как полученную (после успешного запроса к API). */
function setAchievementRewardClaimed(userEmail, achievementId) {
  var data = getUserAchievements(userEmail);
  if (!data.rewardedCoins) data.rewardedCoins = {};
  data.rewardedCoins[achievementId] = true;
  setUserAchievements(userEmail, data);
}

function getCoinsForUserEmail(userEmail) {
  var users = getUsers();
  var user = users.find(function(u) { return u.email === userEmail; });
  if (!user || !user.fio) return 0;
  var lb = getLeaderboard();
  var entry = lb.find(function(e) { return (e.name || '').trim() === (user.fio || '').trim(); });
  return entry ? (entry.coins || 0) : 0;
}

function deductCoinsForUserEmail(userEmail, amount) {
  var users = getUsers();
  var user = users.find(function(u) { return u.email === userEmail; });
  if (!user || !user.fio) return false;
  var lb = getLeaderboard();
  var entry = lb.find(function(e) { return (e.name || '').trim() === (user.fio || '').trim(); });
  if (!entry || (entry.coins || 0) < amount) return false;
  entry.coins = (entry.coins || 0) - amount;
  setLeaderboard(lb);
  return true;
}

/** Добавить купленную рамку в кастомизацию (после успешной оплаты через API). */
function addOwnedFrame(userEmail, frameId) {
  var cust = getUserCustomization(userEmail);
  if (cust.ownedFrames.indexOf(frameId) === -1) cust.ownedFrames = cust.ownedFrames.concat(frameId);
  cust.equippedFrame = frameId;
  setUserCustomization(userEmail, cust);
}

function purchaseFrame(userEmail, frameId) {
  var item = getCustomizationFrames().find(function(f) { return f.id === frameId; });
  if (!item) return false;
  var cust = getUserCustomization(userEmail);
  if (cust.ownedFrames.indexOf(frameId) !== -1) {
    cust.equippedFrame = frameId;
    setUserCustomization(userEmail, cust);
    return true;
  }
  if (item.price > 0 && !deductCoinsForUserEmail(userEmail, item.price)) return false;
  cust.ownedFrames = cust.ownedFrames.indexOf(frameId) === -1 ? cust.ownedFrames.concat(frameId) : cust.ownedFrames;
  cust.equippedFrame = frameId;
  setUserCustomization(userEmail, cust);
  return true;
}

/** Добавить купленный баннер в кастомизацию (после успешной оплаты через API). */
function addOwnedBanner(userEmail, bannerId) {
  var cust = getUserCustomization(userEmail);
  if (cust.ownedBanners.indexOf(bannerId) === -1) cust.ownedBanners = cust.ownedBanners.concat(bannerId);
  cust.equippedBanner = bannerId;
  setUserCustomization(userEmail, cust);
}

function purchaseBanner(userEmail, bannerId) {
  var item = getCustomizationBanners().find(function(b) { return b.id === bannerId; });
  if (!item) return false;
  var cust = getUserCustomization(userEmail);
  if (cust.ownedBanners.indexOf(bannerId) !== -1) {
    cust.equippedBanner = bannerId;
    setUserCustomization(userEmail, cust);
    return true;
  }
  if (item.price > 0 && !deductCoinsForUserEmail(userEmail, item.price)) return false;
  cust.ownedBanners = cust.ownedBanners.indexOf(bannerId) === -1 ? cust.ownedBanners.concat(bannerId) : cust.ownedBanners;
  cust.equippedBanner = bannerId;
  setUserCustomization(userEmail, cust);
  return true;
}

/** Добавить купленную гифку-баннер в кастомизацию (после успешной оплаты через API). */
function addOwnedGifBanner(userEmail, gifBannerId) {
  var cust = getUserCustomization(userEmail);
  if (cust.ownedBanners.indexOf(gifBannerId) === -1) cust.ownedBanners = cust.ownedBanners.concat(gifBannerId);
  cust.equippedBanner = gifBannerId;
  setUserCustomization(userEmail, cust);
}

function purchaseReadyGifBanner(userEmail, gifBannerId) {
  var item = getReadyGifBannerById(gifBannerId);
  if (!item) return false;
  var cust = getUserCustomization(userEmail);
  if (cust.ownedBanners.indexOf(gifBannerId) !== -1) {
    cust.equippedBanner = gifBannerId;
    setUserCustomization(userEmail, cust);
    return true;
  }
  if (item.price > 0 && !deductCoinsForUserEmail(userEmail, item.price)) return false;
  cust.ownedBanners = cust.ownedBanners.indexOf(gifBannerId) === -1 ? cust.ownedBanners.concat(gifBannerId) : cust.ownedBanners;
  cust.equippedBanner = gifBannerId;
  setUserCustomization(userEmail, cust);
  return true;
}
