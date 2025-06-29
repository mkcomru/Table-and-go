document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Получаем данные формы
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Проверяем заполнение полей
            if (!username || !password) {
                showError('Пожалуйста, заполните все поля');
                return;
            }
            
            // Отправляем запрос на авторизацию
            login(username, password);
        });
    }
    
    // Проверяем, авторизован ли пользователь
    checkAuth();
});

// Функция для авторизации
function login(username, password) {
    const apiUrl = 'http://127.0.0.1:8000/auth/login/';
    
    // Показываем индикатор загрузки
    showLoading(true);
    
    // Определяем, что ввел пользователь: email или имя пользователя
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
    
    // Формируем данные для отправки в зависимости от типа ввода
    let loginData;
    if (isEmail) {
        loginData = {
            email: username,
            password: password
        };
    } else {
        loginData = {
            username: username,
            password: password
        };
    }
    
    // Отладочная информация
    console.log('Отправляемые данные:', loginData);
    
    // Отправляем запрос
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    })
    .then(response => {
        // Скрываем индикатор загрузки
        showLoading(false);
        
        // Отладочная информация
        console.log('Статус ответа:', response.status);
        
        if (!response.ok) {
            // Если ответ не 2xx, обрабатываем ошибку
            return response.json().then(data => {
                console.log('Ошибка от сервера:', data);
                throw new Error(data.detail || 'Ошибка авторизации');
            }).catch(err => {
                if (err instanceof SyntaxError) {
                    // Если ответ не в формате JSON
                    throw new Error('Ошибка авторизации: неверные учетные данные');
                }
                throw err;
            });
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Успешная авторизация:', data);
        
        // Сохраняем токен в localStorage
        if (data.access) {
            localStorage.setItem('authToken', data.access);
        } else if (data.token) {
            // Альтернативное имя поля для токена
            localStorage.setItem('authToken', data.token);
        }
        
        // Сохраняем информацию о пользователе
        let userData = {};
        
        // Проверяем, откуда получить информацию о пользователе
        if (data.user) {
            // Если информация о пользователе в поле user
            userData = data.user;
        } else {
            // Пробуем извлечь информацию из токена JWT
            try {
                const token = data.access || data.token;
                if (token) {
                    const tokenParts = token.split('.');
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        // Копируем нужные поля из payload токена
                        if (payload.first_name) userData.first_name = payload.first_name;
                        if (payload.last_name) userData.last_name = payload.last_name;
                        if (payload.email) userData.email = payload.email;
                        if (payload.username) userData.username = payload.username;
                        if (payload.phone) userData.phone = payload.phone;
                    }
                }
            } catch (e) {
                console.error('Ошибка при декодировании токена:', e);
            }
        }
        
        // Сохраняем данные пользователя
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Перенаправляем на главную страницу
        window.location.href = 'index.html';
    })
    .catch(error => {
        console.error('Ошибка:', error);
        
        // Показываем сообщение об ошибке
        let errorMessage = 'Произошла ошибка при авторизации';
        
        if (error.message) {
            if (error.message.includes('credentials') || 
                error.message.includes('username') || 
                error.message.includes('password')) {
                errorMessage = 'Неверное имя пользователя или пароль';
            } else if (error.message.includes('locked')) {
                errorMessage = 'Аккаунт временно заблокирован из-за слишком большого количества попыток входа';
            } else {
                errorMessage = error.message;
            }
        }
        
        showError(errorMessage);
    });
}

