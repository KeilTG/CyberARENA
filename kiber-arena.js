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

let currentLeaderboardData = [];

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
initStorage();
renderTournaments();
renderHeaderUser();

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

if (localStorage.getItem('isDeveloper') === 'true') {
    var adminLink = document.getElementById('admin-link');
    if (adminLink) adminLink.classList.remove('footer__link--hidden');
}

// ==================== ЗАГРУЗКА ЛИДЕРБОРДА ИЗ БД ====================
async function loadLeaderboardFromDB() {
    const leaderboardBody = document.querySelector('#leaderboard-content .leaderboard__table tbody');
    if (!leaderboardBody) return;
    
    try {
        const baseUrl = window.location.origin;
        console.log('Загрузка лидерборда из:', `${baseUrl}/api/leaderboard`);
        
        const response = await fetch(`${baseUrl}/api/leaderboard`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        currentLeaderboardData = data;
        console.log('Получены данные лидерборда:', data);
        
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
                
                const initials = user.student ? user.student.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';
                
                return '<tr class="leaderboard__row">' +
                    '<td class="leaderboard__place">' + medalHtml + '</td>' +
                    '<td class="leaderboard__student">' +
                        '<span class="leaderboard__avatar" style="background: linear-gradient(135deg, #5582FF, #4568dc);">' + initials + '</span>' +
                        '<span>' + (user.student || '') + '</span>' +
                    '</td>' +
                    '<td>' + (user.group || '') + '</td>' +
                    '<td class="leaderboard__coins">' + (user.arcoins || 0) + '</td>' +
                '</tr>';
            }).join('');
        } else {
            leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px;">Нет данных для отображения</td></tr>';
        }
    } catch (error) {
        console.error('Ошибка загрузки лидерборда:', error);
        leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #ff4444;">Ошибка загрузки данных. Проверьте подключение к серверу.</td></tr>';
    }
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
        var avatarHtml = hasPhoto
            ? '<span class="header__user-avatar header__user-avatar--img" style="background-image:url(' + JSON.stringify(user.avatarUrl) + ')"></span>'
            : '<span class="header__user-avatar" style="background:' + avatarColor + '">' + initials + '</span>';
        var cust = typeof getUserCustomization === 'function' ? getUserCustomization(user.email || '') : {};
        var frameClass = ' custom-frame custom-frame--' + (cust.equippedFrame || 'frame-none');
        area.innerHTML = '<a href="kiber-profile/kiber-profile.html" class="header__user-block">' +
            '<span class="header__user-name">' + displayName + '</span>' +
            '<span class="header__user-coins">💰 ' + (user.arcoins || 100) + '</span>' +
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
    renderBooking();
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
    renderTournaments();
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
        renderTournaments();
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
        renderTournaments();
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
    loadLeaderboardFromDB(); // Загружаем из БД
});

// ==================== ДОСТИЖЕНИЯ ====================
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

// ==================== ОБМЕН ====================
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

// ==================== ДОСТИЖЕНИЯ (КОНСТАНТЫ И ФУНКЦИИ) ====================
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

// ==================== ТУРНИРЫ ====================
var tournamentModalEventId = null;

