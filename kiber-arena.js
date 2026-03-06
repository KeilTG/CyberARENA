/* Основная логика сайта */

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
var mainContent = document.getElementById('main-content');
var leaderboardContent = document.getElementById('leaderboard-content');
var achievementsContent = document.getElementById('achievements-content');
var tournamentsContent = document.getElementById('tournaments-content');
var bookingContent = document.getElementById('booking-content');
var exchangeContent = document.getElementById('exchange-content');
var welcomeContent = document.getElementById('welcome-content');
var tournamentsGrid = document.getElementById('tournaments-grid');
var bookingGrid = document.getElementById('booking-grid');
var tournamentsFilterCategory = '';
var tournamentsFilterFormat = '';

let currentTournaments = [];
let currentComputers = [];

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
initStorage();
renderHeaderUser();

// Проверяем авторизацию
if (getCurrentUser()) {
    welcomeContent.classList.add('welcome-card--hidden');
    if (window.location.hash === '#exchange' && exchangeContent) {
        mainContent.classList.add('main--hidden');
        leaderboardContent.classList.add('leaderboard--hidden');
        if (achievementsContent) achievementsContent.classList.add('achievements--hidden');
        tournamentsContent.classList.add('tournaments--hidden');
        bookingContent.classList.add('booking--hidden');
        exchangeContent.classList.remove('exchange--hidden');
        renderExchange();
    } else {
        mainContent.classList.remove('main--hidden');
        leaderboardContent.classList.add('leaderboard--hidden');
        if (achievementsContent) achievementsContent.classList.add('achievements--hidden');
        tournamentsContent.classList.add('tournaments--hidden');
        bookingContent.classList.add('booking--hidden');
        if (exchangeContent) exchangeContent.classList.add('exchange--hidden');
    }
}

// ==================== ПРОВЕРКА ПРАВ АДМИНА ====================
async function checkAdminStatus() {
    const user = getCurrentUser();
    if (!user || !user.email) return false;
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/admin/users`);
        if (!response.ok) return false;
        
        const users = await response.json();
        const userFromDB = users.find(u => u.email === user.email);
        
        if (userFromDB && userFromDB.is_admin) {
            const currentUser = getCurrentUser();
            if (currentUser) {
                currentUser.is_admin = true;
                setCurrentUser(currentUser);
            }
            
            const adminLink = document.getElementById('admin-link');
            if (adminLink) adminLink.classList.remove('footer__link--hidden');
            
            return true;
        } else {
            const adminLink = document.getElementById('admin-link');
            if (adminLink) adminLink.classList.add('footer__link--hidden');
            
            return false;
        }
    } catch (error) {
        console.error('Ошибка проверки прав админа:', error);
        return false;
    }
}

// ==================== ЗАГРУЗКА ЛИДЕРБОРДА ИЗ БД ====================
async function loadLeaderboardFromDB() {
    console.log('🟢 Загрузка лидерборда...');
    const leaderboardBody = document.querySelector('#leaderboard-content .leaderboard__table tbody');
    
    if (!leaderboardBody) {
        console.log('❌ Таблица лидерборда не найдена');
        return;
    }
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/leaderboard`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Получены данные:', data);
        
        if (data.length > 0) {
            leaderboardBody.innerHTML = data.map(user => {
                const place = user.place;
                let medalHtml = '';
                
                if (place === 1) {
                    medalHtml = '<span class="leaderboard__medal leaderboard__medal--gold">1</span>';
                } else if (place === 2) {
                    medalHtml = '<span class="leaderboard__medal leaderboard__medal--silver">2</span>';
                } else if (place === 3) {
                    medalHtml = '<span class="leaderboard__medal leaderboard__medal--bronze">3</span>';
                } else {
                    medalHtml = place;
                }
                
                const nameParts = user.student ? user.student.split(' ') : [];
                let initials = '?';
                if (nameParts.length >= 2) {
                    initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
                } else if (nameParts.length === 1) {
                    initials = nameParts[0][0].toUpperCase();
                }
                
                return '<tr class="leaderboard__row">' +
                    '<td class="leaderboard__place">' + medalHtml + '</td>' +
                    '<td class="leaderboard__student">' +
                        '<span class="leaderboard__avatar" style="background: linear-gradient(135deg, #5582FF, #4568dc);">' + initials + '</span>' +
                        '<span>' + (user.student || '') + '</span>' +
                    '</td>' +
                    '<td>' + (user.group || '') + '</td>' +
                    '<td class="leaderboard__coins">' + (user.arcoins || 0) + ' ARcoins</td>' +
                '</tr>';
            }).join('');
            console.log('✅ Лидерборд обновлен');
        } else {
            leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">Нет данных для отображения</td></tr>';
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки лидерборда:', error);
        leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #ff4444;">Ошибка загрузки данных</td></tr>';
    }
}

