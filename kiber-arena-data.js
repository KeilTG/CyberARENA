/* Хранилище данных — localStorage */

const STORAGE_KEYS = {
  events: 'kiber_arena_events',
  leaderboard: 'kiber_arena_leaderboard',
  bookings: 'kiber_arena_bookings',
  bookingHistory: 'kiber_arena_booking_history',
  users: 'kiber_arena_users',
  currentUser: 'kiber_arena_current_user',
  userCustomization: 'kiber_arena_user_customization',
  customizationFrames: 'kiber_arena_customization_frames',
  customizationBanners: 'kiber_arena_customization_banners',
  tournamentRegistrations: 'kiber_arena_tournament_registrations',
  tournamentMatches: 'kiber_arena_tournament_matches',
  tournamentResults: 'kiber_arena_tournament_results',
  userAchievements: 'kiber_arena_user_achievements'
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
  if (!localStorage.getItem(STORAGE_KEYS.customizationFrames)) {
    localStorage.setItem(STORAGE_KEYS.customizationFrames, JSON.stringify(DEFAULT_CUSTOMIZATION_FRAMES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.customizationBanners)) {
    localStorage.setItem(STORAGE_KEYS.customizationBanners, JSON.stringify(DEFAULT_CUSTOMIZATION_BANNERS));
  }
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
  { id: 'ten_bookings', name: 'Завсегдатай', description: 'Совершить 10 бронирований', condition: { type: 'bookings_count', value: 10 }, icon: '🌟', rewardCoins: 20, rare: true },
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

function checkAndAwardAchievements(userEmail) {
  if (!userEmail) return;
  var data = getUserAchievements(userEmail);
  var changed = false;
  ACHIEVEMENTS_LIST.forEach(function(a) {
    if (data.unlocked.indexOf(a.id) !== -1) return;
    var current = getAchievementProgressValue(userEmail, a.condition.type);
    if (current >= a.condition.value) {
      data.unlocked = data.unlocked.concat(a.id);
      if (a.rewardCoins && a.rewardCoins > 0) {
        if (!data.rewardedCoins) data.rewardedCoins = {};
        if (!data.rewardedCoins[a.id]) {
          var lb = getLeaderboard();
          var users = getUsers();
          var user = users.find(function(u) { return u.email === userEmail; });
          if (user && user.fio) {
            var entry = lb.find(function(e) { return (e.name || '').trim() === (user.fio || '').trim(); });
            if (entry) {
              entry.coins = (entry.coins || 0) + a.rewardCoins;
              setLeaderboard(lb);
              data.rewardedCoins[a.id] = true;
            }
          }
        }
      }
      changed = true;
    }
  });
  if (changed) setUserAchievements(userEmail, data);
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
