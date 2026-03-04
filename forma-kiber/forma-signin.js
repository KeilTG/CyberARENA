document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('signin-form');
            
            // Функция показа уведомления
            function showNotification(message, type = 'success') {
                const container = document.getElementById('notification-container');
                
                // Создаем уведомление
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                
                // Выбираем иконку
                const icon = type === 'success' ? '✅' : '❌';
                
                notification.innerHTML = `
                    <span class="notification__icon">${icon}</span>
                    <span>${message}</span>
                `;
                
                container.appendChild(notification);
                
                // Удаляем через 3 секунды
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
                    
                    const email = document.getElementById('email').value;
                    const password = document.getElementById('password').value;
                    
                    try {
                        const response = await fetch('http://localhost:8000/api/login', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ email, password })
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            showNotification('Успешный вход! Добро пожаловать!', 'success');
                            
                            // Сохраняем данные пользователя в localStorage
                            localStorage.setItem('current_user', JSON.stringify(data.user));
                            
                            // Перенаправляем через 1.5 секунды
                            setTimeout(() => {
                                window.location.href = '../kiber-arena.html';
                            }, 1500);
                        } else {
                            const error = await response.json();
                            showNotification(error.detail || 'Неверная почта или пароль', 'error');
                        }
                    } catch (error) {
                        console.error('Ошибка:', error);
                        showNotification('Ошибка подключения к серверу', 'error');
                    }
                });
            }
        });