function renderTournaments() {
    var events = getEvents();
    var user = getCurrentUser();
    var filtered = events.filter(function(ev) {
        if (tournamentsFilterCategory && (ev.category || '') !== tournamentsFilterCategory) return false;
        if (tournamentsFilterFormat && (ev.format || '1v1') !== tournamentsFilterFormat) return false;
        return true;
    });
    if (!tournamentsGrid) return;
    tournamentsGrid.innerHTML = filtered.map(function(ev) {
        var imgStyle = ev.image ? 'background-image: url(\'' + ev.image.replace(/'/g, "\\'") + '\')' : '';
        var regs = typeof getRegistrationsForEvent === 'function' ? getRegistrationsForEvent(ev.id) : [];
        var isRegistered = user && user.email && regs.indexOf(user.email) !== -1;
        var max = ev.maxParticipants || 999;
        var isFull = regs.length >= max;
        var format = ev.format || '1v1';
        var leftBtnText = isRegistered ? 'Отменить запись' : isFull ? 'Мест нет' : 'Записаться';
        var leftBtnClass = 'event-card__btn event-card__btn--left' + (isRegistered ? ' event-card__btn--registered' : '') + (isFull && !isRegistered ? ' event-card__btn--disabled' : '');
        return '<article class="event-card" data-id="' + ev.id + '">' +
            '<h3 class="event-card__title">' + (ev.name || 'Мероприятие') + '</h3>' +
            '<span class="event-card__format event-card__format--' + format + '">' + format + '</span>' +
            '<div class="event-card__image" style="' + imgStyle + '"></div>' +
            '<div class="event-card__footer">' +
            '<button type="button" class="' + leftBtnClass + '" data-event-id="' + ev.id + '" data-action="' + (isRegistered ? 'unregister' : 'register') + '"' + (isFull && !isRegistered ? ' disabled' : '') + '>' + leftBtnText + '</button>' +
            '<button type="button" class="event-card__btn event-card__btn--right" data-event-id="' + ev.id + '" data-action="details">Подробнее</button>' +
            '</div></article>';
    }).join('');

    tournamentsGrid.querySelectorAll('[data-action="register"]').forEach(function(btn) {
        if (btn.disabled) return;
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var eventId = btn.dataset.eventId;
            if (!getCurrentUser()) {
                alert('Для регистрации на турнир необходимо войти в аккаунт.');
                return;
            }
            if (typeof registerForTournament === 'function') {
                registerForTournament(getCurrentUser().email, eventId);
                if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(getCurrentUser().email);
                renderTournaments();
                if (tournamentModalEventId === eventId) fillTournamentModal(getEvents().find(function(ev) { return ev.id === eventId; }));
            }
        });
    });
    tournamentsGrid.querySelectorAll('[data-action="unregister"]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var eventId = btn.dataset.eventId;
            var user = getCurrentUser();
            if (!user) return;
            if (typeof unregisterFromTournament === 'function') {
                unregisterFromTournament(user.email, eventId);
                renderTournaments();
                if (tournamentModalEventId === eventId) fillTournamentModal(getEvents().find(function(ev) { return ev.id === eventId; }));
            }
        });
    });
    tournamentsGrid.querySelectorAll('[data-action="details"]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var ev = getEvents().find(function(e) { return e.id === btn.dataset.eventId; });
            if (ev) openTournamentModal(ev);
        });
    });
}

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

