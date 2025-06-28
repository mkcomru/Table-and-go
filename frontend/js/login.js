document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    
    // Проверяем, авторизован ли пользователь
    checkAuthStatus();
    
    // Получаем параметр redirect из URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    
    // Если есть параметр redirect, сохраняем его в скрытом поле
    if (redirectUrl) {
        const redirectInput = document.getElementById('redirect-url');
        if (redirectInput) {
            redirectInput.value = redirectUrl;
        }
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Проверка на заполненность полей
            if (!username || !password) {
                showError('login-error', 'Пожалуйста, заполните все поля');
                return;
            }
            
            // Определяем, что ввел пользователь: email или телефон
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
            
            // Подготавливаем данные для отправки
            let loginData = {
                password: password
            };
            
            if (isEmail) {
                // Если введен email
                loginData.email = username;
            } else {
                // Если введен телефон, очищаем его от нецифровых символов
                loginData.phone = username.replace(/\D/g, '');
            }
            
            console.log('Отправляемые данные:', loginData);
            
            // Отправка запроса на сервер
            fetch('http://127.0.0.1:8000/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    return response.json().then(data => {
                        throw new Error(data.detail || 'Неверный логин или пароль');
                    }).catch(err => {
                        throw new Error('Неверный логин или пароль');
                    });
                }
            })
            .then(data => {
                // Сохраняем токены в localStorage
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                
                // Сохраняем данные пользователя
                if (data.user) {
                    localStorage.setItem('user_data', JSON.stringify(data.user));
                } else {
                    // Если данных пользователя нет в ответе, извлекаем из токена
                    const tokenData = parseJwt(data.access);
                    const userData = {
                        first_name: tokenData.first_name,
                        last_name: tokenData.last_name,
                        email: tokenData.email
                    };
                    localStorage.setItem('user_data', JSON.stringify(userData));
                }
                
                // Проверяем, есть ли URL для перенаправления
                const redirectInput = document.getElementById('redirect-url');
                const redirectUrl = redirectInput && redirectInput.value ? redirectInput.value : 'index.html';
                
                // Перенаправляем на указанную страницу или на главную
                window.location.href = redirectUrl;
            })
            .catch(error => {
                console.error('Ошибка входа:', error);
                showError('login-error', error.message || 'Ошибка при входе в систему');
            });
        });
    }
});

// Функция для проверки статуса авторизации
function checkAuthStatus() {
    const accessToken = localStorage.getItem('access_token');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    // Если есть токен доступа, считаем пользователя авторизованным
    if (accessToken) {
        console.log('Пользователь авторизован:', userData);
        
        // Обновляем интерфейс для авторизованного пользователя
        updateAuthUI(userData);
    }
}

// Функция для обновления интерфейса авторизованного пользователя
function updateAuthUI(userData) {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;
    
    // Очищаем текущие элементы
    headerRight.innerHTML = '';
    
    // Создаем элемент с информацией о пользователе
    const userProfileElement = document.createElement('div');
    userProfileElement.className = 'user-profile';
    
    // Добавляем аватар и имя пользователя
    userProfileElement.innerHTML = `
        <div class="user-avatar">
            <img src="${userData.photo || 'assets/default-avatar.png'}" alt="Аватар" onerror="this.src='assets/default-avatar.png'">
        </div>
        <div class="user-info">
            <span class="user-name">${userData.first_name || ''} ${userData.last_name || ''}</span>
            <i class="fas fa-chevron-down"></i>
        </div>
        <div class="user-dropdown">
            <ul>
                <li><a href="#"><i class="fas fa-user"></i> Профиль</a></li>
                <li><a href="#"><i class="fas fa-calendar-alt"></i> Мои брони</a></li>
                <li><a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Выйти</a></li>
            </ul>
        </div>
    `;
    
    // Добавляем элемент в header
    headerRight.appendChild(userProfileElement);
    
    // Добавляем обработчик для выпадающего меню
    userProfileElement.addEventListener('click', function() {
        this.classList.toggle('active');
    });
    
    // Добавляем обработчик для кнопки выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            logout();
        });
    }
}

// Функция для выхода из аккаунта
function logout() {
    // Удаляем данные авторизации
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    
    // Перезагружаем страницу
    window.location.reload();
}

// Функция для отображения сообщения об ошибке
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('active');
        
        // Автоматически скрыть сообщение через 5 секунд
        setTimeout(() => {
            errorElement.classList.remove('active');
        }, 5000);
    }
}

// Функция для декодирования JWT токена
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Ошибка при декодировании токена:', e);
        return {};
    }
} 