// Функция для проверки авторизации
function checkAuth() {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        // Сначала проверяем локально
        try {
            // Проверяем формат токена JWT
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                // Если токен не в формате JWT, удаляем его
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                updateAuthUI(false);
                return;
            }
            
            // Декодируем payload токена
            const payload = JSON.parse(atob(tokenParts[1]));
            
            // Проверяем срок действия токена
            const expTime = payload.exp * 1000; // exp в секундах, преобразуем в миллисекунды
            
            if (expTime < Date.now()) {
                // Если токен истек, удаляем его
                console.log('Токен истек');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                updateAuthUI(false);
                return;
            }
            
            // Если локальная проверка прошла успешно, проверяем на сервере
            fetch('http://127.0.0.1:8000/auth/verify/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: token })
            })
            .then(response => {
                if (response.ok) {
                    // Если токен валидный, обновляем UI
                    updateAuthUI(true);
                } else {
                    // Если токен невалидный, удаляем его
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    updateAuthUI(false);
                }
            })
            .catch(error => {
                console.error('Ошибка при проверке токена на сервере:', error);
                // В случае ошибки сети считаем токен действительным, так как локальная проверка прошла успешно
                updateAuthUI(true);
            });
        } catch (error) {
            console.error('Ошибка при проверке токена:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            updateAuthUI(false);
        }
    } else {
        updateAuthUI(false);
    }
}

// Функция для обновления UI в зависимости от статуса авторизации
function updateAuthUI(isLoggedIn) {
    const loginBtn = document.querySelector('.header-right .btn-outline');
    const registerBtn = document.querySelector('.header-right .btn-primary');
    const headerRight = document.querySelector('.header-right');
    
    if (isLoggedIn && headerRight) {
        // Получаем информацию о пользователе
        const userJson = localStorage.getItem('user');
        let displayName = 'Пользователь';
        let firstLetter = 'П';
        
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                // Проверяем наличие имени и фамилии
                if (user.first_name && user.last_name) {
                    displayName = `${user.first_name} ${user.last_name}`;
                    firstLetter = user.first_name.charAt(0).toUpperCase();
                } else if (user.first_name) {
                    displayName = user.first_name;
                    firstLetter = user.first_name.charAt(0).toUpperCase();
                } else if (user.username) {
                    displayName = user.username;
                    firstLetter = user.username.charAt(0).toUpperCase();
                } else if (user.email) {
                    displayName = user.email;
                    firstLetter = user.email.charAt(0).toUpperCase();
                }
            } catch (e) {
                console.error('Ошибка при парсинге данных пользователя:', e);
            }
        }
        
        // Если пользователь авторизован, показываем профиль и кнопку выхода
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        
        // Проверяем, существует ли уже профиль пользователя
        const existingProfile = document.querySelector('.user-profile');
        if (existingProfile) {
            existingProfile.remove();
        }
        
        // Создаем элементы для профиля и кнопки выхода
        const userProfile = document.createElement('div');
        userProfile.className = 'user-profile';
        userProfile.innerHTML = `
            <div class="user-avatar">
                <div class="default-avatar">${firstLetter}</div>
            </div>
            <div class="user-info">
                <span class="user-name">${displayName}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
        `;
        
        const userDropdown = document.createElement('div');
        userDropdown.className = 'user-dropdown';
        userDropdown.innerHTML = `
            <ul>
                <li><a href="profile.html"><i class="fas fa-user"></i> Профиль</a></li>
                <li><a href="my-bookings.html"><i class="fas fa-calendar-check"></i> Мои брони</a></li>
                <li><a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Выйти</a></li>
            </ul>
        `;
        
        userProfile.appendChild(userDropdown);
        headerRight.appendChild(userProfile);
        
        // Добавляем обработчик для показа/скрытия выпадающего меню
        userProfile.addEventListener('click', function() {
            userProfile.classList.toggle('active');
        });
        
        // Добавляем обработчик для кнопки выхода
        document.getElementById('logout-btn').addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
        
        // Закрываем выпадающее меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                userProfile.classList.remove('active');
            }
        });
    } else {
        // Если пользователь не авторизован, показываем кнопки входа и регистрации
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        
        // Удаляем профиль пользователя, если он существует
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.remove();
        }
    }
}

// Функция для выхода из аккаунта
function logout() {
    // Удаляем токен и информацию о пользователе
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Перезагружаем страницу
    window.location.reload();
}

// Функция для отображения ошибки
function showError(message) {
    const errorElement = document.querySelector('.error-message');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Скрываем сообщение через 5 секунд
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// Функция для отображения/скрытия индикатора загрузки
function showLoading(isLoading) {
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    
    if (submitBtn) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Войти';
        }
    }
} 