function getUserNameByEmail(email) {
    var users = typeof getUsers === 'function' ? getUsers() : [];
    var u = users.find(function(x) { return x.email === email; });
    return (u && u.fio) ? u.fio : email || '—';
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
    var regs = typeof getRegistrationsForEvent === 'function' ? getRegistrationsForEvent(ev.id) : [];
    var isRegistered = user && regs.indexOf(user.email) !== -1;
    var max = ev.maxParticipants || 999;
    var isFull = regs.length >= max;

    var statusEl = document.getElementById('tournament-modal-reg-status');
    statusEl.textContent = 'Записано: ' + regs.length + ' / ' + max + (isRegistered ? ' (вы в списке)' : '');

    var regBtn = document.getElementById('tournament-modal-reg-btn');
    regBtn.textContent = isRegistered ? 'Отменить запись' : (isFull ? 'Мест нет' : 'Записаться');
    regBtn.disabled = !user || isFull && !isRegistered;
    regBtn.classList.toggle('tournament-modal__btn--danger', isRegistered);
    regBtn.onclick = function() {
        if (!user) { alert('Войдите в аккаунт.'); return; }
        if (isRegistered && typeof unregisterFromTournament === 'function') {
            unregisterFromTournament(user.email, ev.id);
        } else if (!isRegistered && typeof registerForTournament === 'function' && !isFull) {
            registerForTournament(user.email, ev.id);
            if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
        }
        fillTournamentModal(ev);
        renderTournaments();
    };

    var matches = typeof getMatchesForEvent === 'function' ? getMatchesForEvent(ev.id) : [];
    if (matches.length === 0 && typeof ensureDefaultMatchesForEvent === 'function') {
        matches = ensureDefaultMatchesForEvent(ev.id);
    }
    var format = ev.format || '1v1';
    var isTeamFormat = format === '3v3' || format === '5v5';
    var matchesHtml;
    if (matches.length === 0) {
        matchesHtml = '<p class="tournament-matches-empty">Матчи появятся после формирования сетки</p>';
    } else if (isTeamFormat) {
        matchesHtml = matches.map(function(m) {
            var team1 = m.team1 || [];
            var team2 = m.team2 || [];
            var names1 = team1.map(function(e) { return e ? getUserNameByEmail(e) : 'TBD'; }).join(', ');
            var names2 = team2.map(function(e) { return e ? getUserNameByEmail(e) : 'TBD'; }).join(', ');
            var score = (m.score1 != null && m.score2 != null) ? (m.score1 + ' : ' + m.score2) : '—';
            return '<div class="tournament-match tournament-match--team">' +
                '<span class="tournament-match__num">Матч ' + m.id + '</span>' +
                '<div class="tournament-match__teams">' +
                '<div class="tournament-match__team"><span class="tournament-match__team-label">Команда 1</span><span class="tournament-match__team-players">' + names1 + '</span></div>' +
                '<span class="tournament-match__vs">—</span>' +
                '<div class="tournament-match__team"><span class="tournament-match__team-label">Команда 2</span><span class="tournament-match__team-players">' + names2 + '</span></div>' +
                '</div>' +
                '<span class="tournament-match__score">' + score + '</span></div>';
        }).join('');
    } else {
        matchesHtml = matches.map(function(m) {
            var p1 = m.player1 ? getUserNameByEmail(m.player1) : 'TBD';
            var p2 = m.player2 ? getUserNameByEmail(m.player2) : 'TBD';
            var score = (m.score1 != null && m.score2 != null) ? (m.score1 + ' : ' + m.score2) : '—';
            return '<div class="tournament-match"><span class="tournament-match__num">Матч ' + m.id + '</span><span class="tournament-match__vs">' + p1 + ' — ' + p2 + '</span><span class="tournament-match__score">' + score + '</span></div>';
        }).join('');
    }
    document.getElementById('tournament-modal-matches').innerHTML = matchesHtml;

    var results = typeof getResultsForEvent === 'function' ? getResultsForEvent(ev.id) : [];
    var tbody = document.querySelector('#tournament-modal-results tbody');
    var resultsEmpty = document.getElementById('tournament-modal-results-empty');
    if (tbody) {
        tbody.innerHTML = results.length ? results.map(function(r) {
            return '<tr><td>' + (r.place || '—') + '</td><td>' + (r.name || getUserNameByEmail(r.userEmail || '')) + '</td></tr>';
        }).join('') : '';
    }
    if (resultsEmpty) resultsEmpty.style.display = results.length ? 'none' : 'block';

    var rewards = ev.rewards || [];
    document.getElementById('tournament-modal-rewards').innerHTML = rewards.length ? rewards.map(function(r) {
        return '<li class="tournament-reward-item"><span class="tournament-reward-place">' + r.place + ' место</span> — ' + (r.text || '') + '</li>';
    }).join('') : '<li>Награды уточняются</li>';
}

document.getElementById('tournament-modal-close').addEventListener('click', closeTournamentModal);
document.querySelector('.tournament-modal__backdrop').addEventListener('click', closeTournamentModal);

// ==================== БРОНИРОВАНИЕ ====================
function getBookingScheme() {
    return (typeof BOOKING_SCHEME !== 'undefined' && BOOKING_SCHEME.zones && BOOKING_SCHEME.zones.length)
        ? BOOKING_SCHEME
        : { zones: [{ id: 'hall', rows: 4, cols: 7, startSeatId: 1, x: 10, y: 15, width: 80, height: 70 }] };
}

function renderBooking() {
    if (!bookingGrid) return;
    var scheme = getBookingScheme();
    var zone = scheme.zones[0];
    var rows = zone.rows || 5;
    var cols = zone.cols || 7;
    var startSeatId = zone.startSeatId || 1;
    var bookings = getBookings();
    var html = '';
    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            var seatId = startSeatId + row * cols + col;
            var booking = bookings[seatId];
            var isBooked = !!booking;
            var cls = 'booking__seat' + (isBooked ? ' booking__seat--booked' : '');
            var status = isBooked ? '<div class="booking__seat-content"><span class="booking__status">Уже забронировано</span><span class="booking__time">' + (booking.time || '') + '</span><button type="button" class="booking__btn booking__btn--cancel" data-cancel-seat="' + seatId + '">Отмена</button></div>' : '<button type="button" class="booking__btn" data-seat="' + seatId + '">Бронь</button>';
            html += '<div class="' + cls + '" data-seat="' + seatId + '">' +
                '<span class="booking__seat-num">' + seatId + '</span>' + status + '</div>';
        }
    }
    bookingGrid.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(88px, 1fr))';
    bookingGrid.innerHTML = html;
    bookingGrid.querySelectorAll('.booking__btn[data-seat]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!getCurrentUser()) {
                alert('Для бронирования необходимо зарегистрироваться');
                return;
            }
            openBookingModal(parseInt(btn.dataset.seat, 10));
        });
    });
    bookingGrid.querySelectorAll('.booking__btn[data-cancel-seat]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!getCurrentUser()) {
                alert('Для отмены бронирования необходимо войти в аккаунт');
                return;
            }
            cancelBooking(parseInt(btn.dataset.cancelSeat, 10));
        });
    });
    bookingGrid.querySelectorAll('.booking__seat').forEach(function(seat) {
        seat.addEventListener('mouseenter', function() { showPcInfo(parseInt(seat.dataset.seat, 10)); });
        seat.addEventListener('mouseleave', function() { hidePcInfo(); });
    });
    renderBookingScheme();
}