// ==================== НОВАЯ ФУНКЦИЯ: ЗАГРУЗКА КОМПЬЮТЕРОВ ====================
async function loadComputersFromDB() {
    console.log('🟢 Загрузка компьютеров...');
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/computers`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        currentComputers = await response.json();
        console.log('📊 Получены компьютеры:', currentComputers);
        
        // Обновляем отображение бронирования
        renderBookingFromDB();
    } catch (error) {
        console.error('❌ Ошибка загрузки компьютеров:', error);
    }
}

// ==================== НОВАЯ ФУНКЦИЯ: ОТОБРАЖЕНИЕ БРОНИРОВАНИЯ ====================
function renderBookingFromDB() {
    if (!bookingGrid) return;
    
    const user = getCurrentUser();
    
    bookingGrid.innerHTML = currentComputers.map(comp => {
        const isBooked = comp.is_booked;
        const seatId = comp.seat_number;
        const bookedByUser = isBooked && user && comp.booked_by_email === user.email;
        
        let statusHtml = '';
        if (isBooked) {
            statusHtml = `
                <div class="booking__seat-content">
                    <span class="booking__status">Занято</span>
                    <span class="booking__time">${comp.booking_time || '—'}</span>
                    ${bookedByUser ? 
                        `<button type="button" class="booking__btn booking__btn--cancel" data-cancel-seat="${seatId}">Отмена</button>` : 
                        ''}
                </div>
            `;
        } else {
            statusHtml = `<button type="button" class="booking__btn" data-seat="${seatId}">Бронь</button>`;
        }
        
        return `<div class="booking__seat ${isBooked ? 'booking__seat--booked' : ''}" data-seat="${seatId}">
            <span class="booking__seat-num">${seatId}</span>
            ${statusHtml}
        </div>`;
    }).join('');
    
    // Добавляем обработчики
    bookingGrid.querySelectorAll('.booking__btn[data-seat]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!getCurrentUser()) {
                alert('Для бронирования необходимо зарегистрироваться');
                return;
            }
            openBookingModal(parseInt(btn.dataset.seat));
        });
    });
    
    bookingGrid.querySelectorAll('.booking__btn[data-cancel-seat]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!getCurrentUser()) {
                alert('Для отмены бронирования необходимо войти в аккаунт');
                return;
            }
            cancelBooking(parseInt(btn.dataset.cancelSeat));
        });
    });
}

// ==================== НОВАЯ ФУНКЦИЯ: БРОНИРОВАНИЕ ====================
async function createBooking(seatId, time) {
    const user = getCurrentUser();
    if (!user) {
        alert('Войдите в аккаунт');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/computers/${seatId}/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                seat_id: seatId,
                user_email: user.email,
                user_name: user.fio,
                date: today,
                time: time
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(`✅ Компьютер ${seatId} забронирован`, 'success');
            loadComputersFromDB(); // Перезагружаем список
            closeBookingModal();
        } else {
            showNotification(`❌ ${data.detail || 'Ошибка бронирования'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('❌ Ошибка подключения к серверу', 'error');
    }
}

