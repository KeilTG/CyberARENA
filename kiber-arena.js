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

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
initStorage();
// Синхронизация пользователя: если вход был через forma-signin.js (current_user), копируем в kiber_arena_current_user
if (!getCurrentUser()) {
    try {
        var stored = localStorage.getItem('current_user');
        if (stored) {
            var u = JSON.parse(stored);
            if (u && u.email) setCurrentUser(u);
        }
    } catch (e) {}
}
renderTournaments();
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
            // Обновляем статус админа в текущем пользователе
            const currentUser = getCurrentUser();
            if (currentUser) {
                currentUser.is_admin = true;
                setCurrentUser(currentUser);
            }
            
            // Показываем ссылку на админку
            const adminLink = document.getElementById('admin-link');
            if (adminLink) adminLink.classList.remove('footer__link--hidden');
            
            return true;
        } else {
            // Скрываем ссылку на админку
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
        console.log('📤 Запрос к:', `${baseUrl}/api/leaderboard`);
        
        const response = await fetch(`${baseUrl}/api/leaderboard`);
        console.log('📥 Статус ответа:', response.status);
        
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
                
                // Получаем инициалы из ФИО
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
            console.log('ℹ️ Нет данных для отображения');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки лидерборда:', error);
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
        var avatarUrlEsc = (user.avatarUrl || '').replace(/'/g, "\\27");
        var avatarHtml = hasPhoto
            ? '<span class="header__user-avatar header__user-avatar--img" style="background-image:url(\'' + avatarUrlEsc + '\')"></span>'
            : '<span class="header__user-avatar" style="background:' + avatarColor + '">' + initials + '</span>';
        var cust = typeof getUserCustomization === 'function' ? getUserCustomization(user.email || '') : {};
        var frameClass = ' custom-frame custom-frame--' + (cust.equippedFrame || 'frame-none');
        
        // Получаем актуальные коины пользователя
        var userCoins = user.arcoins || 100;
        
        // Проверяем, админ ли пользователь
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
    renderBooking();
});

