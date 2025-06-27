// URL API
const API_URL = 'http://localhost:8000/api';

// Проверка авторизации
function isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    return token !== null;
}

// Получение токена
function getAccessToken() {
    return localStorage.getItem('accessToken');
}

// Получение данных пользователя
function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Выход из системы
function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// Обновление токена
async function refreshToken() {
    const refresh = localStorage.getItem('refreshToken');
    
    if (!refresh) {
        logout();
        return null;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/token/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.access);
            return data.access;
        } else {
            // Если не удалось обновить токен, выходим из системы
            logout();
            return null;
        }
    } catch (error) {
        console.error('Ошибка при обновлении токена:', error);
        logout();
        return null;
    }
}

// Выполнение authenticated запроса
async function fetchWithAuth(url, options = {}) {
    let token = getAccessToken();
    
    if (!token) {
        return Promise.reject('Нет токена авторизации');
    }
    
    // Добавляем токен в заголовок
    const authOptions = {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    };
    
    try {
        let response = await fetch(url, authOptions);
        
        // Если токен просрочен (401), пробуем обновить и повторить запрос
        if (response.status === 401) {
            token = await refreshToken();
            
            if (token) {
                // Обновляем заголовок с новым токеном
                authOptions.headers['Authorization'] = `Bearer ${token}`;
                return fetch(url, authOptions);
            } else {
                return Promise.reject('Не удалось обновить токен');
            }
        }
        
        return response;
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        return Promise.reject(error);
    }
}

// Получение профиля пользователя
async function fetchUserProfile() {
    try {
        const response = await fetchWithAuth(`${API_URL}/auth/profile`);
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('userData', JSON.stringify(data));
            return data;
        } else {
            return Promise.reject('Не удалось получить данные профиля');
        }
    } catch (error) {
        console.error('Ошибка при получении профиля:', error);
        return Promise.reject(error);
    }
}

// Обновление профиля пользователя
async function updateUserProfile(profileData) {
    try {
        const response = await fetchWithAuth(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('userData', JSON.stringify(data));
            return data;
        } else {
            return Promise.reject('Не удалось обновить данные профиля');
        }
    } catch (error) {
        console.error('Ошибка при обновлении профиля:', error);
        return Promise.reject(error);
    }
}

// Проверяем авторизацию при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Список страниц, которые доступны только авторизованным пользователям
    const authPages = [
        // здесь перечислить страницы, требующие авторизации
    ];
    
    // Список страниц, которые доступны только неавторизованным пользователям
    const nonAuthPages = [
        'login.html',
        'register.html',
        'reset-password.html'
    ];
    
    const currentPath = window.location.pathname;
    const currentPage = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    
    if (isAuthenticated()) {
        // Пользователь авторизован
        if (nonAuthPages.includes(currentPage)) {
            // Редирект на главную, если пользователь пытается зайти на страницу для неавторизованных
            window.location.href = 'index.html';
        }
        
        // Добавляем обработчик для выхода из системы
        const logoutLinks = document.querySelectorAll('.logout-link');
        logoutLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        });
        
        // Загружаем имя пользователя, если элемент существует
        const userNameElements = document.querySelectorAll('.user-name');
        if (userNameElements.length > 0) {
            const userData = getUserData();
            if (userData) {
                const fullName = `${userData.first_name} ${userData.last_name}`;
                userNameElements.forEach(element => {
                    element.textContent = fullName;
                });
            } else {
                // Если нет данных пользователя, получаем их с сервера
                fetchUserProfile().catch(error => {
                    console.error('Не удалось загрузить данные профиля:', error);
                });
            }
        }
    } else {
        // Пользователь не авторизован
        if (authPages.includes(currentPage)) {
            // Редирект на страницу входа, если пользователь пытается зайти на страницу для авторизованных
            window.location.href = 'login.html';
        }
    }
}); 