function renderBookingScheme() {
    var floorEl = document.getElementById('booking-scheme-floor');
    var scheme = getBookingScheme();
    if (!floorEl || !scheme.zones.length) return;
    var bookings = getBookings();
    var zone0 = scheme.zones[0];
    var zx = zone0.x || 10;
    var zy = zone0.y || 15;
    var zw = zone0.width || 80;
    var zh = zone0.height || 70;
    var html = '';
    html += '<div class="booking__scheme-entrance" aria-hidden="true"><span class="booking__scheme-entrance-arrow">↑</span><span class="booking__scheme-entrance-text">Вход</span></div>';
    html += '<div class="booking__scheme-room-name" style="left:' + (zx + zw / 2) + '%;top:' + (zy - 4) + '%;" aria-hidden="true">Кабинет 210</div>';
    html += '<div class="booking__scheme-line booking__scheme-line--top" style="left:' + zx + '%;top:' + zy + '%;width:' + zw + '%"></div>';
    html += '<div class="booking__scheme-line booking__scheme-line--middle" style="left:' + zx + '%;top:' + (zy + zh / 2) + '%;width:' + zw + '%"></div>';
    html += '<div class="booking__scheme-line booking__scheme-line--bottom" style="left:' + zx + '%;top:' + (zy + zh) + '%;width:' + zw + '%"></div>';
    scheme.zones.forEach(function(zone) {
        var rows = zone.rows || 1;
        var cols = zone.cols || 1;
        var start = zone.startSeatId || 1;
        var zoneStyle = 'left:' + (zone.x || 0) + '%;top:' + (zone.y || 0) + '%;width:' + (zone.width || 80) + '%;height:' + (zone.height || 70) + '%;';
        html += '<div class="booking__scheme-zone" style="' + zoneStyle + '" data-zone="' + (zone.id || '') + '">';
        var gridRows = '1fr 1fr 0.35fr 1fr 1fr';
        if (rows !== 4) gridRows = 'repeat(' + rows + ',1fr)';
        html += '<div class="booking__scheme-zone-grid" style="grid-template-columns:repeat(' + cols + ',1fr);grid-template-rows:' + gridRows + ';">';
        for (var r = 0; r < rows; r++) {
            if (rows === 4 && r === 2) {
                html += '<div class="booking__scheme-row-spacer" style="grid-column:1/-1;"></div>';
            }
            for (var c = 0; c < cols; c++) {
                var seatId = start + r * cols + c;
                var booked = !!bookings[seatId];
                var cls = 'booking__scheme-seat' + (booked ? ' booking__scheme-seat--booked' : '');
                html += '<div class="' + cls + '" data-seat="' + seatId + '" role="button" tabindex="0" title="Место ' + seatId + '">';
                html += '<span class="booking__scheme-seat-num">' + seatId + '</span>';
                if (booked) html += '<span class="booking__scheme-seat-time">' + (bookings[seatId].time || '') + '</span>';
                html += '</div>';
            }
        }
        html += '</div></div>';
    });
    floorEl.innerHTML = html;
    floorEl.querySelectorAll('.booking__scheme-seat').forEach(function(el) {
        var seatId = parseInt(el.dataset.seat, 10);
        el.addEventListener('click', function(e) {
            e.preventDefault();
            if (!getCurrentUser()) {
                alert('Для бронирования необходимо зарегистрироваться');
                return;
            }
            if (el.classList.contains('booking__scheme-seat--booked')) return;
            openBookingModal(seatId);
        });
        el.addEventListener('mouseenter', function() { showPcInfo(seatId); });
        el.addEventListener('mouseleave', function() { hidePcInfo(); });
    });
}

