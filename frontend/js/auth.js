// Базовый URL API
const API_URL = 'http://127.0.0.1:8000';

// Функция для очистки номера телефона (удаляем все кроме цифр и берем последние 10 символов)
function cleanPhoneNumber(phone) {
    // Удаляем все нецифровые символы
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Берем только последние 10 цифр (формат для России без кода страны)
    return digitsOnly.slice(-10);
}

// Функция для выполнения HTTP-запросов с обработкой ошибок
async function fetchWithErrorHandling(url, options) {
    try {
        // Отправляем основной запрос
        const response = await fetch(url, {
            ...options,
            // Добавляем заголовки для CORS
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin,
                ...options.headers
            }
        });
        
        // Пытаемся распарсить ответ как JSON
        let data;
        try {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            console.error('Ошибка при парсинге JSON:', e);
            throw new Error('Ошибка при обработке ответа сервера');
        }

        if (!response.ok) {
            // Если сервер вернул ошибку, формируем сообщение
            const errorMessages = [];
            if (typeof data === 'object' && data !== null) {
                for (const key in data) {
                    if (Array.isArray(data[key])) {
                        errorMessages.push(`${key}: ${data[key].join(' ')}`);
                    } else {
                        errorMessages.push(`${key}: ${data[key]}`);
                    }
                }
            } else {
                errorMessages.push(String(data) || 'Неизвестная ошибка');
            }
            throw new Error(errorMessages.join('\n'));
        }

        return data;
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        throw error;
    }
}

// Функция для регистрации нового пользователя
async function registerUser(userData) {
    try {
        // Очищаем номер телефона (убираем все кроме 10 цифр)
        const cleanedPhone = cleanPhoneNumber(userData.phone);
        
        // Создаем копию объекта с очищенным телефоном
        const processedData = {
            ...userData,
            phone: cleanedPhone
        };
        
        const data = await fetchWithErrorHandling(`${API_URL}/auth/register/`, {
            method: 'POST',
            body: JSON.stringify(processedData),
        });

        // Сохраняем токены в localStorage
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Обновляем UI после успешной регистрации
        updateAuthUI();
        
        return data;
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        throw error;
    }
}

// Функция для входа пользователя
async function loginUser(credentials) {
    try {
        // Если есть поле phone, очищаем его
        if (credentials.phone) {
            credentials.phone = cleanPhoneNumber(credentials.phone);
        }
        
        const data = await fetchWithErrorHandling(`${API_URL}/auth/login/`, {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        // Сохраняем токены в localStorage
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);

        try {
            // Получаем информацию о пользователе
            const userInfo = await getUserProfile();
            localStorage.setItem('user', JSON.stringify(userInfo));
        } catch (profileError) {
            console.error('Не удалось получить профиль пользователя:', profileError);
            // Если не удалось получить профиль, используем данные из токена
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
        }

        // Обновляем UI после успешного входа
        updateAuthUI();
        
        return data;
    } catch (error) {
        console.error('Ошибка при входе:', error);
        throw error;
    }
}

// Функция для получения профиля пользователя
async function getUserProfile() {
    try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            throw new Error('Токен доступа не найден');
        }

        return await fetchWithErrorHandling(`${API_URL}/auth/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
    } catch (error) {
        console.error('Ошибка при получении профиля:', error);
        throw error;
    }
}

// Функция для выхода пользователя
function logoutUser() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Обновляем UI после выхода
    updateAuthUI();
}

// Функция для проверки, авторизован ли пользователь
function isAuthenticated() {
    return localStorage.getItem('accessToken') !== null;
}

// Функция для получения данных текущего пользователя
function getCurrentUser() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
}

// Функция для обновления токена
async function refreshToken() {
    try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('Refresh токен не найден');
        }

        const data = await fetchWithErrorHandling(`${API_URL}/auth/token/refresh`, {
            method: 'POST',
            body: JSON.stringify({ refresh: refreshToken }),
        });
        
        localStorage.setItem('accessToken', data.access);
        return data.access;
    } catch (error) {
        console.error('Ошибка при обновлении токена:', error);
        // Если не удалось обновить токен, выходим из системы
        logoutUser();
        throw error;
    }
}

// Функция для обновления интерфейса после авторизации
function updateAuthUI() {
    const isLoggedIn = isAuthenticated();
    const headerRight = document.querySelector('.header-right');
    
    if (!headerRight) return;
    
    if (isLoggedIn) {
        const user = getCurrentUser();
        if (!user) return;
        
        headerRight.innerHTML = `
            <div class="user-menu">
                <button class="user-menu-btn">
                    <i class="fas fa-user-circle"></i>
                    <span>${user.first_name} ${user.last_name}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="user-dropdown">
                    <a href="profile.html">Мой профиль</a>
                    <a href="bookings.html">Мои брони</a>
                    <a href="#" id="logout-btn">Выйти</a>
                </div>
            </div>
        `;
        
        // Добавляем обработчик для кнопки выхода
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        }
        
        // Добавляем обработчик для меню пользователя
        const userMenuBtn = document.querySelector('.user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', function() {
                const dropdown = document.querySelector('.user-dropdown');
                dropdown.classList.toggle('active');
            });
            
            // Закрываем меню при клике вне его
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.user-menu')) {
                    const dropdown = document.querySelector('.user-dropdown');
                    if (dropdown) dropdown.classList.remove('active');
                }
            });
        }
    } else {
        headerRight.innerHTML = `
            <a href="login.html" class="btn btn-outline">Войти</a>
            <a href="register.html" class="btn btn-primary">Регистрация</a>
        `;
    }
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Обновляем UI в соответствии с состоянием авторизации
    updateAuthUI();
}); 