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
            const displayName = userData.first_name ? `${userData.first_name} ${userData.last_name || ''}` : 'Пользователь';
            userNameElements.forEach(element => {
                element.textContent = displayName;
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

document.addEventListener('DOMContentLoaded', function() {
    updateUIForAuthState();
    initUserDropdown();
}); 