// После возврата из админки (добавили зону) — обновить список бронирования, если открыта эта вкладка
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && bookingContent && !bookingContent.classList.contains('booking--hidden')) {
        renderBooking();
    }
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
        var rewardClaimed = !!(data.rewardedCoins && data.rewardedCoins[a.id]);
        var current = typeof getAchievementProgressValue === 'function' ? getAchievementProgressValue(user.email, a.condition.type) : 0;
        var target = a.condition.value;
        var label = achievementConditionLabels[a.condition.type] || a.condition.type;
        var progressText = current + ' / ' + target;
        var rewardText = a.rewardCoins ? ' +' + a.rewardCoins + ' ARcoins' : '';
        var cardClass = 'achievements__card' + (unlocked ? ' achievements__card--unlocked' : ' achievements__card--locked');
        var rareClass = a.rare ? ' achievements__card--rare' : '';
        var badgeOrBtn = '';
        if (unlocked) {
            if (a.rewardCoins && a.rewardCoins > 0) {
                if (rewardClaimed) {
                    badgeOrBtn = '<span class="achievements__card-badge">Награда получена</span>';
                } else {
                    badgeOrBtn = '<button type="button" class="achievements__claim-btn admin-btn admin-btn--primary" data-achievement-id="' + a.id + '">Получить награду (' + a.rewardCoins + ' ARcoins)</button>';
                }
            } else {
                badgeOrBtn = '<span class="achievements__card-badge">Получено</span>';
            }
        }
        return '<article class="' + cardClass + rareClass + '" data-id="' + a.id + '">' +
            '<div class="achievements__card-icon">' + (a.icon || '🏅') + '</div>' +
            '<h3 class="achievements__card-title">' + (a.name || '') + '</h3>' +
            '<p class="achievements__card-desc">' + (a.description || '') + '</p>' +
            '<p class="achievements__card-condition">' + label + ': ' + progressText + (rewardText ? ' <span class="achievements__card-reward">' + rewardText + '</span>' : '') + '</p>' +
            '<div class="achievements__card-progress"><span class="achievements__card-progress-bar" style="width:' + Math.min(100, (current / target) * 100) + '%"></span></div>' +
            badgeOrBtn +
            '</article>';
    }).join('');
    grid.querySelectorAll('.achievements__claim-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var aid = btn.dataset.achievementId;
            if (!aid || !user || !user.email) return;
            btn.disabled = true;
            var baseUrl = window.location.origin;
            fetch(baseUrl + '/api/achievement-claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, achievement_id: aid })
            }).then(function(res) { return res.json().then(function(body) { return { ok: res.ok, status: res.status, body: body }; }); }).then(function(r) {
                if (r.ok && r.body.success) {
                    user.arcoins = r.body.new_balance;
                    setCurrentUser(user);
                    if (typeof setAchievementRewardClaimed === 'function') setAchievementRewardClaimed(user.email, aid);
                    renderAchievements();
                    renderHeaderUser();
                } else {
                    if (r.body.detail === 'Награда уже получена' && typeof setAchievementRewardClaimed === 'function') {
                        setAchievementRewardClaimed(user.email, aid);
                        renderAchievements();
                    } else {
                        alert(r.body.detail || 'Не удалось получить награду');
                    }
                    btn.disabled = false;
                }
            }).catch(function(err) {
                console.error(err);
                alert('Ошибка соединения с сервером');
                btn.disabled = false;
            });
        });
    });
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
            var teamName1 = typeof getTeamNameForMemberEmails === 'function' ? getTeamNameForMemberEmails(team1) : null;
            var teamName2 = typeof getTeamNameForMemberEmails === 'function' ? getTeamNameForMemberEmails(team2) : null;
            var display1 = teamName1 || team1.map(function(e) { return e ? getUserNameByEmail(e) : 'TBD'; }).join(', ');
            var display2 = teamName2 || team2.map(function(e) { return e ? getUserNameByEmail(e) : 'TBD'; }).join(', ');
            var score = (m.score1 != null && m.score2 != null) ? (m.score1 + ' : ' + m.score2) : '—';
            return '<div class="tournament-match tournament-match--team">' +
                '<span class="tournament-match__num">Матч ' + m.id + '</span>' +
                '<div class="tournament-match__teams">' +
                '<div class="tournament-match__team"><span class="tournament-match__team-label">' + (teamName1 ? '' : 'Команда 1') + '</span><span class="tournament-match__team-players">' + (teamName1 || display1) + '</span></div>' +
                '<span class="tournament-match__vs">—</span>' +
                '<div class="tournament-match__team"><span class="tournament-match__team-label">' + (teamName2 ? '' : 'Команда 2') + '</span><span class="tournament-match__team-players">' + (teamName2 || display2) + '</span></div>' +
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
    // Всегда читаем схему из localStorage заново (зоны сохраняются в админке в тот же localStorage)
    var scheme = getBookingScheme();
    var zones = scheme.zones || [];
    if (!zones.length) return;
    var bookings = getBookings();
    var html = '';
    zones.forEach(function(zone) {
        var zoneId = zone.id || 'hall';
        var zoneName = zone.name || zoneId;
        var rows = zone.rows || 5;
        var cols = zone.cols || 7;
        var startSeatId = zone.startSeatId || 1;
        html += '<div class="booking__zone-block">';
        html += '<h3 class="booking__zone-title">' + (zoneName.replace(/</g, '&lt;')) + '</h3>';
        html += '<div class="booking__zone-grid" style="grid-template-columns:repeat(' + cols + ', minmax(88px, 1fr))">';
        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var seatId = startSeatId + row * cols + col;
                var key = typeof getBookingKey === 'function' ? getBookingKey(zoneId, seatId) : seatId;
                var booking = bookings[key];
                var isBooked = !!booking;
                var cls = 'booking__seat' + (isBooked ? ' booking__seat--booked' : '');
                var status;
                if (isBooked) {
                    var curUser = getCurrentUser();
                    var isOwner = curUser && (curUser.email === booking.userEmail);
                    var fioEsc = (booking.userFio || booking.userEmail || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
                    var cancelBtn = isOwner ? '<button type="button" class="booking__btn booking__btn--cancel" data-zone-id="' + (zoneId.replace(/"/g, '&quot;')) + '" data-cancel-seat="' + seatId + '">Отмена</button>' : '';
                    status = '<div class="booking__seat-content"><span class="booking__status">Место забронировано</span><span class="booking__seat-fio">' + fioEsc + '</span><span class="booking__time">' + (booking.time || '') + '</span>' + cancelBtn + '</div>';
                } else {
                    status = '<button type="button" class="booking__btn" data-zone-id="' + (zoneId.replace(/"/g, '&quot;')) + '" data-seat="' + seatId + '">Бронь</button>';
                }
                html += '<div class="' + cls + '" data-zone-id="' + (zoneId.replace(/"/g, '&quot;')) + '" data-seat="' + seatId + '">' +
                    '<span class="booking__seat-num">' + seatId + '</span>' + status + '</div>';
            }
        }
        html += '</div></div>';
    });
    bookingGrid.classList.add('booking__grid--zones');
    bookingGrid.style.display = 'flex';
    bookingGrid.style.flexDirection = 'column';
    bookingGrid.style.gap = zones.length > 1 ? '32px' : '0';
    bookingGrid.style.gridTemplateColumns = '';
    bookingGrid.innerHTML = html;
    bookingGrid.querySelectorAll('.booking__btn[data-seat]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!getCurrentUser()) {
                alert('Для бронирования необходимо зарегистрироваться');
                return;
            }
            openBookingModal(btn.dataset.zoneId || 'hall', parseInt(btn.dataset.seat, 10));
        });
    });
    bookingGrid.querySelectorAll('.booking__btn[data-cancel-seat]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!getCurrentUser()) {
                alert('Для отмены бронирования необходимо войти в аккаунт');
                return;
            }
            cancelBooking(btn.dataset.zoneId || 'hall', parseInt(btn.dataset.cancelSeat, 10));
        });
    });
    bookingGrid.querySelectorAll('.booking__seat').forEach(function(seat) {
        seat.addEventListener('mouseenter', function() { showPcInfo(parseInt(seat.dataset.seat, 10), seat.dataset.zoneId || 'hall'); });
        seat.addEventListener('mouseleave', function() { hidePcInfo(); });
    });
    renderBookingScheme();
}