// ==================== НОВАЯ ФУНКЦИЯ: ОТМЕНА БРОНИРОВАНИЯ ====================
async function cancelBooking(seatId) {
    const user = getCurrentUser();
    if (!user) {
        alert('Войдите в аккаунт');
        return;
    }
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/computers/${seatId}/unbook?email=${encodeURIComponent(user.email)}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(`✅ Бронь компьютера ${seatId} отменена`, 'success');
            loadComputersFromDB(); // Перезагружаем список
        } else {
            showNotification(`❌ ${data.detail || 'Ошибка отмены'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('❌ Ошибка подключения к серверу', 'error');
    }
}

// ==================== НОВАЯ ФУНКЦИЯ: ЗАГРУЗКА ТУРНИРОВ ====================
async function loadTournamentsFromDB() {
    console.log('🟢 Загрузка турниров...');
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/tournaments`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        currentTournaments = await response.json();
        console.log('📊 Получены турниры:', currentTournaments);
        
        renderTournamentsFromDB();
    } catch (error) {
        console.error('❌ Ошибка загрузки турниров:', error);
        if (tournamentsGrid) {
            tournamentsGrid.innerHTML = '<p class="error-message">Ошибка загрузки турниров</p>';
        }
    }
}

// ==================== НОВАЯ ФУНКЦИЯ: ОТОБРАЖЕНИЕ ТУРНИРОВ ====================
function renderTournamentsFromDB() {
    if (!tournamentsGrid) return;
    
    const user = getCurrentUser();
    
    tournamentsGrid.innerHTML = currentTournaments.map(ev => {
        const imgStyle = ev.image ? `background-image: url('${ev.image.replace(/'/g, "\\'")}')` : '';
        const isRegistered = false; // Позже добавим проверку регистрации
        
        return `<article class="event-card" data-id="${ev.id}">
            <h3 class="event-card__title">${ev.name || 'Мероприятие'}</h3>
            <span class="event-card__format event-card__format--${ev.format || '1v1'}">${ev.format || '1v1'}</span>
            <div class="event-card__image" style="${imgStyle}"></div>
            <div class="event-card__footer">
                <button type="button" class="event-card__btn event-card__btn--right" data-event-id="${ev.id}" data-action="details">Подробнее</button>
            </div>
        </article>`;
    }).join('');
    
    tournamentsGrid.querySelectorAll('[data-action="details"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const ev = currentTournaments.find(e => e.id === btn.dataset.eventId);
            if (ev) openTournamentModal(ev);
        });
    });
}

// ==================== ФУНКЦИИ НАВИГАЦИИ ====================
function hideWelcome() {
    welcomeContent.classList.add('welcome-card--hidden');
}

function renderHeaderUser() {
    var area = document.getElementById('header-user-area');
    if (!area) return;
    var user = getCurrentUser();
    if (user && user.fio) {
        var users = typeof getUsers === 'function' ? getUsers() : [];
        var stored = users.find(function(u) { return u.email === user.email; });
        if (stored) {
            user = Object.assign({}, user, { avatarUrl: stored.avatarUrl || user.avatarUrl, avatarColor: stored.avatarColor || user.avatarColor });
        }
        var displayName = typeof formatNameAsSurnameInitials === 'function' ? formatNameAsSurnameInitials(user.fio) : user.fio;
        var initials = typeof getInitialsFromName === 'function' ? getInitialsFromName(user.fio) : '?';
        var avatarColor = user.avatarColor || 'linear-gradient(135deg, #5582FF, #4568dc)';
        var hasPhoto = !!(user.avatarUrl && user.avatarUrl.trim());
        var avatarUrlEsc = (user.avatarUrl || '').replace(/'/g, "\\27");
        var avatarHtml = hasPhoto
            ? '<span class="header__user-avatar header__user-avatar--img" style="background-image:url(\'' + avatarUrlEsc + '\')"></span>'
            : '<span class="header__user-avatar" style="background:' + avatarColor + '">' + initials + '</span>';
        var cust = typeof getUserCustomization === 'function' ? getUserCustomization(user.email || '') : {};
        var frameClass = ' custom-frame custom-frame--' + (cust.equippedFrame || 'frame-none');
        
        var userCoins = user.arcoins || 100;
        var adminBadge = user.is_admin ? ' <span style="color: #ffd700; font-size: 0.8rem;">(админ)</span>' : '';
        
        area.innerHTML = '<a href="kiber-profile/kiber-profile.html" class="header__user-block">' +
            '<div class="header__user-info">' +
            '<span class="header__user-name">' + displayName + adminBadge + '</span>' +
            '<span class="header__user-coins">💰 ' + userCoins + ' ARcoins</span>' +
            '</div>' +
            '<span class="header__user-avatar-wrap' + frameClass + '">' + avatarHtml + '</span>' +
            '</a>' +
            '<button type="button" class="header__logout" id="header-logout" title="Выйти"><svg class="header__logout-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>';
        
        var logoutBtn = document.getElementById('header-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                setCurrentUser(null);
                window.location.href = 'kiber-arena.html';
            });
        }
    } else {
        area.innerHTML = '<a href="forma-kiber/forma-signup.html" class="header__btn">Зарегистрироваться</a>';
    }
}

