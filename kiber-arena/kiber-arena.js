var mainContent = document.getElementById('main-content');
var leaderboardContent = document.getElementById('leaderboard-content');
var welcomeContent = document.getElementById('welcome-content');

function hideWelcome() {
    welcomeContent.classList.add('welcome-card--hidden');
}

document.getElementById('nav-main').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.remove('main--hidden');
    leaderboardContent.classList.add('leaderboard--hidden');
});

document.getElementById('nav-leaderboard').addEventListener('click', function(e) {
    e.preventDefault();
    hideWelcome();
    mainContent.classList.add('main--hidden');
    leaderboardContent.classList.remove('leaderboard--hidden');
});
