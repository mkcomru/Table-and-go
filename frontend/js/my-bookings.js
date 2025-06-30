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
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    // Если есть токен доступа, считаем пользователя авторизованным
    if (authToken) {
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_data');
    
    // Перенаправляем на главную страницу
    window.location.href = 'index.html';
}

// Функция для загрузки бронирований с сервера
async function loadBookings() {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            throw new Error('Пользователь не авторизован');
        }
        
        // Показываем индикатор загрузки
        showLoading(true);
        
        // Запрос к API для получения бронирований
        const response = await fetch('http://127.0.0.1:8000/api/bookings/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            // Если ошибка 404 (нет бронирований), показываем пустое состояние
            if (response.status === 404) {
                showEmptyState(true);
                return;
            }
            // Тихо обрабатываем другие ошибки, просто показываем пустое состояние
            console.error('Ошибка при загрузке бронирований:', response.status);
            showEmptyState(true);
            return;
        }
        
        const data = await response.json();
        const bookings = data.results || data; // Обрабатываем как массив или объект с полем results
        
        // Если массив бронирований пуст, показываем пустое состояние
        if (!bookings || bookings.length === 0) {
            showEmptyState(true);
            return;
        }
        
        // Скрываем пустое состояние, если есть брони
        showEmptyState(false);
        
        // Разделяем брони по категориям
        const activeBookings = bookings.filter(booking => 
            booking.status === 'pending' || booking.status === 'confirmed');
        const historyBookings = bookings.filter(booking => 
            booking.status === 'completed');
        const cancelledBookings = bookings.filter(booking => 
            booking.status === 'cancelled');
        
        // Отображаем брони на соответствующих вкладках
        renderBookings('active-bookings', activeBookings);
        renderBookings('history-bookings', historyBookings);
        renderBookings('cancelled-bookings', cancelledBookings);
        
        // Обновляем счетчики в табах
        updateTabCounters(activeBookings.length, historyBookings.length, cancelledBookings.length);
        
    } catch (error) {
        console.error('Ошибка при загрузке бронирований:', error);
        // Просто показываем пустое состояние без уведомления об ошибке
        showEmptyState(true);
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
    const bookingDate = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const formattedDate = formatDate(bookingDate);
    const formattedTime = booking.booking_time;
    const dayOfWeek = getDayOfWeek(bookingDate);
    
    // Определяем статус бронирования
    const statusClass = getStatusClass(booking.status);
    const statusText = getStatusText(booking.status);
    
    // Получаем номер брони или используем ID как запасной вариант
    const bookingNumber = booking.book_number || `ID-${booking.id}`;
    
    // Создаем HTML для изображения
    const imageHtml = booking.branch_image 
        ? `<img src="${booking.branch_image}" alt="${booking.branch_name}">`
        : '';
    
    bookingItem.innerHTML = `
        <div class="booking-image" style="background-color: ${booking.branch_image ? 'transparent' : '#ff0000'}">
            ${imageHtml}
        </div>
        <div class="booking-details">
            <div class="booking-header">
                <div class="booking-title-row">
                    <h3 class="booking-restaurant">${booking.branch_name}</h3>
                    <div class="booking-status ${statusClass}">${statusText}</div>
                </div>
                <div class="booking-number">
                    <div class="booking-number-text">Номер брони: #${bookingNumber}</div>
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
                        <span>${booking.guests_count} ${getGuestsText(booking.guests_count)}</span>
                    </div>
                    <div class="booking-info-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${booking.branch_address}</span>
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
        case 'pending':
            return 'pending';
        case 'confirmed':
            return 'confirmed';
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
        case 'pending':
            return 'pending';
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
        case 'pending':
            return 'В ожидании';
        case 'confirmed':
            return 'Подтверждено';
        case 'completed':
            return 'Завершено';
        case 'cancelled':
            return 'Отменено';
        default:
            return status || 'Неизвестно';
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
        case 'pending':
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
                await showEditBookingModal(bookingId);
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

// Функция для получения деталей бронирования
async function getBookingDetails(bookingId) {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            throw new Error('Пользователь не авторизован');
        }
        
        const response = await fetch(`http://127.0.0.1:8000/api/bookings/${bookingId}/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при получении информации о бронировании');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка при получении деталей бронирования:', error);
        showError('Не удалось получить информацию о бронировании. Пожалуйста, попробуйте позже.');
        return null;
    }
}