// ==================== МОБИЛЬНОЕ МЕНЮ ====================
(function setupMobileMenu() {
    var header = document.querySelector('.header');
    var burger = document.getElementById('header-burger');
    var nav = document.getElementById('header-nav');
    if (!header || !burger || !nav) return;
    function openMenu() {
        header.classList.add('header--menu-open');
        document.body.classList.add('body--menu-open');
        burger.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
        header.classList.remove('header--menu-open');
        document.body.classList.remove('body--menu-open');
        burger.setAttribute('aria-expanded', 'false');
    }
    burger.addEventListener('click', function() {
        if (header.classList.contains('header--menu-open')) closeMenu();
        else openMenu();
    });
    nav.querySelectorAll('.header__link').forEach(function(link) {
        link.addEventListener('click', function() {
            closeMenu();
        });
    });
    nav.addEventListener('click', function(e) {
        if (e.target === nav) closeMenu();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && header.classList.contains('header--menu-open')) closeMenu();
    });
})();

// ==================== НАВИГАЦИЯ ПО РАЗДЕЛАМ ====================
document.getElementById('nav-main').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.remove('main--hidden');
    leaderboardContent.classList.add('leaderboard--hidden');
    if (achievementsContent) achievementsContent.classList.add('achievements--hidden');
    tournamentsContent.classList.add('tournaments--hidden');
    bookingContent.classList.add('booking--hidden');
    if (exchangeContent) exchangeContent.classList.add('exchange--hidden');
});

document.getElementById('nav-booking').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.add('main--hidden');
    leaderboardContent.classList.add('leaderboard--hidden');
    if (achievementsContent) achievementsContent.classList.add('achievements--hidden');
    tournamentsContent.classList.add('tournaments--hidden');
    if (exchangeContent) exchangeContent.classList.add('exchange--hidden');
    bookingContent.classList.remove('booking--hidden');
    loadComputersFromDB();
});

document.getElementById('nav-tournaments').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.add('main--hidden');
    leaderboardContent.classList.add('leaderboard--hidden');
    if (achievementsContent) achievementsContent.classList.add('achievements--hidden');
    bookingContent.classList.add('booking--hidden');
    if (exchangeContent) exchangeContent.classList.add('exchange--hidden');
    tournamentsContent.classList.remove('tournaments--hidden');
    loadTournamentsFromDB();
});

// ==================== ФИЛЬТРЫ ТУРНИРОВ ====================
var tournamentsFilter = document.getElementById('tournaments-filter');
if (tournamentsFilter) {
    tournamentsFilter.addEventListener('click', function(e) {
        var btn = e.target.closest('.tournaments__filter-btn');
        if (!btn) return;
        tournamentsFilter.querySelectorAll('.tournaments__filter-btn').forEach(function(b) { b.classList.remove('tournaments__filter-btn--active'); });
        btn.classList.add('tournaments__filter-btn--active');
        tournamentsFilterCategory = btn.dataset.category || '';
        // Фильтрация будет позже
    });
}
var tournamentsFilterFormatEl = document.getElementById('tournaments-filter-format');
if (tournamentsFilterFormatEl) {
    tournamentsFilterFormatEl.addEventListener('click', function(e) {
        var btn = e.target.closest('.tournaments__filter-btn');
        if (!btn) return;
        tournamentsFilterFormatEl.querySelectorAll('.tournaments__filter-btn').forEach(function(b) { b.classList.remove('tournaments__filter-btn--active'); });
        btn.classList.add('tournaments__filter-btn--active');
        tournamentsFilterFormat = btn.dataset.format || '';
        // Фильтрация будет позже
    });
}

