document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, авторизован ли пользователь
    checkAuthStatus();
    
    // Инициализация вкладок
    initTabs();
    
    // Инициализация поиска
    initSearch();
    
    // Инициализация обработчиков кнопок
    initButtonHandlers();
    
    // Обновляем счетчики в табах
    updateTabCounters();
});

// Функция для инициализации вкладок
function initTabs() {
    const tabItems = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabItems.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Удаляем активный класс у всех вкладок
            tabItems.forEach(item => item.classList.remove('active'));
            
            // Добавляем активный класс текущей вкладке
            this.classList.add('active');
            
            // Получаем id контента, который нужно показать
            const tabId = this.getAttribute('href').substring(1);
            
            // Скрываем все контенты вкладок
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Показываем нужный контент
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Функция для инициализации поиска
function initSearch() {
    const searchInput = document.querySelector('.search-box input');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchQuery = this.value.toLowerCase().trim();
            
            // Получаем активную вкладку
            const activeTab = document.querySelector('.tab-content.active');
            
            // Получаем все элементы броней в активной вкладке
            const bookingItems = activeTab.querySelectorAll('.booking-item');
            
            // Фильтруем брони по поисковому запросу
            bookingItems.forEach(item => {
                const restaurantName = item.querySelector('.booking-restaurant').textContent.toLowerCase();
                
                if (searchQuery === '' || restaurantName.includes(searchQuery)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Проверяем, есть ли видимые брони
            const visibleItems = activeTab.querySelectorAll('.booking-item[style="display: flex;"]');
            const emptyBookings = activeTab.querySelector('.empty-bookings');
            
            if (emptyBookings) {
                emptyBookings.style.display = visibleItems.length === 0 ? 'block' : 'none';
            }
        });
    }
}

// Функция для проверки статуса авторизации
function checkAuthStatus() {
    const accessToken = localStorage.getItem('access_token');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    // Если есть токен доступа, считаем пользователя авторизованным
    if (accessToken) {
        console.log('Пользователь авторизован:', userData);
        
        // Обновляем интерфейс для авторизованного пользователя
        updateAuthUI(userData);
    } else {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        window.location.href = 'login.html?redirect=my-bookings.html';
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
                <li><a href="my-bookings.html"><i class="fas fa-calendar-alt"></i> Мои брони</a></li>
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
    
    // Перенаправляем на главную страницу
    window.location.href = 'index.html';
}

// Функция для инициализации обработчиков кнопок
function initButtonHandlers() {
    // Обработчик для кнопок "Изменить"
    const editButtons = document.querySelectorAll('.booking-actions .btn-outline');
    editButtons.forEach(button => {
        if (button.textContent.trim() === 'Изменить') {
            button.addEventListener('click', function(e) {
                const bookingItem = this.closest('.booking-item');
                const restaurantName = bookingItem.querySelector('.booking-restaurant').textContent;
                alert(`Редактирование брони в ресторане "${restaurantName}"`);
                // Здесь будет логика редактирования брони
            });
        }
    });
    
    // Обработчик для кнопок "Отменить"
    const cancelButtons = document.querySelectorAll('.booking-actions .btn-cancel');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const bookingItem = this.closest('.booking-item');
            const restaurantName = bookingItem.querySelector('.booking-restaurant').textContent;
            if (confirm(`Вы уверены, что хотите отменить бронь в ресторане "${restaurantName}"?`)) {
                // Здесь будет логика отмены брони
                alert('Бронь отменена');
                
                // Переносим бронь на вкладку "Отмененные"
                bookingItem.classList.add('canceled');
                const cancelledTab = document.getElementById('cancelled');
                if (cancelledTab) {
                    const bookingList = cancelledTab.querySelector('.booking-list');
                    if (bookingList) {
                        const clonedItem = bookingItem.cloneNode(true);
                        bookingItem.remove();
                        bookingList.appendChild(clonedItem);
                        
                        // Обновляем счетчики в табах
                        updateTabCounters();
                    }
                }
            }
        });
    });
    
    // Обработчик для кнопок "Оставить отзыв"
    const reviewButtons = document.querySelectorAll('.booking-actions .btn-primary');
    reviewButtons.forEach(button => {
        if (button.textContent.trim() === 'Оставить отзыв') {
            button.addEventListener('click', function(e) {
                const bookingItem = this.closest('.booking-item');
                const restaurantName = bookingItem.querySelector('.booking-restaurant').textContent;
                alert(`Оставить отзыв о ресторане "${restaurantName}"`);
                // Здесь будет логика оставления отзыва
            });
        }
    });
    
    // Обработчик для кнопок "Забронировать снова"
    const rebookButtons = document.querySelectorAll('.booking-actions .btn-outline');
    rebookButtons.forEach(button => {
        if (button.textContent.trim() === 'Забронировать снова') {
            button.addEventListener('click', function(e) {
                const bookingItem = this.closest('.booking-item');
                const restaurantName = bookingItem.querySelector('.booking-restaurant').textContent;
                alert(`Повторное бронирование в ресторане "${restaurantName}"`);
                // Здесь будет логика повторного бронирования
            });
        }
    });
}

// Функция для обновления счетчиков в табах
function updateTabCounters() {
    // Подсчитываем количество бронирований на каждой вкладке
    const activeCount = document.querySelectorAll('#active .booking-item').length;
    const historyCount = document.querySelectorAll('#history .booking-item').length;
    const cancelledCount = document.querySelectorAll('#cancelled .booking-item').length;
    
    // Обновляем счетчики в табах
    document.querySelector('.tab-item[href="#active"]').textContent = `Активные (${activeCount})`;
    document.querySelector('.tab-item[href="#history"]').textContent = `История (${historyCount})`;
    document.querySelector('.tab-item[href="#cancelled"]').textContent = `Отмененные (${cancelledCount})`;
} 