document.addEventListener('DOMContentLoaded', function() {
    // Функция для показа уведомления об успехе
    function showSuccessNotification(message) {
        const container = document.getElementById('notification-container');
        
        // Удаляем предыдущее уведомление, если есть
        const oldNotification = container.querySelector('.notification-success');
        if (oldNotification) {
            oldNotification.remove();
        }
        
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = 'notification-success';
        notification.innerHTML = `
            <span class="notification-success__icon">✅</span>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Автоматически удаляем через 2 секунды
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }
    
    // Проверяем, есть ли флаг успешной регистрации
    const registrationSuccess = localStorage.getItem('registration_success');
    if (registrationSuccess === 'true') {
        // Показываем уведомление через 2 секунды после загрузки страницы
        setTimeout(() => {
            showSuccessNotification('Вы успешно зарегистрировались!');
        }, 2000);
        
        // Удаляем флаг из localStorage
        localStorage.removeItem('registration_success');
    }
    
    // Обработка формы входа (если нужна)
    const form = document.getElementById('signin-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Функция входа будет добавлена позже');
        });
    }
});