// ==================== ЛИДЕРБОРД ====================
document.getElementById('nav-leaderboard').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.add('main--hidden');
    if (achievementsContent) achievementsContent.classList.add('achievements--hidden');
    tournamentsContent.classList.add('tournaments--hidden');
    bookingContent.classList.add('booking--hidden');
    if (exchangeContent) exchangeContent.classList.add('exchange--hidden');
    leaderboardContent.classList.remove('leaderboard--hidden');
    loadLeaderboardFromDB();
});

var navAchievements = document.getElementById('nav-achievements');
if (navAchievements) {
    navAchievements.addEventListener('click', function(e) {
        e.preventDefault();
        hideWelcome();
        mainContent.classList.add('main--hidden');
        leaderboardContent.classList.add('leaderboard--hidden');
        tournamentsContent.classList.add('tournaments--hidden');
        bookingContent.classList.add('booking--hidden');
        if (exchangeContent) exchangeContent.classList.add('exchange--hidden');
        if (achievementsContent) {
            achievementsContent.classList.remove('achievements--hidden');
            renderAchievements();
        }
    });
}

var navExchange = document.getElementById('nav-exchange');
if (navExchange) {
    navExchange.addEventListener('click', function(e) {
        e.preventDefault();
        hideWelcome();
        mainContent.classList.add('main--hidden');
        leaderboardContent.classList.add('leaderboard--hidden');
        if (achievementsContent) achievementsContent.classList.add('achievements--hidden');
        tournamentsContent.classList.add('tournaments--hidden');
        bookingContent.classList.add('booking--hidden');
        if (exchangeContent) {
            exchangeContent.classList.remove('exchange--hidden');
            renderExchange();
        }
    });
}

// ==================== ДОСТИЖЕНИЯ ====================
var achievementConditionLabels = {
    bookings_count: 'Бронирования',
    tournaments_registered: 'Турниры',
    coins_total: 'ARcoins',
    frames_or_banners_owned: 'Предметы кастомизации'
};

function renderAchievements() {
    var grid = document.getElementById('achievements-grid');
    var authMsg = document.getElementById('achievements-auth-msg');
    if (!grid) return;
    var user = getCurrentUser();
    if (!user || !user.email) {
        if (authMsg) authMsg.classList.remove('achievements__auth-msg--hidden');
        grid.innerHTML = '';
        return;
    }
    if (authMsg) authMsg.classList.add('achievements__auth-msg--hidden');
    if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
    var data = typeof getUserAchievements === 'function' ? getUserAchievements(user.email) : { unlocked: [], rewardedCoins: {} };
    var list = typeof ACHIEVEMENTS_LIST !== 'undefined' ? ACHIEVEMENTS_LIST : [];
    grid.innerHTML = list.map(function(a) {
        var unlocked = (data.unlocked || []).indexOf(a.id) !== -1;
        var current = typeof getAchievementProgressValue === 'function' ? getAchievementProgressValue(user.email, a.condition.type) : 0;
        var target = a.condition.value;
        var label = achievementConditionLabels[a.condition.type] || a.condition.type;
        var progressText = current + ' / ' + target;
        var rewardText = a.rewardCoins ? ' +' + a.rewardCoins + ' ARcoins' : '';
        var cardClass = 'achievements__card' + (unlocked ? ' achievements__card--unlocked' : ' achievements__card--locked');
        var rareClass = a.rare ? ' achievements__card--rare' : '';
        return '<article class="' + cardClass + rareClass + '" data-id="' + a.id + '">' +
            '<div class="achievements__card-icon">' + (a.icon || '🏅') + '</div>' +
            '<h3 class="achievements__card-title">' + (a.name || '') + '</h3>' +
            '<p class="achievements__card-desc">' + (a.description || '') + '</p>' +
            '<p class="achievements__card-condition">' + label + ': ' + progressText + (rewardText ? ' <span class="achievements__card-reward">' + rewardText + '</span>' : '') + '</p>' +
            '<div class="achievements__card-progress"><span class="achievements__card-progress-bar" style="width:' + Math.min(100, (current / target) * 100) + '%"></span></div>' +
            (unlocked ? '<span class="achievements__card-badge">Получено</span>' : '') +
            '</article>';
    }).join('');
}