function renderBookingScheme() {
    var floorEl = document.getElementById('booking-scheme-floor');
    var scheme = getBookingScheme();
    if (!floorEl || !scheme.zones || !scheme.zones.length) return;
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
        var zoneId = zone.id || 'hall';
        for (var r = 0; r < rows; r++) {
            if (rows === 4 && r === 2) {
                html += '<div class="booking__scheme-row-spacer" style="grid-column:1/-1;"></div>';
            }
            for (var c = 0; c < cols; c++) {
                var seatId = start + r * cols + c;
                var key = typeof getBookingKey === 'function' ? getBookingKey(zoneId, seatId) : seatId;
                var seatBooking = bookings[key];
                var booked = !!seatBooking;
                var cls = 'booking__scheme-seat' + (booked ? ' booking__scheme-seat--booked' : '');
                var schemeTitle = 'Место ' + seatId;
                if (booked) schemeTitle += ' · Забронировано: ' + (seatBooking.userFio || seatBooking.userEmail || '');
                html += '<div class="' + cls + '" data-seat="' + seatId + '" data-zone="' + (zoneId.replace(/"/g, '&quot;')) + '" role="button" tabindex="0" title="' + (schemeTitle.replace(/"/g, '&quot;')) + '">';
                html += '<span class="booking__scheme-seat-num">' + seatId + '</span>';
                if (booked) {
                    html += '<span class="booking__scheme-seat-fio">' + (seatBooking.userFio || seatBooking.userEmail || '').replace(/</g, '&lt;') + '</span>';
                    html += '<span class="booking__scheme-seat-time">' + (seatBooking.time || '') + '</span>';
                }
                html += '</div>';
            }
        }
        html += '</div></div>';
    });
    floorEl.innerHTML = html;
    floorEl.querySelectorAll('.booking__scheme-seat').forEach(function(el) {
        var seatId = parseInt(el.dataset.seat, 10);
        var zoneId = el.dataset.zone || 'hall';
        el.addEventListener('click', function(e) {
            e.preventDefault();
            if (!getCurrentUser()) {
                alert('Для бронирования необходимо зарегистрироваться');
                return;
            }
            if (el.classList.contains('booking__scheme-seat--booked')) return;
            openBookingModal(zoneId, seatId);
        });
        el.addEventListener('mouseenter', function() { showPcInfo(seatId, zoneId); });
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

/** Доступные слоты бронирования: по умолчанию зал 9:00–18:00, но список можно настроить в админке. */
function getCurrentAllowedBookingSlots() {
    // Если есть конфиг в localStorage (настроенный через админку) — используем его.
    if (typeof getBookingSlotsConfig === 'function') {
        var cfg = getBookingSlotsConfig();
        if (Array.isArray(cfg) && cfg.length) return cfg;
    }
    // Иначе — дефолт из kiber-arena-data.js
    if (typeof DEFAULT_BOOKING_SLOTS !== 'undefined' && DEFAULT_BOOKING_SLOTS && DEFAULT_BOOKING_SLOTS.length) {
        return DEFAULT_BOOKING_SLOTS;
    }
    return [];
}

function formatBookingDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T12:00:00');
    var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return d.getDate() + ' ' + (months[d.getMonth()] || '');
}

function updateBookingTimeSummary() {
    var dateInput = document.getElementById('booking-date-input');
    var startVal = document.getElementById('booking-time-start').value;
    var endVal = document.getElementById('booking-time-end').value;
    var dateStr = dateInput ? dateInput.value : '';
    var dateLabel = dateStr ? formatBookingDate(dateStr) : '';
    var elDate = document.getElementById('booking-summary-date');
    var elDateEnd = document.getElementById('booking-summary-date-end');
    var elStart = document.getElementById('booking-summary-start');
    var elEnd = document.getElementById('booking-summary-end');
    var elDuration = document.getElementById('booking-duration-text');
    if (elDate) elDate.textContent = dateLabel;
    if (elDateEnd) elDateEnd.textContent = dateLabel;
    if (elStart) elStart.textContent = startVal || '—';
    if (elEnd) elEnd.textContent = endVal || '—';
    if (elDuration && startVal && endVal) {
        elDuration.textContent = 'Продолжительность 20 мин';
    }
}

function initBookingTimePicker() {
    var listEl = document.getElementById('booking-time-slots-list');
    var dateInput = document.getElementById('booking-date-input');
    if (!listEl) return;
    var slots = getCurrentAllowedBookingSlots();
    listEl.innerHTML = slots.map(function(slot, idx) {
        return '<div class="booking-time-picker__option booking-time-picker__option--slot" data-start="' + slot.start + '" data-end="' + slot.end + '" role="option" tabindex="0">' + slot.start + ' – ' + slot.end + '</div>';
    }).join('');
    listEl.querySelectorAll('.booking-time-picker__option--slot').forEach(function(opt) {
        opt.addEventListener('click', function() {
            var start = opt.dataset.start;
            var end = opt.dataset.end;
            document.getElementById('booking-time-start').value = start;
            document.getElementById('booking-time-end').value = end;
            listEl.querySelectorAll('.booking-time-picker__option--slot').forEach(function(o) { o.classList.remove('booking-time-picker__option--selected'); });
            opt.classList.add('booking-time-picker__option--selected');
            updateBookingTimeSummary();
        });
    });
    if (dateInput) {
        var today = new Date();
        var y = today.getFullYear();
        var m = (today.getMonth() + 1) < 10 ? '0' + (today.getMonth() + 1) : (today.getMonth() + 1);
        var day = today.getDate() < 10 ? '0' + today.getDate() : today.getDate();
        dateInput.value = y + '-' + m + '-' + day;
        dateInput.addEventListener('change', function() {
            document.getElementById('booking-date').value = dateInput.value;
            updateBookingTimeSummary();
        });
    }
}

var bookingModalSeat = null;
var bookingModalZoneId = 'hall';
function openBookingModal(zoneId, seatId) {
    if (arguments.length === 1 && typeof zoneId === 'number') { seatId = zoneId; zoneId = 'hall'; }
    bookingModalZoneId = zoneId || 'hall';
    bookingModalSeat = seatId;
    document.getElementById('booking-modal-seat').textContent = seatId;
    var dateInput = document.getElementById('booking-date-input');
    var today = new Date();
    var y = today.getFullYear();
    var m = (today.getMonth() + 1) < 10 ? '0' + (today.getMonth() + 1) : (today.getMonth() + 1);
    var day = today.getDate() < 10 ? '0' + today.getDate() : today.getDate();
    if (dateInput) dateInput.value = y + '-' + m + '-' + day;
    document.getElementById('booking-date').value = dateInput ? dateInput.value : '';
    var slots = getCurrentAllowedBookingSlots();
    var first = slots[0];
    document.getElementById('booking-time-start').value = first ? first.start : '';
    document.getElementById('booking-time-end').value = first ? first.end : '';
    var listEl = document.getElementById('booking-time-slots-list');
    if (listEl && first) {
        listEl.querySelectorAll('.booking-time-picker__option--slot').forEach(function(o) { o.classList.remove('booking-time-picker__option--selected'); });
        var firstOpt = listEl.querySelector('[data-start="' + first.start + '"]');
        if (firstOpt) firstOpt.classList.add('booking-time-picker__option--selected');
    }
    updateBookingTimeSummary();
    document.getElementById('booking-modal').classList.remove('modal--hidden');
}

function closeBookingModal() {
    document.getElementById('booking-modal').classList.add('modal--hidden');
    bookingModalSeat = null;
    bookingModalZoneId = 'hall';
}

function cancelBooking(zoneId, seatId) {
    if (arguments.length === 1) { seatId = zoneId; zoneId = 'hall'; }
    zoneId = zoneId || 'hall';
    var key = typeof getBookingKey === 'function' ? getBookingKey(zoneId, seatId) : seatId;
    var bookings = getBookings();
    delete bookings[key];
    setBookings(bookings);
    renderBooking();
}

document.getElementById('booking-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var dateInput = document.getElementById('booking-date-input');
    var dateVal = dateInput ? dateInput.value : '';
    var timeStart = document.getElementById('booking-time-start').value.trim();
    var timeEnd = document.getElementById('booking-time-end').value.trim();
    if (!timeStart || !timeEnd || !bookingModalSeat) return;
    var allowedSlots = getCurrentAllowedBookingSlots();
    var allowed = allowedSlots.some(function(s) { return s.start === timeStart && s.end === timeEnd; });
    if (!allowed) {
        alert('Выберите один из доступных слотов (зал 9:00–18:00).');
        return;
    }
    var time = timeStart + '–' + timeEnd;
    var user = getCurrentUser();
    if (!user) return;
    var zoneId = bookingModalZoneId || 'hall';
    var key = typeof getBookingKey === 'function' ? getBookingKey(zoneId, bookingModalSeat) : bookingModalSeat;
    var bookings = getBookings();
    var entry = { time: time, userEmail: user.email || '', userFio: user.fio || '', date: dateVal || undefined };
    bookings[key] = entry;
    setBookings(bookings);
    if (typeof addToBookingHistory === 'function') {
      addToBookingHistory({
        seatId: bookingModalSeat,
        time: time,
        date: dateVal || undefined,
        userEmail: user.email || '',
        userFio: user.fio || '',
        bookedAt: new Date().toISOString()
      });
    }
    if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
    closeBookingModal();
    renderBooking();
});

