document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации и роли пользователя
    checkAuthAndRole();
    
    // Инициализация компонентов (только если авторизация прошла успешно)
});

// Функция для проверки авторизации и роли пользователя
function checkAuthAndRole() {
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    // Если нет токена, перенаправляем на страницу входа
    if (!authToken) {
        window.location.href = 'login.html?redirect=admin-panel.html';
        return;
    }
    
    // Если пользователь не является персоналом ресторана, но является суперпользователем или системным администратором,
    // разрешаем доступ (они имеют доступ ко всем разделам)
    const isAdmin = userData.is_superuser === true || userData.is_system_admin === true;
    const isStaff = userData.is_staff === true;
    
    if (!isStaff && !isAdmin) {
        // Если пользователь не является ни персоналом, ни администратором, перенаправляем на главную страницу
        window.location.href = 'index.html';
        return;
    }
    
    // Если авторизация и проверка роли прошли успешно, инициализируем компоненты
    initDateFilter();
    initStatusFilter();
    initActionButtons();
    initPagination();
    initUserDropdown();
    
    // Обновляем имя пользователя в шапке
    updateUserInfo(userData);
}

// Функция для обновления информации о пользователе
function updateUserInfo(userData) {
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        let displayName = 'Администратор';
        
        if (userData.first_name && userData.last_name) {
            displayName = `${userData.first_name} ${userData.last_name}`;
        } else if (userData.first_name) {
            displayName = userData.first_name;
        } else if (userData.username) {
            displayName = userData.username;
        }
        
        // Если есть информация о ресторане, добавляем её
        if (userData.administered_branch_ids && userData.administered_branch_ids.length > 0) {
            // Здесь можно добавить запрос на получение информации о ресторане
            // Пока используем заглушку
            displayName += ' (Tokyo Kawaii)';
        }
        
        userNameElement.textContent = displayName;
    }
}

// Инициализация фильтра по дате
function initDateFilter() {
    const dateFilter = document.getElementById('booking-date-filter');
    if (dateFilter) {
        // Устанавливаем текущую дату
        const today = new Date();
        const formattedDate = formatDateForInput(today);
        dateFilter.value = formattedDate;
        
        // Добавляем обработчик события изменения даты
        dateFilter.addEventListener('change', function() {
            filterBookings();
        });
    }
}

// Форматирование даты для input[type="date"]
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Инициализация фильтра по статусу
function initStatusFilter() {
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterBookings();
        });
    }
}