var bookingListEl = document.getElementById('booking-view-list');
var bookingSchemeEl = document.getElementById('booking-view-scheme');
document.querySelectorAll('.booking__tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var view = btn.dataset.view;
        document.querySelectorAll('.booking__tab').forEach(function(b) {
            b.classList.toggle('booking__tab--active', b.dataset.view === view);
            b.setAttribute('aria-pressed', b.dataset.view === view ? 'true' : 'false');
        });
        if (bookingListEl) bookingListEl.classList.toggle('booking__view--hidden', view !== 'list');
        if (bookingSchemeEl) bookingSchemeEl.classList.toggle('booking__view--hidden', view !== 'scheme');
        if (view === 'scheme') renderBookingScheme();
    });
});

var bookingModalSeat = null;
function openBookingModal(seatId) {
    bookingModalSeat = seatId;
    document.getElementById('booking-modal-seat').textContent = seatId;
    document.getElementById('booking-time-start').value = '';
    document.getElementById('booking-time-end').value = '';
    document.getElementById('booking-modal').classList.remove('modal--hidden');
}

function closeBookingModal() {
    document.getElementById('booking-modal').classList.add('modal--hidden');
    bookingModalSeat = null;
}

function cancelBooking(seatId) {
    var bookings = getBookings();
    delete bookings[seatId];
    setBookings(bookings);
    renderBooking();
}

document.getElementById('booking-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var timeStart = document.getElementById('booking-time-start').value.trim();
    var timeEnd = document.getElementById('booking-time-end').value.trim();
    if (!timeStart || !timeEnd || !bookingModalSeat) return;
    if (timeStart >= timeEnd) {
        alert('Время окончания должно быть позже времени начала');
        return;
    }
    var time = timeStart + '–' + timeEnd;
    var user = getCurrentUser();
    if (!user) return;
    var bookings = getBookings();
    var entry = { time: time, userEmail: user.email || '' };
    bookings[bookingModalSeat] = entry;
    setBookings(bookings);
    if (typeof addToBookingHistory === 'function') {
      addToBookingHistory({
        seatId: bookingModalSeat,
        time: time,
        userEmail: user.email || '',
        bookedAt: new Date().toISOString()
      });
    }
    if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
    closeBookingModal();
    renderBooking();
});

document.getElementById('booking-cancel').addEventListener('click', closeBookingModal);
document.querySelector('#booking-modal .modal__overlay').addEventListener('click', closeBookingModal);

function showPcInfo(seatId) {
    var spec = PC_SPECS[seatId - 1];
    var info = document.getElementById('booking-pc-info');
    info.innerHTML = '<p class="booking__pc-spec"><strong>Место ' + seatId + '</strong></p>' +
        '<p class="booking__pc-spec">Видеокарта: ' + (spec.gpu || '—') + '</p>' +
        '<p class="booking__pc-spec">Процессор: ' + (spec.cpu || '—') + '</p>' +
        '<p class="booking__pc-spec">ОЗУ: ' + (spec.ram || '—') + '</p>' +
        '<p class="booking__pc-spec">Монитор: ' + (spec.monitor || '—') + '</p>';
}

function hidePcInfo() {
    document.getElementById('booking-pc-info').innerHTML = '<p class="booking__pc-placeholder">Наведите на место, чтобы увидеть характеристики</p>';
}