document.getElementById('booking-cancel').addEventListener('click', closeBookingModal);
document.querySelector('#booking-modal .modal__overlay').addEventListener('click', closeBookingModal);
if (document.getElementById('booking-time-slots-list')) initBookingTimePicker();

function showPcInfo(seatId, zoneId) {
    var spec = PC_SPECS[seatId - 1];
    var info = document.getElementById('booking-pc-info');
    var zoneLabel = zoneId ? ' · ' + zoneId : '';
    info.innerHTML = '<p class="booking__pc-spec"><strong>Место ' + seatId + (zoneLabel || '') + '</strong></p>' +
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
    var coins = user.arcoins || 100;

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
            btn.addEventListener('click', async function() {
                var id = btn.dataset.fid;
                if (!user || !user.email) return;
                var owned = cust.ownedFrames.indexOf(id) !== -1;
                var f = frames.find(function(x) { return x.id === id; });
                var price = f ? f.price : 0;
                if (owned || price === 0) {
                    if (typeof purchaseFrame === 'function') {
                        purchaseFrame(user.email, id);
                        if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
                    }
                    renderExchange();
                    renderHeaderUser();
                    return;
                }
                try {
                    var baseUrl = window.location.origin;
                    var res = await fetch(baseUrl + '/api/purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user.email, item_type: 'frame', item_id: id })
                    });
                    var data = await res.json();
                    if (res.ok && data.success) {
                        user.arcoins = data.new_balance;
                        setCurrentUser(user);
                        if (typeof addOwnedFrame === 'function') addOwnedFrame(user.email, id);
                        if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
                        renderExchange();
                        renderHeaderUser();
                    } else {
                        alert(data.detail || 'Не удалось купить');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Ошибка соединения с сервером');
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
            btn.addEventListener('click', async function() {
                var id = btn.dataset.bid;
                if (!user || !user.email) return;
                var owned = cust.ownedBanners.indexOf(id) !== -1;
                var b = banners.find(function(x) { return x.id === id; });
                var price = b ? b.price : 0;
                if (owned || price === 0) {
                    if (typeof purchaseBanner === 'function') {
                        purchaseBanner(user.email, id);
                        if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
                    }
                    renderExchange();
                    renderHeaderUser();
                    return;
                }
                try {
                    var baseUrl = window.location.origin;
                    var res = await fetch(baseUrl + '/api/purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user.email, item_type: 'banner', item_id: id })
                    });
                    var data = await res.json();
                    if (res.ok && data.success) {
                        user.arcoins = data.new_balance;
                        setCurrentUser(user);
                        if (typeof addOwnedBanner === 'function') addOwnedBanner(user.email, id);
                        if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
                        renderExchange();
                        renderHeaderUser();
                    } else {
                        alert(data.detail || 'Не удалось купить');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Ошибка соединения с сервером');
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
            btn.addEventListener('click', async function() {
                var id = btn.dataset.gid;
                if (!user || !user.email) return;
                var owned = cust.ownedBanners.indexOf(id) !== -1;
                var g = readyGifs.find(function(x) { return x.id === id; });
                var price = g ? g.price : 0;
                if (owned) {
                    if (typeof purchaseReadyGifBanner === 'function') {
                        purchaseReadyGifBanner(user.email, id);
                        if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
                    }
                    renderExchange();
                    renderHeaderUser();
                    return;
                }
                try {
                    var baseUrl = window.location.origin;
                    var res = await fetch(baseUrl + '/api/purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user.email, item_type: 'gif', item_id: id })
                    });
                    var data = await res.json();
                    if (res.ok && data.success) {
                        user.arcoins = data.new_balance;
                        setCurrentUser(user);
                        if (typeof addOwnedGifBanner === 'function') addOwnedGifBanner(user.email, id);
                        if (typeof checkAndAwardAchievements === 'function') checkAndAwardAchievements(user.email);
                        renderExchange();
                        renderHeaderUser();
                    } else {
                        alert(data.detail || 'Не удалось купить');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Ошибка соединения с сервером');
                }
            });
        });
    }
}

// ==================== ЛИДЕРБОРД ИЗ БД ====================
function renderLeaderboard() {
    loadLeaderboardFromDB();
}

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🟢 Страница загружена, инициализация...');
    
    // Проверяем права админа
    checkAdminStatus();
    
    // Загружаем лидерборд если мы на главной странице
    if (document.getElementById('leaderboard-content')) {
        // Первая загрузка
        loadLeaderboardFromDB();
        
        // Автоматическое обновление каждую минуту
        setInterval(loadLeaderboardFromDB, 60000);
        console.log('⏱️ Автообновление лидерборда каждую минуту');
    }
});