/* Основная логика сайта */

var mainContent = document.getElementById('main-content');
var leaderboardContent = document.getElementById('leaderboard-content');
var tournamentsContent = document.getElementById('tournaments-content');
var welcomeContent = document.getElementById('welcome-content');
var tournamentsGrid = document.getElementById('tournaments-grid');

initStorage();
renderTournaments();
renderLeaderboard();
if (localStorage.getItem('isDeveloper') === 'true') {
    var adminLink = document.getElementById('admin-link');
    if (adminLink) adminLink.classList.remove('footer__link--hidden');
}

function hideWelcome() {
    welcomeContent.classList.add('welcome-card--hidden');
}

document.getElementById('nav-main').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.remove('main--hidden');
    leaderboardContent.classList.add('leaderboard--hidden');
    tournamentsContent.classList.add('tournaments--hidden');
});

document.getElementById('nav-tournaments').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.add('main--hidden');
    leaderboardContent.classList.add('leaderboard--hidden');
    tournamentsContent.classList.remove('tournaments--hidden');
    renderTournaments();
});

document.getElementById('nav-leaderboard').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.add('main--hidden');
    tournamentsContent.classList.add('tournaments--hidden');
    leaderboardContent.classList.remove('leaderboard--hidden');
    renderLeaderboard();
});

function renderTournaments() {
    var events = getEvents();
    if (!tournamentsGrid) return;
    tournamentsGrid.innerHTML = events.map(function(ev) {
        var imgStyle = ev.image ? 'background-image: url(\'' + ev.image.replace(/'/g, "\\'") + '\')' : '';
        return '<article class="event-card" data-id="' + ev.id + '">' +
            '<h3 class="event-card__title">' + (ev.name || 'Мероприятие') + '</h3>' +
            '<div class="event-card__image" style="' + imgStyle + '"></div>' +
            '<div class="event-card__footer">' +
            '<a href="#" class="event-card__btn event-card__btn--left">Подробнее</a>' +
            '<a href="#" class="event-card__btn event-card__btn--right">Подробнее</a>' +
            '</div></article>';
    }).join('');
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