// ==================== ТУРНИРЫ (МОДАЛЬНЫЕ ОКНА) ====================
var tournamentModalEventId = null;

function openTournamentModal(ev) {
    tournamentModalEventId = ev.id;
    var modal = document.getElementById('tournament-modal');
    if (modal) modal.classList.remove('modal--hidden');
    fillTournamentModal(ev);
}

function closeTournamentModal() {
    tournamentModalEventId = null;
    var modal = document.getElementById('tournament-modal');
    if (modal) modal.classList.add('modal--hidden');
}

function fillTournamentModal(ev) {
    if (!ev) return;
    
    document.getElementById('tournament-modal-title').textContent = ev.name || 'Турнир';
    var meta = [ev.date, ev.time].filter(Boolean).join(' · ');
    document.getElementById('tournament-modal-meta').textContent = meta || 'Дата и время уточняются';
    document.getElementById('tournament-modal-desc').textContent = ev.description || 'Описание турнира.';
    
    var catEl = document.getElementById('tournament-modal-category');
    if (catEl) {
        catEl.textContent = ev.category || '';
        catEl.style.display = ev.category ? 'inline-block' : 'none';
    }
    
    var fmtEl = document.getElementById('tournament-modal-format');
    if (fmtEl) {
        fmtEl.textContent = ev.format || '';
        fmtEl.style.display = ev.format ? 'inline-block' : 'none';
    }
    
    var heroBg = document.getElementById('tournament-modal-hero-bg');
    if (heroBg) {
        if (ev.image) {
            heroBg.style.backgroundImage = 'url(' + JSON.stringify(ev.image) + ')';
            heroBg.style.display = 'block';
        } else {
            heroBg.style.backgroundImage = '';
            heroBg.style.display = 'none';
        }
    }

    var user = getCurrentUser();
    var max = ev.maxParticipants || 999;

    var statusEl = document.getElementById('tournament-modal-reg-status');
    statusEl.textContent = 'Макс. участников: ' + max;

    var regBtn = document.getElementById('tournament-modal-reg-btn');
    regBtn.textContent = 'Записаться';
    regBtn.disabled = !user;
    regBtn.onclick = function() {
        if (!user) { 
            alert('Войдите в аккаунт.'); 
            return; 
        }
        alert('Функция регистрации будет добавлена позже');
    };

    document.getElementById('tournament-modal-matches').innerHTML = '<p class="tournament-matches-empty">Матчи появятся после начала турнира</p>';
    
    var tbody = document.querySelector('#tournament-modal-results tbody');
    if (tbody) tbody.innerHTML = '';
    document.getElementById('tournament-modal-results-empty').style.display = 'block';
    
    document.getElementById('tournament-modal-rewards').innerHTML = '<li>Награды уточняются</li>';
}

document.getElementById('tournament-modal-close').addEventListener('click', closeTournamentModal);
document.querySelector('.tournament-modal__backdrop').addEventListener('click', closeTournamentModal);

// ==================== БРОНИРОВАНИЕ (МОДАЛЬНЫЕ ОКНА) ====================
var ALLOWED_BOOKING_SLOTS = [
    { start: '10:00', end: '10:20' },
    { start: '10:30', end: '10:50' },
    { start: '11:50', end: '12:10' },
    { start: '12:20', end: '12:40' },
    { start: '13:40', end: '14:00' },
    { start: '14:10', end: '14:30' },
    { start: '15:30', end: '15:50' },
    { start: '16:00', end: '16:20' }
];

var bookingModalSeat = null;

function openBookingModal(seatId) {
    bookingModalSeat = seatId;
    document.getElementById('booking-modal-seat').textContent = seatId;
    
    var first = ALLOWED_BOOKING_SLOTS[0];
    document.getElementById('booking-time-start').value = first.start;
    document.getElementById('booking-time-end').value = first.end;
    
    document.getElementById('booking-modal').classList.remove('modal--hidden');
}

function closeBookingModal() {
    document.getElementById('booking-modal').classList.add('modal--hidden');
    bookingModalSeat = null;
}

