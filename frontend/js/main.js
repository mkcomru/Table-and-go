// Функция для получения данных пользователя из localStorage
function getUserData() {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    
    try {
        return JSON.parse(userJson);
    } catch (e) {
        console.error('Ошибка при парсинге данных пользователя:', e);
        return null;
    }
}

// Функция для проверки авторизации пользователя
function isAuthenticated() {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
        // Проверяем формат токена JWT
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) return false;
        
        // Декодируем payload токена
        const payload = JSON.parse(atob(tokenParts[1]));
        
        // Проверяем срок действия токена
        const expTime = payload.exp * 1000; // exp в секундах, преобразуем в миллисекунды
        
        if (expTime < Date.now()) {
            // Если токен истек, удаляем его
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            return false;
        }
        
        return true;
    } catch (e) {
        console.error('Ошибка при проверке токена:', e);
        return false;
    }
}

// Функция для обновления UI в зависимости от состояния авторизации
function updateUIForAuthState() {
    const isUserAuthenticated = isAuthenticated();
    const guestNav = document.querySelector('.guest-nav');
    const userNav = document.querySelector('.user-nav');
    const authOnlyElements = document.querySelectorAll('.auth-only');
    
    if (isUserAuthenticated) {
        // Скрываем элементы для гостей и показываем элементы для пользователей
        if (guestNav) guestNav.style.display = 'none';
        if (userNav) userNav.style.display = 'flex';
        
        // Обновляем имя пользователя
        const userData = getUserData();
        const userNameElements = document.querySelectorAll('.user-name');
        if (userData && userNameElements.length > 0) {
            let displayName = 'Пользователь';
            
            // Формируем отображаемое имя
            if (userData.first_name && userData.last_name) {
                displayName = `${userData.first_name} ${userData.last_name}`;
            } else if (userData.first_name) {
                displayName = userData.first_name;
            } else if (userData.username) {
                displayName = userData.username;
            } else if (userData.email) {
                displayName = userData.email;
            }
            
            userNameElements.forEach(element => {
                element.textContent = displayName;
            });
        }
        
        // Обновляем аватары пользователя
        const userAvatars = document.querySelectorAll('.user-avatar .default-avatar');
        if (userData && userAvatars.length > 0) {
            let firstLetter = 'П';
            
            // Получаем первую букву имени или другого идентификатора
            if (userData.first_name) {
                firstLetter = userData.first_name.charAt(0).toUpperCase();
            } else if (userData.username) {
                firstLetter = userData.username.charAt(0).toUpperCase();
            } else if (userData.email) {
                firstLetter = userData.email.charAt(0).toUpperCase();
            }
            
            userAvatars.forEach(element => {
                element.textContent = firstLetter;
            });
        }
        
        // Показываем элементы только для авторизованных
        authOnlyElements.forEach(element => {
            element.style.display = '';
        });
        
    } else {
        // Показываем элементы для гостей и скрываем элементы для пользователей
        if (guestNav) guestNav.style.display = 'flex';
        if (userNav) userNav.style.display = 'none';
        
        // Скрываем элементы только для авторизованных
        authOnlyElements.forEach(element => {
            element.style.display = 'none';
        });
    }
}

// Инициализация выпадающего меню пользователя
function initUserDropdown() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', function() {
            const dropdown = this.querySelector('.user-dropdown');
            dropdown.classList.toggle('show');
        });
        
        // Закрываем выпадающее меню при клике вне его
        document.addEventListener('click', function(event) {
            if (!userMenu.contains(event.target)) {
                const dropdown = userMenu.querySelector('.user-dropdown');
                if (dropdown) dropdown.classList.remove('show');
            }
        });
    }
    
    // Добавляем обработчик для кнопки выхода
    const logoutLinks = document.querySelectorAll('.logout-link');
    logoutLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    });
}

// Функция для выхода из аккаунта
function logout() {
    // Удаляем токен и информацию о пользователе
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Обновляем UI
    updateUIForAuthState();
    
    // Если мы находимся на странице, требующей авторизации, перенаправляем на главную
    const currentPath = window.location.pathname;
    const authRequiredPages = [
        '/profile.html', 
        '/my-bookings.html'
    ];
    
    if (authRequiredPages.some(page => currentPath.endsWith(page))) {
        window.location.href = 'index.html';
    } else {
        // Иначе просто перезагружаем текущую страницу
        window.location.reload();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateUIForAuthState();
    initUserDropdown();
}); 