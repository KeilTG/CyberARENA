document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signup-form');
    
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
        
        // Автоматически удаляем через 3 секунды
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                fio: document.getElementById('fio').value,
                group: document.getElementById('group').value,
                role: document.getElementById('role').value
            };
            
            try {
                const response = await fetch('http://localhost:8000/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Только одно простое уведомление об успехе
                    showSuccessNotification('Вы успешно зарегистрировались!');
                    
                    // Очищаем форму
                    form.reset();
                    
                    // Перенаправляем через 2 секунды
                    setTimeout(() => {
                        window.location.href = 'forma-signin.html';
                    }, 2000);
                    
                } else {
                    alert('Ошибка: ' + data.detail);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ошибка подключения к серверу');
            }
        });
    }
});