// Функция для отображения модального окна редактирования брони
async function showEditBookingModal(bookingId) {
    try {
        // Получаем детали бронирования
        const booking = await getBookingDetails(bookingId);
        if (!booking) return;
        
        // Создаем модальное окно, если его еще нет
        let modal = document.getElementById('edit-booking-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'edit-booking-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        // Форматируем дату и время
        const bookingDate = new Date(booking.booking_datetime);
        const formattedDate = formatDate(bookingDate, true);
        const formattedTime = booking.booking_time || formatTime(bookingDate);
        
        // Создаем содержимое модального окна
        modal.innerHTML = `
            <div class="modal-content booking-edit-modal">
                <div class="modal-header">
                    <h3 class="modal-title">${booking.branch_name || 'Миллионка'}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="booking-details-container">
                        <div class="booking-info-block">
                            <div class="booking-number-block">
                                Номер брони: #${booking.book_number || `SK2506-2`}
                            </div>
                            <div class="booking-created-block">
                                Забронировано ${booking.created_at ? new Date(booking.created_at).toLocaleDateString() : '20.06.2025'}
                            </div>
                        </div>
                        
                        <div class="booking-edit-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-booking-date">Дата</label>
                                    <div class="input-with-icon">
                                        <input type="date" id="edit-booking-date" class="form-control" value="${booking.booking_date || formattedDate.split('.').reverse().join('-')}" required>
                                        <i class="far fa-calendar"></i>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="edit-booking-time">Время</label>
                                    <div class="input-with-icon">
                                        <input type="time" id="edit-booking-time" class="form-control" value="${booking.booking_time || formattedTime}" required>
                                        <i class="far fa-clock"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group guests-group">
                                <label for="edit-booking-guests">Количество гостей</label>
                                <div class="guests-counter">
                                    <button type="button" class="counter-btn" id="decrease-guests">-</button>
                                    <input type="number" id="edit-booking-guests" class="form-control" value="${booking.guests_count || 2}" min="1" max="20" readonly>
                                    <button type="button" class="counter-btn" id="increase-guests">+</button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-booking-comments">Комментарий (необязательно)</label>
                                <textarea id="edit-booking-comments" class="form-control" rows="3" placeholder="Особые пожелания, аллергии и т.д.">${booking.special_requests || ''}</textarea>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button class="btn btn-outline modal-cancel">Отменить</button>
                            <button class="btn btn-primary" id="save-booking-changes">Сохранить изменения</button>
                        </div>
                    </div>
                    
                    <div class="booking-image-container">
                        <img src="${booking.branch_image || 'img/restaurant-interior.jpg'}" alt="${booking.branch_name || 'Ресторан'}" onerror="this.src='img/restaurant-interior.jpg'">
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем стили для модального окна редактирования, если их нет
        if (!document.getElementById('edit-booking-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'edit-booking-modal-styles';
            style.textContent = `
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(255, 255, 255, 0.8);
                    z-index: 1000;
                    align-items: center;
                    justify-content: center;
                    overflow: auto;
                    padding: 20px;
                }
                .modal.show {
                    display: flex;
                    animation: fadeIn 0.3s;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .booking-edit-modal {
                    max-width: 800px;
                    border-radius: 10px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    background-color: white;
                    position: relative;
                    width: 100%;
                    animation: slideIn 0.3s;
                    overflow: hidden;
                }
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .modal-header {
                    padding: 15px 20px;
                    border-bottom: 1px solid #eee;
                    position: relative;
                }
                .modal-title {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    text-align: left;
                }
                .modal-close {
                    position: absolute;
                    right: 15px;
                    top: 15px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #999;
                }
                .modal-body {
                    display: flex;
                }
                .booking-details-container {
                    flex: 1;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                }
                .booking-image-container {
                    width: 300px;
                    height: 100%;
                }
                .booking-image-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }
                .booking-info-block {
                    margin-bottom: 15px;
                    color: #666;
                    font-size: 14px;
                }
                .booking-number-block {
                    margin-bottom: 5px;
                }
                .booking-created-block {
                    color: #888;
                }
                .booking-edit-form {
                    margin-top: 20px;
                    flex: 1;
                }
                .form-row {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                .form-row .form-group {
                    flex: 1;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                }
                .form-control {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    background-color: #fff;
                }
                .input-with-icon {
                    position: relative;
                }
                .input-with-icon i {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #999;
                }
                .input-with-icon input {
                    padding-right: 30px;
                }
                .guests-group {
                    margin-bottom: 20px;
                }
                .guests-counter {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    max-width: 150px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .counter-btn {
                    width: 40px;
                    height: 40px;
                    background: #f5f5f5;
                    border: none;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                #edit-booking-guests {
                    flex: 1;
                    border: none;
                    text-align: center;
                    font-size: 16px;
                    padding: 8px 0;
                }
                textarea.form-control {
                    resize: none;
                    min-height: 80px;
                }
                .modal-footer {
                    margin-top: auto;
                    padding-top: 15px;
                    display: flex;
                    justify-content: space-between;
                }
                .btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }
                .btn-outline {
                    background: white;
                    border: 1px solid #ddd;
                    color: #555;
                }
                .btn-primary {
                    background: #8B0000;
                    color: white;
                    border: 1px solid #8B0000;
                }
                .btn-primary:hover {
                    background: #6B0000;
                }
                .btn-outline:hover {
                    background: #f5f5f5;
                }
                
                body.modal-open {
                    overflow: hidden;
                }
                
                @media (max-width: 768px) {
                    .modal-body {
                        flex-direction: column-reverse;
                    }
                    .booking-image-container {
                        width: 100%;
                        height: 200px;
                    }
                }
                
                @media (max-width: 576px) {
                    .form-row {
                        flex-direction: column;
                        gap: 10px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Отображаем модальное окно
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Добавляем обработчики событий
        const closeButton = modal.querySelector('.modal-close');
        const cancelButton = modal.querySelector('.modal-cancel');
        const saveButton = document.getElementById('save-booking-changes');
        const decreaseButton = document.getElementById('decrease-guests');
        const increaseButton = document.getElementById('increase-guests');
        const guestsInput = document.getElementById('edit-booking-guests');
        
        // Закрытие модального окна
        const closeModal = () => {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        };
        
        closeButton.addEventListener('click', closeModal);
        cancelButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // Предотвращаем закрытие при клике на содержимое модального окна
        modal.querySelector('.modal-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Увеличение/уменьшение количества гостей
        decreaseButton.addEventListener('click', () => {
            const currentValue = parseInt(guestsInput.value);
            if (currentValue > 1) {
                guestsInput.value = currentValue - 1;
            }
        });
        
        increaseButton.addEventListener('click', () => {
            const currentValue = parseInt(guestsInput.value);
            if (currentValue < 20) {
                guestsInput.value = currentValue + 1;
            }
        });
        
        // Сохранение изменений
        saveButton.addEventListener('click', async () => {
            const dateInput = document.getElementById('edit-booking-date');
            const timeInput = document.getElementById('edit-booking-time');
            const guestsInput = document.getElementById('edit-booking-guests');
            const commentsInput = document.getElementById('edit-booking-comments');
            
            // Валидация формы
            if (!dateInput.value || !timeInput.value || !guestsInput.value) {
                showNotification('Пожалуйста, заполните все обязательные поля', 'error');
                return;
            }
            
            // Создаем объект с данными для отправки
            const formData = {
                date: dateInput.value,
                time: timeInput.value,
                guests_count: parseInt(guestsInput.value),
                special_requests: commentsInput.value
            };
            
            // Отправляем запрос на обновление
            await updateBooking(bookingId, formData);
            
            // Закрываем модальное окно
            closeModal();
        });
        
    } catch (error) {
        console.error('Ошибка при отображении модального окна редактирования:', error);
        showError('Не удалось отобразить форму редактирования. Пожалуйста, попробуйте позже.');
    }
}

// Функция для обновления бронирования
async function updateBooking(bookingId, formData) {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            throw new Error('Пользователь не авторизован');
        }
        
        // Создаем дату в формате ISO
        const bookingDateTime = new Date(`${formData.date}T${formData.time}`);
        
        // Проверяем, не в прошлом ли дата
        if (bookingDateTime < new Date()) {
            showNotification('Дата и время бронирования не могут быть в прошлом', 'error');
            return false;
        }
        
        // Показываем уведомление о загрузке
        showNotification('Обновление бронирования...', 'info');
        
        // Отправляем запрос на обновление
        const response = await fetch(`http://127.0.0.1:8000/api/bookings/update/${bookingId}/`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                booking_datetime: bookingDateTime.toISOString(),
                guests_count: formData.guests_count,
                special_requests: formData.special_requests
            })
        });
        
        if (!response.ok) {
            // Пытаемся получить текст ошибки из ответа
            let errorText = 'Ошибка при обновлении бронирования';
            try {
                const errorData = await response.json();
                errorText = errorData.detail || errorData.message || errorText;
            } catch (e) {
                // Если не удалось распарсить JSON, используем стандартный текст
            }
            
            throw new Error(errorText);
        }
        
        // Показываем уведомление об успехе
        showNotification('Бронирование успешно обновлено', 'success');
        
        // Перезагружаем бронирования
        loadBookings();
        
        return true;
    } catch (error) {
        console.error('Ошибка при обновлении бронирования:', error);
        showError(error.message || 'Не удалось обновить бронирование. Пожалуйста, попробуйте позже.');
        return false;
    }
}