// Функция для фильтрации бронирований
function filterBookings() {
    const dateFilter = document.getElementById('booking-date-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    // Здесь будет логика фильтрации бронирований
    console.log('Фильтрация бронирований:', { date: dateFilter, status: statusFilter });
    
    // В реальном приложении здесь будет запрос к API для получения отфильтрованных данных
    // Пока просто имитируем загрузку
    showLoading(true);
    
    setTimeout(() => {
        showLoading(false);
    }, 500);
}

// Функция для отображения/скрытия индикатора загрузки
function showLoading(isLoading) {
    const bookingsTable = document.querySelector('.bookings-table-body');
    
    if (isLoading) {
        bookingsTable.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Загрузка бронирований...</span>
            </div>
        `;
    } else {
        // В реальном приложении здесь будет отрисовка полученных данных
        // Пока просто восстанавливаем исходное состояние для демонстрации
    }
}

// Инициализация кнопок действий
function initActionButtons() {
    const bookingsTable = document.querySelector('.bookings-table-body');
    
    if (bookingsTable) {
        bookingsTable.addEventListener('click', function(e) {
            const button = e.target.closest('.action-btn');
            if (!button) return;
            
            const bookingRow = button.closest('.booking-row');
            const bookingId = bookingRow.getAttribute('data-id') || 
                              bookingRow.querySelector('.booking-number').textContent.trim();
            
            if (button.classList.contains('confirm-btn')) {
                confirmBooking(bookingId, bookingRow);
            } else if (button.classList.contains('cancel-btn')) {
                cancelBooking(bookingId, bookingRow);
            } else if (button.classList.contains('info-btn')) {
                showBookingInfo(bookingId);
            }
        });
    }
}

// Функция для подтверждения бронирования
function confirmBooking(bookingId, bookingRow) {
    if (confirm('Вы уверены, что хотите подтвердить бронирование ' + bookingId + '?')) {
        // Здесь будет запрос к API для подтверждения бронирования
        console.log('Подтверждение бронирования:', bookingId);
        
        // Имитация успешного ответа
        const statusBadge = bookingRow.querySelector('.status-badge');
        statusBadge.className = 'status-badge status-confirmed';
        statusBadge.textContent = 'Подтверждено';
        
        // Обновляем кнопки действий
        const actionsColumn = bookingRow.querySelector('.booking-actions');
        actionsColumn.innerHTML = `
            <button class="action-btn cancel-btn" title="Отменить"><i class="fas fa-times"></i></button>
            <button class="action-btn info-btn" title="Информация"><i class="fas fa-info-circle"></i></button>
        `;
        
        // Назначаем стол (в реальном приложении это будет делаться через диалоговое окно)
        const tableColumn = bookingRow.querySelector('.booking-table');
        if (tableColumn.textContent.includes('Ожидает')) {
            tableColumn.textContent = 'Стол ' + Math.floor(Math.random() * 10 + 1);
        }
        
        showNotification('Бронирование успешно подтверждено', 'success');
    }
}

// Функция для отмены бронирования
function cancelBooking(bookingId, bookingRow) {
    if (confirm('Вы уверены, что хотите отменить бронирование ' + bookingId + '?')) {
        // Здесь будет запрос к API для отмены бронирования
        console.log('Отмена бронирования:', bookingId);
        
        // Имитация успешного ответа
        const statusBadge = bookingRow.querySelector('.status-badge');
        statusBadge.className = 'status-badge status-cancelled';
        statusBadge.textContent = 'Отменено';
        
        // Обновляем кнопки действий
        const actionsColumn = bookingRow.querySelector('.booking-actions');
        actionsColumn.innerHTML = `
            <button class="action-btn info-btn" title="Информация"><i class="fas fa-info-circle"></i></button>
        `;
        
        showNotification('Бронирование отменено', 'success');
    }
}

// Функция для отображения информации о бронировании
function showBookingInfo(bookingId) {
    // Здесь будет запрос к API для получения подробной информации о бронировании
    console.log('Просмотр информации о бронировании:', bookingId);
    
    // В реальном приложении здесь будет открытие модального окна с подробной информацией
    alert('Информация о бронировании ' + bookingId + '\n\nВ реальном приложении здесь будет модальное окно с подробной информацией о бронировании.');
}

// Инициализация пагинации
function initPagination() {
    const pagination = document.querySelector('.bookings-pagination');
    
    if (pagination) {
        pagination.addEventListener('click', function(e) {
            const button = e.target.closest('.pagination-btn');
            if (!button) return;
            
            // Убираем активный класс у всех кнопок
            const buttons = pagination.querySelectorAll('.pagination-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // Добавляем активный класс нажатой кнопке
            button.classList.add('active');
            
            // Здесь будет логика загрузки данных для выбранной страницы
            const page = button.textContent;
            console.log('Переход на страницу:', page);
            
            // Имитируем загрузку
            showLoading(true);
            setTimeout(() => {
                showLoading(false);
            }, 500);
        });
    }
}

// Инициализация выпадающего меню пользователя
function initUserDropdown() {
    const userProfile = document.querySelector('.user-profile');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (userProfile) {
        userProfile.addEventListener('click', function() {
            this.classList.toggle('active');
        });
        
        // Закрываем выпадающее меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                userProfile.classList.remove('active');
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Функция для выхода из системы
function logout() {
    // Удаляем токен и данные пользователя
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_data');
    
    // Перенаправляем на страницу входа
    window.location.href = 'login.html';
}

// Функция для отображения уведомлений
function showNotification(message, type = 'success') {
    // Удаляем предыдущие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Показываем уведомление с анимацией
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Скрываем уведомление через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        
        // Удаляем элемент после завершения анимации
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
} 