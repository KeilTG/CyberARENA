/* Хранилище данных — localStorage */

const STORAGE_KEYS = {
  events: 'kiber_arena_events',
  leaderboard: 'kiber_arena_leaderboard'
};

const DEFAULT_EVENTS = [
  { id: '1', name: 'Турнир по CS2', image: 'https://picsum.photos/400/300?random=1', description: '' },
  { id: '2', name: 'Кубок Dota 2', image: 'https://picsum.photos/400/300?random=2', description: '' },
  { id: '3', name: 'Лига Valorant', image: 'https://picsum.photos/400/300?random=3', description: '' }
];

const DEFAULT_LEADERBOARD = [
  { place: 1, name: 'Пашинин Артём Сергеевич', initials: 'ПА', avatarColor: 'linear-gradient(135deg, #e8b923, #d4942e)', group: '2ИП-2-24', coins: 65 },
  { place: 2, name: 'Архипов Дмитрий Алексеевич', initials: 'АД', avatarColor: 'linear-gradient(135deg, #c0c0c0, #9e9e9e)', group: '1ВР-1-25', coins: 10 },
  { place: 3, name: 'Гаджиев Гаджи Дагирович', initials: 'ГГ', avatarColor: 'linear-gradient(135deg, #cd7f32, #a0522d)', group: '1ИП-1-25', coins: 10 },
  { place: 4, name: 'Алямкин Артём', initials: 'АА', avatarColor: 'linear-gradient(135deg, #6eb5ff, #4a90d9)', group: '2ИП-1-24', coins: 10 },
  { place: 5, name: 'Мария Евгеньевна Мартынова', initials: 'ММ', avatarColor: 'linear-gradient(135deg, #ff9ecd, #e85a9a)', group: '1РКИ-1-25', coins: 10 }
];

function initStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.events)) {
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(DEFAULT_EVENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.leaderboard)) {
    localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(DEFAULT_LEADERBOARD));
  }
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