// Функция для создания даты и времени из строковых значений
function createDateTime(dateStr, timeStr) {
    try {
        // Проверяем формат даты (может быть YYYY-MM-DD или DD.MM.YYYY)
        let formattedDate = dateStr;
        if (dateStr.includes('.')) {
            // Преобразуем из DD.MM.YYYY в YYYY-MM-DD
            const parts = dateStr.split('.');
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        
        // Создаем объект Date
        const dateTime = new Date(`${formattedDate}T${timeStr}`);
        
        // Проверяем валидность даты
        if (isNaN(dateTime.getTime())) {
            throw new Error('Неверный формат даты или времени');
        }
        
        return dateTime;
    } catch (error) {
        console.error('Ошибка при создании объекта даты:', error);
        return null;
    }
}

// Функция для отмены бронирования
async function cancelBooking(bookingId) {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            throw new Error('Пользователь не авторизован');
        }
        
        // Запрос к API для отмены бронирования
        const response = await fetch(`http://127.0.0.1:8000/api/bookings/cancel/${bookingId}/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при отмене бронирования');
        }
        
        // Показываем уведомление об успешной отмене
        showNotification('Бронирование успешно отменено', 'success');
        
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
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            throw new Error('Пользователь не авторизован');
        }
        
        // Запрос к API для получения информации о бронировании
        const response = await fetch(`http://127.0.0.1:8000/api/bookings/${bookingId}/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при получении информации о бронировании');
        }
        
        const booking = await response.json();
        return booking.branch; // ID филиала ресторана
        
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

// Функция для создания и отображения уведомлений
function showNotification(message, type = 'success') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Добавляем уведомление в DOM
    document.body.appendChild(notification);
    
    // Через секунду добавляем класс для анимации появления
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Через 5 секунд удаляем уведомление
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}