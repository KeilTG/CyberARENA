/* Основная логика сайта */

var mainContent = document.getElementById('main-content');
var leaderboardContent = document.getElementById('leaderboard-content');
var tournamentsContent = document.getElementById('tournaments-content');
var bookingContent = document.getElementById('booking-content');
var welcomeContent = document.getElementById('welcome-content');
var tournamentsGrid = document.getElementById('tournaments-grid');
var bookingGrid = document.getElementById('booking-grid');
var tournamentsFilterCategory = '';

initStorage();
renderTournaments();
renderLeaderboard();
renderHeaderUser();
if (localStorage.getItem('isDeveloper') === 'true') {
    var adminLink = document.getElementById('admin-link');
    if (adminLink) adminLink.classList.remove('footer__link--hidden');
}
var mainContent = document.getElementById('main-content');
var leaderboardContent = document.getElementById('leaderboard-content');
var welcomeContent = document.getElementById('welcome-content');

function hideWelcome() {
    welcomeContent.classList.add('welcome-card--hidden');
}

function renderHeaderUser() {
    var area = document.getElementById('header-user-area');
    if (!area) return;
    var user = getCurrentUser();
    if (user && user.fio) {
        var displayName = typeof formatNameAsSurnameInitials === 'function' ? formatNameAsSurnameInitials(user.fio) : user.fio;
        var initials = typeof getInitialsFromName === 'function' ? getInitialsFromName(user.fio) : '?';
        var avatarColor = user.avatarColor || 'linear-gradient(135deg, #5582FF, #4568dc)';
        var avatarHtml = user.avatarUrl
            ? '<span class="header__user-avatar header__user-avatar--img" style="background-image:url(' + JSON.stringify(user.avatarUrl) + ')"></span>'
            : '<span class="header__user-avatar" style="background:' + avatarColor + '">' + initials + '</span>';
        area.innerHTML = '<a href="kiber-profile/kiber-profile.html" class="header__user-block">' +
            '<span class="header__user-name">' + displayName + '</span>' +
            avatarHtml +
            '</a>' +
            '<button type="button" class="header__logout" id="header-logout">Выйти</button>';
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

document.getElementById('nav-main').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.remove('main--hidden');
    leaderboardContent.classList.add('leaderboard--hidden');
    tournamentsContent.classList.add('tournaments--hidden');
    bookingContent.classList.add('booking--hidden');
});

document.getElementById('nav-booking').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.add('main--hidden');
    leaderboardContent.classList.add('leaderboard--hidden');
    tournamentsContent.classList.add('tournaments--hidden');
    bookingContent.classList.remove('booking--hidden');
    renderBooking();
});

document.getElementById('nav-tournaments').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.add('main--hidden');
    leaderboardContent.classList.add('leaderboard--hidden');
    bookingContent.classList.add('booking--hidden');
    tournamentsContent.classList.remove('tournaments--hidden');
    renderTournaments();
});
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

document.getElementById('nav-leaderboard').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.add('main--hidden');
    tournamentsContent.classList.add('tournaments--hidden');
    bookingContent.classList.add('booking--hidden');
    leaderboardContent.classList.remove('leaderboard--hidden');
    renderLeaderboard();
});

function renderTournaments() {
    var events = getEvents();
    var filtered = tournamentsFilterCategory
        ? events.filter(function(ev) { return (ev.category || '') === tournamentsFilterCategory; })
        : events;
    if (!tournamentsGrid) return;
    tournamentsGrid.innerHTML = filtered.map(function(ev) {
        var imgStyle = ev.image ? 'background-image: url(\'' + ev.image.replace(/'/g, "\\'") + '\')' : '';
        return '<article class="event-card" data-id="' + ev.id + '">' +
            '<h3 class="event-card__title">' + (ev.name || 'Мероприятие') + '</h3>' +
            '<div class="event-card__image" style="' + imgStyle + '"></div>' +
            '<div class="event-card__footer">' +
            '<a href="#" class="event-card__btn event-card__btn--left">Записаться</a>' +
            '<a href="#" class="event-card__btn event-card__btn--right">Подробнее</a>' +
            '</div></article>';
    }).join('');
}

function renderBooking() {
    if (!bookingGrid) return;
    var bookings = getBookings();
    var html = '';
    for (var row = 0; row < 4; row++) {
        for (var col = 0; col < 9; col++) {
            var seatId = row * 9 + col + 1;
            var booking = bookings[seatId];
            var isBooked = !!booking;
            var cls = 'booking__seat' + (isBooked ? ' booking__seat--booked' : '');
            var status = isBooked ? '<div class="booking__seat-content"><span class="booking__status">Уже забронировано</span><span class="booking__time">' + (booking.time || '') + '</span><button type="button" class="booking__btn booking__btn--cancel" data-cancel-seat="' + seatId + '">Отменить бронь</button></div>' : '<button type="button" class="booking__btn" data-seat="' + seatId + '">Забронировать</button>';
            html += '<div class="' + cls + '" data-seat="' + seatId + '">' +
                '<span class="booking__seat-num">' + seatId + '</span>' + status + '</div>';
        }
    }
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
}

var bookingModalSeat = null;
function openBookingModal(seatId) {
    bookingModalSeat = seatId;
    document.getElementById('booking-modal-seat').textContent = seatId;
    document.getElementById('booking-time').value = '';
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
    var time = document.getElementById('booking-time').value.trim();
    if (!time || !bookingModalSeat) return;
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
    document.getElementById('booking-pc-info').innerHTML = '<p class="booking__pc-placeholder">Выберите место, чтобы увидеть характеристики</p>';
}

function renderLeaderboard() {
    var items = getLeaderboard();
    var tbody = document.querySelector('#leaderboard-content .leaderboard__table tbody');
    if (!tbody) return;
    tbody.innerHTML = items.map(function(item, i) {
        var place = i + 1;
        var medal = place <= 3 ? '<span class="leaderboard__medal leaderboard__medal--' + 
            (place === 1 ? 'gold' : place === 2 ? 'silver' : 'bronze') + '">' + place + '</span>' : place;
        return '<tr class="leaderboard__row">' +
            '<td class="leaderboard__place">' + medal + '</td>' +
            '<td class="leaderboard__student"><span class="leaderboard__avatar" style="background: ' + (item.avatarColor || '#404040') + '">' + (item.initials || '?') + '</span><span>' + (item.name || '') + '</span></td>' +
            '<td>' + (item.group || '') + '</td>' +
            '<td class="leaderboard__coins">' + (item.coins || 0) + '</td></tr>';
    }).join('');
}
    leaderboardContent.classList.remove('leaderboard--hidden');
});