document.getElementById('booking-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var timeStart = document.getElementById('booking-time-start').value.trim();
    var timeEnd = document.getElementById('booking-time-end').value.trim();
    
    if (!timeStart || !timeEnd || !bookingModalSeat) return;
    
    var allowed = ALLOWED_BOOKING_SLOTS.some(function(s) { 
        return s.start === timeStart && s.end === timeEnd; 
    });
    
    if (!allowed) {
        alert('Выберите один из доступных слотов');
        return;
    }
    
    var time = timeStart + '–' + timeEnd;
    createBooking(bookingModalSeat, time);
});

document.getElementById('booking-cancel').addEventListener('click', closeBookingModal);
document.querySelector('#booking-modal .modal__overlay').addEventListener('click', closeBookingModal);

// ==================== ОБМЕН ====================
async function purchaseItem(userEmail, itemId, itemType, price) {
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                item_id: itemId,
                item_type: itemType
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const currentUser = getCurrentUser();
            if (currentUser) {
                currentUser.arcoins = data.new_balance;
                setCurrentUser(currentUser);
            }
            
            showNotification(`✅ Куплено!`, 'success');
            renderExchange();
            renderHeaderUser();
        } else {
            showNotification(`❌ ${data.detail}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка покупки:', error);
        showNotification('❌ Ошибка подключения к серверу', 'error');
    }
}

function renderExchange() {
    var user = getCurrentUser();
    var authMsg = document.getElementById('exchange-auth-msg');
    var shop = document.getElementById('exchange-shop');
    
    if (authMsg && shop) {
        if (!user || !user.email) {
            authMsg.classList.remove('exchange__auth-msg--hidden');
            shop.classList.add('exchange__auth-msg--hidden');
            return;
        }
        authMsg.classList.add('exchange__auth-msg--hidden');
        shop.classList.remove('exchange__auth-msg--hidden');
    }
    
    var coins = user.arcoins || 100;

    var framesEl = document.getElementById('exchange-frames');
    var frames = [
        { id: 'frame-none', name: 'Без рамки', price: 0 },
        { id: 'frame-gold', name: 'Золотая рамка', price: 15 },
        { id: 'frame-neon', name: 'Неоновая рамка', price: 25 },
        { id: 'frame-silver', name: 'Серебряная рамка', price: 20 },
        { id: 'frame-rainbow', name: 'Радужная рамка', price: 35 }
    ];
    
    if (framesEl) {
        framesEl.innerHTML = frames.map(function(f) {
            var btnText = f.price === 0 ? 'Бесплатно' : (coins >= f.price ? `Купить (${f.price})` : `${f.price} ARcoins`);
            var disabled = f.price > 0 && coins < f.price;
            
            return '<div class="exchange-item" data-frame-id="' + f.id + '">' +
                '<div class="exchange-item__preview exchange-item__preview--frame custom-frame custom-frame--' + f.id + '"></div>' +
                '<p class="exchange-item__name">' + (f.name || '') + '</p>' +
                '<p class="exchange-item__price">' + (f.price === 0 ? 'Бесплатно' : f.price + ' ARcoins') + '</p>' +
                '<button type="button" class="admin-btn exchange-item__btn" data-fid="' + f.id + '" data-price="' + f.price + '"' + (disabled ? ' disabled' : '') + '>' + btnText + '</button></div>';
        }).join('');
        
        framesEl.querySelectorAll('[data-fid]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.dataset.fid;
                var price = parseInt(btn.dataset.price);
                if (price === 0) {
                    showNotification('✅ У вас уже есть эта рамка', 'success');
                } else {
                    purchaseItem(user.email, id, 'frame', price);
                }
            });
        });
    }

    var bannersEl = document.getElementById('exchange-banners');
    var banners = [
        { id: 'banner-none', name: 'Без баннера', price: 0 },
        { id: 'banner-blue', name: 'Синий градиент', price: 20 },
        { id: 'banner-purple', name: 'Фиолетовый градиент', price: 25 },
        { id: 'banner-fire', name: 'Огненный градиент', price: 30 },
        { id: 'banner-cyber', name: 'Кибер-сетка', price: 40 }
    ];
    
    if (bannersEl) {
        bannersEl.innerHTML = banners.map(function(b) {
            var btnText = b.price === 0 ? 'Бесплатно' : (coins >= b.price ? `Купить (${b.price})` : `${b.price} ARcoins`);
            var disabled = b.price > 0 && coins < b.price;
            
            return '<div class="exchange-item" data-banner-id="' + b.id + '">' +
                '<div class="exchange-item__preview exchange-item__preview--banner custom-banner custom-banner--' + b.id + '"></div>' +
                '<p class="exchange-item__name">' + (b.name || '') + '</p>' +
                '<p class="exchange-item__price">' + (b.price === 0 ? 'Бесплатно' : b.price + ' ARcoins') + '</p>' +
                '<button type="button" class="admin-btn exchange-item__btn" data-bid="' + b.id + '" data-price="' + b.price + '"' + (disabled ? ' disabled' : '') + '>' + btnText + '</button></div>';
        }).join('');
        
        bannersEl.querySelectorAll('[data-bid]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.dataset.bid;
                var price = parseInt(btn.dataset.price);
                if (price === 0) {
                    showNotification('✅ У вас уже есть этот баннер', 'success');
                } else {
                    purchaseItem(user.email, id, 'banner', price);
                }
            });
        });
    }

    var gifsEl = document.getElementById('exchange-gifs');
    var readyGifs = [
        { id: 'gif-banner-1', name: 'Кибер-неон', price: 35 },
        { id: 'gif-banner-2', name: 'Огонь', price: 45 },
        { id: 'gif-banner-3', name: 'Звёзды', price: 55 },
        { id: 'gif-banner-4', name: 'Волны', price: 65 },
        { id: 'gif-banner-5', name: 'Геометрия', price: 80 },
        { id: 'gif-banner-6', name: 'Космос', price: 100 }
    ];
    
    if (gifsEl) {
        gifsEl.innerHTML = readyGifs.map(function(g) {
            var btnText = coins >= g.price ? `Купить (${g.price})` : `${g.price} ARcoins`;
            var disabled = coins < g.price;
            
            return '<div class="exchange-item" data-gif-id="' + g.id + '">' +
                '<div class="exchange-item__preview exchange-item__preview--gif" style="background: #2a2a35;"></div>' +
                '<p class="exchange-item__name">' + (g.name || '') + '</p>' +
                '<p class="exchange-item__price">' + g.price + ' ARcoins</p>' +
                '<button type="button" class="admin-btn exchange-item__btn" data-gid="' + g.id + '" data-price="' + g.price + '"' + (disabled ? ' disabled' : '') + '>' + btnText + '</button></div>';
        }).join('');
        
        gifsEl.querySelectorAll('[data-gid]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.dataset.gid;
                var price = parseInt(btn.dataset.price);
                purchaseItem(user.email, id, 'gif', price);
            });
        });
    }
}

// ==================== УВЕДОМЛЕНИЯ ====================
function showNotification(message, type) {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 350px;
        `;
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: #252525;
        border-left: 4px solid ${type === 'success' ? '#00ff88' : '#ff4444'};
        border-radius: 12px;
        padding: 16px 20px;
        color: white;
        margin-bottom: 10px;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease forwards;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    notification.innerHTML = `
        <span style="font-size:1.5rem; color:${type === 'success' ? '#00ff88' : '#ff4444'};">${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ==================== ЛИДЕРБОРД (СТАРАЯ ФУНКЦИЯ ДЛЯ СОВМЕСТИМОСТИ) ====================
function renderLeaderboard() {
    loadLeaderboardFromDB();
}

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🟢 Страница загружена, инициализация...');
    
    // Загружаем турниры
    if (document.getElementById('tournaments-content')) {
        loadTournamentsFromDB();
    }
    
    // Загружаем компьютеры для бронирования
    if (document.getElementById('booking-content')) {
        loadComputersFromDB();
    }
    
    // Проверяем права админа
    checkAdminStatus();
    
    // Загружаем лидерборд
    if (document.getElementById('leaderboard-content')) {
        loadLeaderboardFromDB();
        setInterval(loadLeaderboardFromDB, 60000);
    }
});
