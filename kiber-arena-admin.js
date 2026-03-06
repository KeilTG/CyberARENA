// ==================== ФУНКЦИИ ДЛЯ РАБОТЫ С ТУРНИРАМИ ====================

async function loadTournamentsFromDB() {
    const tournamentsList = document.getElementById('tournaments-admin-list');
    if (!tournamentsList) return;
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/tournaments`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const tournaments = await response.json();
        
        if (tournaments.length === 0) {
            tournamentsList.innerHTML = '<p class="admin-section__sub">Нет турниров</p>';
            return;
        }
        
        tournamentsList.innerHTML = tournaments.map(t => `
            <div class="admin-item">
                <div class="admin-item__info">
                    <p class="admin-item__title">${t.name}</p>
                    <p class="admin-item__sub">${t.category} · ${t.format} · ${t.date} ${t.time}</p>
                </div>
                <div class="admin-item__actions">
                    <button class="admin-btn admin-btn--small" data-edit-tournament='${JSON.stringify(t).replace(/'/g, "&apos;")}'>Изменить</button>
                    <button class="admin-btn admin-btn--small admin-btn--danger" data-delete-tournament="${t.id}">Удалить</button>
                </div>
            </div>
        `).join('');
        
        // Добавляем обработчики
        tournamentsList.querySelectorAll('[data-edit-tournament]').forEach(btn => {
            btn.addEventListener('click', function() {
                const t = JSON.parse(this.dataset.editTournament.replace(/&apos;/g, "'"));
                openTournamentModal(t);
            });
        });
        
        tournamentsList.querySelectorAll('[data-delete-tournament]').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteTournamentFromDB(this.dataset.deleteTournament);
            });
        });
        
    } catch (error) {
        console.error('Ошибка загрузки турниров:', error);
        tournamentsList.innerHTML = '<p class="admin-section__sub" style="color:#ff4444;">Ошибка загрузки</p>';
    }
}

async function saveTournamentToDB(tournament) {
    try {
        const baseUrl = window.location.origin;
        const method = tournament.id ? 'PUT' : 'POST';
        const url = tournament.id ? 
            `${baseUrl}/api/tournaments/${tournament.id}` : 
            `${baseUrl}/api/tournaments`;
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tournament)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Турнир сохранён');
            loadTournamentsFromDB();
            closeModal();
        } else {
            showToast('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast('Ошибка подключения к серверу');
    }
}

async function deleteTournamentFromDB(id) {
    if (!confirm('Удалить турнир?')) return;
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/tournaments/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Турнир удалён');
            loadTournamentsFromDB();
        } else {
            showToast('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        console.error('Ошибка:', error);
        showToast('Ошибка подключения к серверу');
    }
}

// Обновляем функцию openEventModal для работы с турнирами
function openTournamentModal(tournament = null) {
    currentMode = 'tournament';
    currentEditId = tournament ? tournament.id : null;
    modalTitle.textContent = tournament ? 'Редактировать турнир' : 'Добавить турнир';
    
    modalFields.innerHTML = `
        <div class="form-group">
            <label>Название</label>
            <input type="text" id="tournament-name" value="${tournament ? tournament.name : ''}" required>
        </div>
        <div class="form-group">
            <label>Категория</label>
            <select id="tournament-category">
                <option value="CS2" ${tournament && tournament.category === 'CS2' ? 'selected' : ''}>CS2</option>
                <option value="Valorant" ${tournament && tournament.category === 'Valorant' ? 'selected' : ''}>Valorant</option>
                <option value="Clash Royale" ${tournament && tournament.category === 'Clash Royale' ? 'selected' : ''}>Clash Royale</option>
                <option value="Brawl Stars" ${tournament && tournament.category === 'Brawl Stars' ? 'selected' : ''}>Brawl Stars</option>
                <option value="Fortnite" ${tournament && tournament.category === 'Fortnite' ? 'selected' : ''}>Fortnite</option>
            </select>
        </div>
        <div class="form-group">
            <label>Формат</label>
            <select id="tournament-format">
                <option value="1v1" ${tournament && tournament.format === '1v1' ? 'selected' : ''}>1v1</option>
                <option value="3v3" ${tournament && tournament.format === '3v3' ? 'selected' : ''}>3v3</option>
                <option value="5v5" ${tournament && tournament.format === '5v5' ? 'selected' : ''}>5v5</option>
            </select>
        </div>
        <div class="form-group">
            <label>Дата</label>
            <input type="date" id="tournament-date" value="${tournament ? tournament.date : ''}" required>
        </div>
        <div class="form-group">
            <label>Время</label>
            <input type="time" id="tournament-time" value="${tournament ? tournament.time : ''}" required>
        </div>
        <div class="form-group">
            <label>Макс. участников</label>
            <input type="number" id="tournament-max" value="${tournament ? tournament.maxParticipants : 16}" min="2">
        </div>
        <div class="form-group">
            <label>Описание</label>
            <textarea id="tournament-desc" rows="3">${tournament ? tournament.description : ''}</textarea>
        </div>
        <div class="form-group">
            <label>URL изображения</label>
            <input type="url" id="tournament-image" value="${tournament ? tournament.image || '' : ''}" placeholder="https://...">
        </div>
    `;
    
    modal.classList.remove('modal--hidden');
    
    // Изменяем обработчик формы
    const form = document.getElementById('modal-form');
    const oldSubmit = form.onsubmit;
    form.onsubmit = function(e) {
        e.preventDefault();
        
        const tournamentData = {
            id: currentEditId,
            name: document.getElementById('tournament-name').value,
            category: document.getElementById('tournament-category').value,
            format: document.getElementById('tournament-format').value,
            date: document.getElementById('tournament-date').value,
            time: document.getElementById('tournament-time').value,
            maxParticipants: parseInt(document.getElementById('tournament-max').value),
            description: document.getElementById('tournament-desc').value,
            image: document.getElementById('tournament-image').value
        };
        
        saveTournamentToDB(tournamentData);
    };
}

// Обновляем кнопку добавления турнира
document.getElementById('add-event-btn').addEventListener('click', function() {
    openTournamentModal();
});
