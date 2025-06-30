document.addEventListener('DOMContentLoaded', function() {
    // Скрываем контейнеры для списков бронирований при загрузке страницы
    document.querySelectorAll('.booking-list').forEach(list => {
        list.style.display = 'none';
    });

    // Проверяем, авторизован ли пользователь
    checkAuthStatus();
    
    // Инициализация вкладок
    initTabs();
    
    // Инициализация поиска
    initSearch();
    
    // Загружаем данные бронирований
    loadBookings();
    
    // Инициализация плавной прокрутки к футеру
    initSmoothScroll();
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
    const searchInput = document.getElementById('booking-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchQuery = this.value.toLowerCase().trim();
            filterBookings(searchQuery);
        });
    }
}

// Функция для фильтрации бронирований
function filterBookings(searchQuery) {
    // Если отображается пустое состояние, не выполняем фильтрацию
    if (document.getElementById('empty-state').style.display === 'block') {
        return;
    }

    // Получаем активную вкладку
    const activeTab = document.querySelector('.tab-content.active');
    
    // Получаем все элементы броней в активной вкладке
    const bookingItems = activeTab.querySelectorAll('.booking-item');
    
    // Фильтруем брони по поисковому запросу
    let visibleCount = 0;
    
    bookingItems.forEach(item => {
        const restaurantName = item.querySelector('.booking-restaurant').textContent.toLowerCase();
        
        if (searchQuery === '' || restaurantName.includes(searchQuery)) {
            item.style.display = 'flex';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Показываем сообщение, если по запросу ничего не найдено
    const noResultsMessage = activeTab.querySelector('.no-results-message');
    
    if (visibleCount === 0) {
        // Если сообщения нет, создаем его
        if (!noResultsMessage) {
            const message = document.createElement('div');
            message.className = 'no-results-message';
            message.innerHTML = `
                <i class="fas fa-search"></i>
                <p>По запросу "${searchQuery}" ничего не найдено</p>
            `;
            activeTab.appendChild(message);
        } else {
            noResultsMessage.style.display = 'block';
            noResultsMessage.querySelector('p').textContent = `По запросу "${searchQuery}" ничего не найдено`;
        }
    } else if (noResultsMessage) {
        noResultsMessage.style.display = 'none';
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
    
    // Получаем данные пользователя из localStorage, если они не были переданы
    if (!userData || Object.keys(userData).length === 0) {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            try {
                userData = JSON.parse(userJson);
            } catch (e) {
                console.error('Ошибка при парсинге данных пользователя:', e);
                userData = {};
            }
        }
    }
    
    // Определяем имя для отображения
    let firstName = userData.first_name || '';
    let lastName = userData.last_name || '';
    
    // Если нет имени и фамилии, пробуем получить их из токена JWT
    if (!firstName && !lastName) {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    firstName = payload.first_name || '';
                    lastName = payload.last_name || '';
                }
            } catch (e) {
                console.error('Ошибка при декодировании токена:', e);
            }
        }
    }
    
    // Если всё еще нет имени, используем имя пользователя или email
    const displayName = (firstName || lastName) ? 
        `${firstName} ${lastName}`.trim() : 
        (userData.username || userData.email || 'Пользователь');
    
    // Создаем элемент с информацией о пользователе
    const userProfileElement = document.createElement('div');
    userProfileElement.className = 'user-profile';
    
    // Добавляем аватар и имя пользователя
    userProfileElement.innerHTML = `
        <div class="user-avatar">
            <img src="${userData.photo || 'assets/default-avatar.png'}" alt="Аватар" onerror="this.src='assets/default-avatar.png'">
        </div>
        <div class="user-info">
            <span class="user-name">${displayName}</span>
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

// Функция для загрузки бронирований с сервера
async function loadBookings() {
    try {
        const accessToken = localStorage.getItem('access_token');
        
        if (!accessToken) {
            throw new Error('Пользователь не авторизован');
        }
        
        // Показываем индикатор загрузки
        showLoading(true);
        
        // Запрос к API для получения бронирований
        const response = await fetch('/api/bookings', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            // Если ошибка 404 (нет бронирований), показываем пустое состояние
            if (response.status === 404) {
                showEmptyState(true);
                return;
            }
            throw new Error('Ошибка при загрузке бронирований');
        }
        
        const bookings = await response.json();
        
        // Если массив бронирований пуст, показываем пустое состояние
        if (!bookings || bookings.length === 0) {
            showEmptyState(true);
            return;
        }
        
        // Скрываем пустое состояние, если есть брони
        showEmptyState(false);
        
        // Разделяем брони по категориям
        const activeBookings = bookings.filter(booking => booking.status === 'active' || booking.status === 'confirmed');
        const historyBookings = bookings.filter(booking => booking.status === 'completed');
        const cancelledBookings = bookings.filter(booking => booking.status === 'cancelled');
        
        // Отображаем брони на соответствующих вкладках
        renderBookings('active-bookings', activeBookings);
        renderBookings('history-bookings', historyBookings);
        renderBookings('cancelled-bookings', cancelledBookings);
        
        // Обновляем счетчики в табах
        updateTabCounters(activeBookings.length, historyBookings.length, cancelledBookings.length);
        
    } catch (error) {
        console.error('Ошибка при загрузке бронирований:', error);
        // Показываем ошибку только если это не отсутствие бронирований
        if (error.message !== 'Нет бронирований') {
            showError('Не удалось загрузить бронирования. Пожалуйста, попробуйте позже.');
        }
    } finally {
        // Скрываем индикатор загрузки
        showLoading(false);
    }
}

// Функция для отображения/скрытия пустого состояния
function showEmptyState(show) {
    const emptyState = document.getElementById('empty-state');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (emptyState) {
        emptyState.style.display = show ? 'block' : 'none';
        
        // Скрываем/показываем контейнеры для бронирований
        tabContents.forEach(tab => {
            const bookingList = tab.querySelector('.booking-list');
            if (bookingList) {
                bookingList.style.display = show ? 'none' : 'block';
            }
        });
    }
}

// Функция для отображения бронирований
function renderBookings(containerId, bookings) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Если бронирований нет, показываем сообщение
    if (bookings.length === 0) {
        return;
    }
    
    // Создаем элементы для каждого бронирования
    bookings.forEach(booking => {
        const bookingItem = createBookingElement(booking);
        container.appendChild(bookingItem);
    });
    
    // Добавляем обработчики для кнопок
    addButtonHandlers(containerId);
}

// Функция для создания элемента бронирования
function createBookingElement(booking) {
    const bookingItem = document.createElement('div');
    bookingItem.className = `booking-item ${getBookingClass(booking.status)}`;
    bookingItem.dataset.id = booking.id;
    
    // Форматируем дату и время
    const bookingDate = new Date(booking.booking_date);
    const formattedDate = formatDate(bookingDate);
    const formattedTime = formatTime(bookingDate);
    const dayOfWeek = getDayOfWeek(bookingDate);
    
    // Форматируем дату создания бронирования
    const createdDate = new Date(booking.created_at);
    const formattedCreatedDate = formatDate(createdDate, true);
    
    // Определяем статус бронирования
    const statusClass = getStatusClass(booking.status);
    const statusText = getStatusText(booking.status);
    
    bookingItem.innerHTML = `
        <div class="booking-image">
            <img src="${booking.restaurant.image || 'assets/images/restaurants/default.jpg'}" alt="${booking.restaurant.name}">
        </div>
        <div class="booking-details">
            <div class="booking-header">
                <div class="booking-title-row">
                    <h3 class="booking-restaurant">${booking.restaurant.name}</h3>
                    <div class="booking-status ${statusClass}">${statusText}</div>
                </div>
                <div class="booking-number">
                    <div class="booking-number-text">Номер брони: #${booking.booking_number}</div>
                    <div class="booking-date">Забронировано ${formattedCreatedDate}</div>
                </div>
            </div>
            
            <div class="booking-content">
                <div class="booking-info">
                    <div class="booking-info-item">
                        <i class="far fa-calendar"></i>
                        <span>${formattedDate}, ${dayOfWeek}</span>
                        <i class="far fa-clock time-icon"></i>
                        <span>${formattedTime}</span>
                    </div>
                    <div class="booking-info-item">
                        <i class="fas fa-user-friends"></i>
                        <span>${booking.guests} ${getGuestsText(booking.guests)}</span>
                    </div>
                    <div class="booking-info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${booking.restaurant.address}</span>
                    </div>
                </div>
                
                <div class="booking-actions">
                    ${getActionButtons(booking.status)}
                </div>
            </div>
        </div>
    `;
    
    return bookingItem;
}

// Функция для определения класса бронирования
function getBookingClass(status) {
    switch (status) {
        case 'completed':
            return 'past';
        case 'cancelled':
            return 'canceled';
        default:
            return '';
    }
}

// Функция для определения класса статуса
function getStatusClass(status) {
    switch (status) {
        case 'active':
        case 'confirmed':
            return 'upcoming';
        case 'completed':
            return 'completed';
        case 'cancelled':
            return 'canceled';
        default:
            return '';
    }
}

// Функция для определения текста статуса
function getStatusText(status) {
    switch (status) {
        case 'active':
            return 'Активно';
        case 'confirmed':
            return 'Подтверждено';
        case 'completed':
            return 'Завершено';
        case 'cancelled':
            return 'Отменено';
        default:
            return '';
    }
}

// Функция для форматирования даты
function formatDate(date, shortFormat = false) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    if (shortFormat) {
        return `${day}.${month}.${year}`;
    }
    
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    
    return `${day} ${months[date.getMonth()]} ${year}`;
}

// Функция для форматирования времени
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
}

// Функция для определения дня недели
function getDayOfWeek(date) {
    const days = [
        'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
        'Четверг', 'Пятница', 'Суббота'
    ];
    
    return days[date.getDay()];
}

// Функция для определения склонения слова "гость"
function getGuestsText(count) {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastDigit === 1 && lastTwoDigits !== 11) {
        return 'гость';
    } else if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
        return 'гостя';
    } else {
        return 'гостей';
    }
}

// Функция для определения кнопок действий
function getActionButtons(status) {
    switch (status) {
        case 'active':
        case 'confirmed':
            return `
                <button class="btn-edit" data-action="edit">
                    <i class="fas fa-pen"></i>
                    Изменить бронь
                </button>
                <button class="btn-cancel" data-action="cancel">
                    <i class="fas fa-times"></i>
                    Отменить бронь
                </button>
            `;
        case 'completed':
            return `
                <button class="btn-edit" data-action="review">
                    <i class="fas fa-star"></i>
                    Оставить отзыв
                </button>
                <button class="btn-cancel" data-action="rebook">
                    <i class="fas fa-redo"></i>
                    Забронировать снова
                </button>
            `;
        case 'cancelled':
            return `
                <button class="btn-cancel" data-action="rebook">
                    <i class="fas fa-redo"></i>
                    Забронировать снова
                </button>
            `;
        default:
            return '';
    }
}

// Функция для добавления обработчиков кнопок
function addButtonHandlers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Обработчик для всех кнопок в контейнере
    container.addEventListener('click', async function(e) {
        // Находим ближайшую кнопку
        const button = e.target.closest('button[data-action]');
        if (!button) return;
        
        // Получаем действие и ID бронирования
        const action = button.dataset.action;
        const bookingItem = button.closest('.booking-item');
        const bookingId = bookingItem.dataset.id;
            const restaurantName = bookingItem.querySelector('.booking-restaurant').textContent;
        
        // Выполняем соответствующее действие
        switch (action) {
            case 'edit':
                window.location.href = `edit-booking.html?id=${bookingId}`;
                break;
            
            case 'cancel':
            if (confirm(`Вы уверены, что хотите отменить бронь в ресторане "${restaurantName}"?`)) {
                    await cancelBooking(bookingId);
                }
                break;
            
            case 'review':
                window.location.href = `review.html?booking=${bookingId}`;
                break;
            
            case 'rebook':
                const restaurantId = await getRestaurantIdByBooking(bookingId);
                if (restaurantId) {
                    window.location.href = `restaurant.html?id=${restaurantId}`;
                }
                break;
        }
    });
}

// Функция для отмены бронирования
async function cancelBooking(bookingId) {
    try {
        const accessToken = localStorage.getItem('access_token');
        
        if (!accessToken) {
            throw new Error('Пользователь не авторизован');
        }
        
        // Запрос к API для отмены бронирования
        const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при отмене бронирования');
        }
        
        // Перезагружаем бронирования
        loadBookings();
        
    } catch (error) {
        console.error('Ошибка при отмене бронирования:', error);
        showError('Не удалось отменить бронирование. Пожалуйста, попробуйте позже.');
    }
}

// Функция для получения ID ресторана по ID бронирования
async function getRestaurantIdByBooking(bookingId) {
    try {
        const accessToken = localStorage.getItem('access_token');
        
        if (!accessToken) {
            throw new Error('Пользователь не авторизован');
        }
        
        // Запрос к API для получения информации о бронировании
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при получении информации о бронировании');
        }
        
        const booking = await response.json();
        return booking.restaurant.id;
        
    } catch (error) {
        console.error('Ошибка при получении ID ресторана:', error);
        showError('Не удалось получить информацию о ресторане. Пожалуйста, попробуйте позже.');
        return null;
    }
}

// Функция для обновления счетчиков в табах
function updateTabCounters(activeCount, historyCount, cancelledCount) {
    document.getElementById('active-tab').textContent = `Активные${activeCount > 0 ? ` (${activeCount})` : ''}`;
    document.getElementById('history-tab').textContent = `История${historyCount > 0 ? ` (${historyCount})` : ''}`;
    document.getElementById('cancelled-tab').textContent = `Отмененные${cancelledCount > 0 ? ` (${cancelledCount})` : ''}`;
}

// Функция для отображения индикатора загрузки
function showLoading(isLoading) {
    // Реализация индикатора загрузки
    const tabs = document.querySelectorAll('.tab-content');
    
    // Скрываем сообщение об ошибке при начале загрузки
    if (isLoading) {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(message => message.remove());
    }
    
    tabs.forEach(tab => {
        const bookingList = tab.querySelector('.booking-list');
        
        if (isLoading) {
            bookingList.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
        }
    });
}

// Функция для отображения ошибки
function showError(message) {
    // Скрываем пустое состояние
    document.getElementById('empty-state').style.display = 'none';
    
    const container = document.querySelector('.container');
    
    // Удаляем предыдущие сообщения об ошибке
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());
    
    // Создаем элемент для отображения ошибки
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button class="close-error"><i class="fas fa-times"></i></button>
    `;
    
    // Добавляем элемент в контейнер
    container.insertBefore(errorElement, container.firstChild);
    
    // Добавляем обработчик для закрытия ошибки
    const closeButton = errorElement.querySelector('.close-error');
    closeButton.addEventListener('click', function() {
        errorElement.remove();
        
        // Показываем пустое состояние после закрытия ошибки
        showEmptyState(true);
    });
    
    // Автоматически скрываем ошибку через 5 секунд
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
            
            // Показываем пустое состояние после скрытия ошибки
            showEmptyState(true);
        }
    }, 5000);
}

// Функция для инициализации плавной прокрутки
function initSmoothScroll() {
    const contactsLink = document.querySelector('.scroll-to-contacts');
    
    if (contactsLink) {
        contactsLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // Проверяем, есть ли в URL хэш #contacts
    if (window.location.hash === '#contacts') {
        setTimeout(() => {
            const contactsSection = document.getElementById('contacts');
            if (contactsSection) {
                window.scrollTo({
                    top: contactsSection.offsetTop,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }
}