// ==================== ОБМЕН ====================
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
    var cust = typeof getUserCustomization === 'function' ? getUserCustomization(user ? user.email : '') : { ownedFrames: [], ownedBanners: [], equippedFrame: 'frame-none', equippedBanner: 'banner-none' };
    var coins = typeof getCoinsForUserEmail === 'function' && user ? getCoinsForUserEmail(user.email) : 0;

    var framesEl = document.getElementById('exchange-frames');
    var frames = typeof getCustomizationFrames === 'function' ? getCustomizationFrames() : [];
    if (framesEl && frames.length) {
        framesEl.innerHTML = frames.map(function(f) {
            var owned = cust.ownedFrames.indexOf(f.id) !== -1;
            var equipped = cust.equippedFrame === f.id;
            var canBuy = !owned && f.price > 0 && coins >= f.price;
            var btnText = equipped ? 'Надето' : owned ? 'Надеть' : (f.price === 0 ? 'Бесплатно' : (coins >= f.price ? 'Купить (' + f.price + ')' : f.price + ' ARcoins'));
            var disabled = equipped || (f.price > 0 && !owned && coins < f.price);
            return '<div class="exchange-item" data-frame-id="' + f.id + '">' +
                '<div class="exchange-item__preview exchange-item__preview--frame custom-frame custom-frame--' + f.id + '"></div>' +
                '<p class="exchange-item__name">' + (f.name || '') + '</p>' +
                '<p class="exchange-item__price">' + (f.price === 0 ? 'Бесплатно' : f.price + ' ARcoins') + '</p>' +
                '<button type="button" class="admin-btn exchange-item__btn" data-fid="' + f.id + '"' + (disabled ? ' disabled' : '') + '>' + btnText + '</button></div>';
        }).join('');
        framesEl.querySelectorAll('[data-fid]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.dataset.fid;
                if (typeof purchaseFrame === 'function' && user) {
                    purchaseFrame(user.email, id);
                    if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
                    renderExchange();
                    renderHeaderUser();
                }
            });
        });
    }

    var bannersEl = document.getElementById('exchange-banners');
    var banners = typeof getCustomizationBanners === 'function' ? getCustomizationBanners() : [];
    if (bannersEl && banners.length) {
        bannersEl.innerHTML = banners.map(function(b) {
            var owned = cust.ownedBanners.indexOf(b.id) !== -1;
            var equipped = cust.equippedBanner === b.id;
            var canBuy = !owned && b.price > 0 && coins >= b.price;
            var btnText = equipped ? 'Надето' : owned ? 'Надеть' : (b.price === 0 ? 'Бесплатно' : (coins >= b.price ? 'Купить (' + b.price + ')' : b.price + ' ARcoins'));
            var disabled = equipped || (b.price > 0 && !owned && coins < b.price);
            return '<div class="exchange-item" data-banner-id="' + b.id + '">' +
                '<div class="exchange-item__preview exchange-item__preview--banner custom-banner custom-banner--' + b.id + '"></div>' +
                '<p class="exchange-item__name">' + (b.name || '') + '</p>' +
                '<p class="exchange-item__price">' + (b.price === 0 ? 'Бесплатно' : b.price + ' ARcoins') + '</p>' +
                '<button type="button" class="admin-btn exchange-item__btn" data-bid="' + b.id + '"' + (disabled ? ' disabled' : '') + '>' + btnText + '</button></div>';
        }).join('');
        bannersEl.querySelectorAll('[data-bid]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.dataset.bid;
                if (typeof purchaseBanner === 'function' && user) {
                    purchaseBanner(user.email, id);
                    if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
                    renderExchange();
                    renderHeaderUser();
                }
            });
        });
    }

    var gifsEl = document.getElementById('exchange-gifs');
    var readyGifs = typeof getReadyGifBanners === 'function' ? getReadyGifBanners() : [];
    if (gifsEl && readyGifs.length) {
        gifsEl.innerHTML = readyGifs.map(function(g) {
            var owned = cust.ownedBanners.indexOf(g.id) !== -1;
            var equipped = cust.equippedBanner === g.id;
            var btnText = equipped ? 'Надето' : owned ? 'Надеть' : (coins >= g.price ? 'Купить (' + g.price + ')' : g.price + ' ARcoins');
            var disabled = equipped || (!owned && coins < g.price);
            return '<div class="exchange-item" data-gif-id="' + g.id + '">' +
                '<div class="exchange-item__preview exchange-item__preview--gif" style="background-image:url(' + (g.gifUrl ? g.gifUrl.replace(/"/g, '&quot;') : '') + ')"></div>' +
                '<p class="exchange-item__name">' + (g.name || '') + '</p>' +
                '<p class="exchange-item__price">' + g.price + ' ARcoins</p>' +
                '<button type="button" class="admin-btn exchange-item__btn" data-gid="' + g.id + '"' + (disabled ? ' disabled' : '') + '>' + btnText + '</button></div>';
        }).join('');
        gifsEl.querySelectorAll('[data-gid]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.dataset.gid;
                if (typeof purchaseReadyGifBanner === 'function' && user) {
                    purchaseReadyGifBanner(user.email, id);
                    if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
                    renderExchange();
                    renderHeaderUser();
                }
            });
        });
    }
}

// ==================== ЛИДЕРБОРД (СТАРАЯ ФУНКЦИЯ) ====================
function renderLeaderboard() {
    // Эта функция оставлена для совместимости, но теперь используем loadLeaderboardFromDB
    loadLeaderboardFromDB();
}

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ====================
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем лидерборд из БД при старте
    loadLeaderboardFromDB();
    
    // Обновляем каждые 30 секунд
    setInterval(loadLeaderboardFromDB, 30000);
});