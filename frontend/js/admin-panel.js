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
    
    // Загружаем информацию о филиалах пользователя
    loadUserBranches(userData);
    
    // Обновляем имя пользователя в шапке
    updateUserInfo(userData);
}

// Функция для загрузки информации о филиалах пользователя
function loadUserBranches(userData) {
    // Получаем токен авторизации
    const authToken = localStorage.getItem('authToken');
    
    // Запрашиваем список филиалов, где пользователь является администратором
    fetch('http://127.0.0.1:8000/api/branch-admin/', {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при загрузке филиалов');
        }
        return response.json();
    })
    .then(data => {
        // Получаем данные о филиалах, где пользователь является администратором
        const branchAdmins = data.results || data;
        
        if (branchAdmins && branchAdmins.length > 0) {
            // Собираем ID филиалов
            const branchIds = branchAdmins.map(admin => admin.branch);
            
            // Если есть хотя бы один филиал, загружаем информацию о нем
            if (branchIds.length > 0) {
                // Загружаем информацию о первом филиале
                fetch(`http://127.0.0.1:8000/api/branch/${branchIds[0]}/`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                })
                .then(response => response.json())
                .then(branchData => {
                    // Обновляем заголовок панели администратора
                    const adminHeader = document.querySelector('.admin-header h1');
                    if (adminHeader) {
                        adminHeader.textContent = `Панель администратора ресторана "${branchData.name}"`;
                    }
                    
                    // Сохраняем ID текущего филиала
                    window.currentBranchId = branchData.id;
                    
                    // Если есть несколько филиалов, создаем селектор
                    if (branchIds.length > 1) {
                        // Загружаем информацию обо всех филиалах
                        Promise.all(branchIds.map(branchId => 
                            fetch(`http://127.0.0.1:8000/api/branch/${branchId}/`, {
                                headers: {
                                    'Authorization': `Bearer ${authToken}`
                                }
                            }).then(response => response.json())
                        ))
                        .then(branches => {
                            createBranchSelector(branches);
                        });
                    }
                    
                    // Загружаем брони для филиала
                    loadBookings(branchData.id);
                })
                .catch(error => {
                    console.error('Ошибка при загрузке информации о филиале:', error);
                    showNotification('Ошибка при загрузке информации о филиале', 'error');
                });
            } else {
                showNotification('У вас нет доступа к филиалам', 'error');
            }
        } else {
            showNotification('У вас нет доступа к филиалам', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка при загрузке филиалов:', error);
        showNotification('Ошибка при загрузке филиалов', 'error');
    });
}

// Функция для создания селектора филиалов
function createBranchSelector(branches) {
    // Если только один филиал, просто показываем его название
    if (branches.length === 1) {
        const adminHeader = document.querySelector('.admin-header h1');
        if (adminHeader) {
            adminHeader.textContent = `Панель администратора ресторана "${branches[0].name}"`;
        }
        
        // Сохраняем ID текущего филиала
        window.currentBranchId = branches[0].id;
        return;
    }
    
    // Если несколько филиалов, создаем селектор
    const adminHeader = document.querySelector('.admin-header .container');
    if (adminHeader) {
        const headerContent = `
            <div class="admin-header-content">
                <h1>Панель администратора ресторана</h1>
                <div class="branch-selector">
                    <label for="branch-select">Филиал:</label>
                    <select id="branch-select">
                        ${branches.map(branch => `<option value="${branch.id}">${branch.name}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
        
        adminHeader.innerHTML = headerContent;
        
        // Добавляем обработчик события изменения филиала
        const branchSelect = document.getElementById('branch-select');
        if (branchSelect) {
            branchSelect.addEventListener('change', function() {
                const branchId = this.value;
                window.currentBranchId = branchId;
                loadBookings(branchId);
            });
            
            // Сохраняем ID текущего филиала
            window.currentBranchId = branchSelect.value;
        }
    }
}

// Функция для загрузки броней филиала
function loadBookings(branchId) {
    // Получаем токен авторизации
    const authToken = localStorage.getItem('authToken');
    
    // Получаем значения фильтров
    const dateFilter = document.getElementById('booking-date-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    // Формируем URL с параметрами
    // Используем новый эндпоинт API для получения броней филиала, где пользователь является администратором
    let url = `http://127.0.0.1:8000/api/branch/${branchId}/bookings/`;
    
    // Добавляем параметры фильтрации, если они указаны
    let params = [];
    
    if (statusFilter && statusFilter !== 'all') {
        params.push(`status=${statusFilter}`);
    }
    
    // Добавляем параметры к URL, если они есть
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    
    // Показываем индикатор загрузки
    showLoading(true);
    
    // Отправляем запрос на получение броней
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при загрузке броней');
        }
        return response.json();
    })
    .then(data => {
        // Скрываем индикатор загрузки
        showLoading(false);
        
        // Отображаем брони
        // Проверяем структуру ответа - либо массив результатов, либо данные уже являются массивом
        const bookings = data.results || data;
        renderBookings(bookings);
        
        // Обновляем информацию о пагинации
        const totalCount = data.count || bookings.length;
        updatePagination(totalCount, bookings.length);
    })
    .catch(error => {
        console.error('Ошибка при загрузке броней:', error);
        showLoading(false);
        showNotification('Ошибка при загрузке броней', 'error');
    });
}

// Функция для отрисовки броней
function renderBookings(bookings) {
    const bookingsTable = document.querySelector('.bookings-table-body');
    
    if (!bookingsTable) return;
    
    // Очищаем таблицу
    bookingsTable.innerHTML = '';
    
    // Если нет броней, показываем сообщение
    if (!bookings || bookings.length === 0) {
        bookingsTable.innerHTML = `
            <div class="empty-bookings">
                <p>Нет броней, соответствующих выбранным критериям</p>
            </div>
        `;
        return;
    }
    
    // Отображаем брони
    bookings.forEach(booking => {
        const bookingRow = document.createElement('div');
        bookingRow.className = 'booking-row';
        bookingRow.setAttribute('data-id', booking.id);
        
        // Определяем статус брони
        let statusClass = '';
        let statusText = '';
        
        switch (booking.status) {
            case 'pending':
                statusClass = 'status-pending';
                statusText = 'Новое';
                break;
            case 'confirmed':
                statusClass = 'status-confirmed';
                statusText = 'Подтверждено';
                break;
            case 'completed':
                statusClass = 'status-completed';
                statusText = 'Завершено';
                break;
            case 'cancelled':
                statusClass = 'status-cancelled';
                statusText = 'Отменено';
                break;
            default:
                statusClass = 'status-pending';
                statusText = 'Новое';
        }
        
        // Формируем кнопки действий в зависимости от статуса
        let actionsHtml = '';
        
        if (booking.status === 'pending') {
            actionsHtml = `
                <button class="action-btn confirm-btn" title="Подтвердить"><i class="fas fa-check"></i></button>
                <button class="action-btn cancel-btn" title="Отменить"><i class="fas fa-times"></i></button>
                <button class="action-btn info-btn" title="Информация"><i class="fas fa-info-circle"></i></button>
            `;
        } else if (booking.status === 'confirmed') {
            actionsHtml = `
                <button class="action-btn cancel-btn" title="Отменить"><i class="fas fa-times"></i></button>
                <button class="action-btn info-btn" title="Информация"><i class="fas fa-info-circle"></i></button>
            `;
        } else {
            actionsHtml = `
                <button class="action-btn info-btn" title="Информация"><i class="fas fa-info-circle"></i></button>
            `;
        }
        
        // Форматируем дату и время
        const bookingDateTime = new Date(booking.booking_datetime);
        const formattedDate = bookingDateTime.toLocaleDateString('ru-RU');
        const formattedTime = bookingDateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        // Получаем информацию о пользователе из объекта user
        const userName = booking.user ? 
            `${booking.user.first_name} ${booking.user.last_name}` : 
            'Не указано';
        
        const userPhone = booking.user && booking.user.phone ? 
            booking.user.phone : 
            'Не указано';
        
        // Формируем номер бронирования
        const bookingNumber = booking.book_number || `#${booking.id}`;
        
        // Формируем строку таблицы
        bookingRow.innerHTML = `
            <div class="booking-column booking-number" data-label="Номер брони">${bookingNumber}</div>
            <div class="booking-column booking-name" data-label="Имя">${userName}</div>
            <div class="booking-column booking-phone" data-label="Телефон">${userPhone}</div>
            <div class="booking-column booking-datetime" data-label="Дата и время">${formattedDate}, ${formattedTime}</div>
            <div class="booking-column booking-table" data-label="Стол">${booking.table || 'Ожидает назначения'}</div>
            <div class="booking-column booking-guests" data-label="Гостей">${booking.guests_count || 0}</div>
            <div class="booking-column booking-status" data-label="Статус">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="booking-column booking-actions" data-label="Действия">
                ${actionsHtml}
            </div>
        `;
        
        bookingsTable.appendChild(bookingRow);
    });
}

// Функция для обновления информации о пагинации
function updatePagination(totalCount, currentCount) {
    const paginationSummary = document.querySelector('.bookings-summary p');
    
    if (paginationSummary) {
        paginationSummary.textContent = `Показано ${currentCount} из ${totalCount} бронирований`;
    }
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
        // Убираем установку текущей даты по умолчанию
        dateFilter.value = '';
        
        // Добавляем обработчик события изменения даты
        dateFilter.addEventListener('change', function() {
            filterBookings();
        });
    }
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
    // Если есть текущий филиал, загружаем его брони с новыми фильтрами
    if (window.currentBranchId) {
        loadBookings(window.currentBranchId);
    }
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
            const bookingId = bookingRow.getAttribute('data-id');
            
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
        // Получаем токен авторизации
        const authToken = localStorage.getItem('authToken');
        
        // Отправляем запрос на подтверждение бронирования
        fetch(`http://127.0.0.1:8000/api/bookings/confirm/${bookingId}/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при подтверждении бронирования');
            }
            return response.json();
        })
        .then(data => {
            // Обновляем статус брони в UI
            const statusBadge = bookingRow.querySelector('.status-badge');
            statusBadge.className = 'status-badge status-confirmed';
            statusBadge.textContent = 'Подтверждено';
            
            // Обновляем кнопки действий
            const actionsColumn = bookingRow.querySelector('.booking-actions');
            actionsColumn.innerHTML = `
                <button class="action-btn cancel-btn" title="Отменить"><i class="fas fa-times"></i></button>
                <button class="action-btn info-btn" title="Информация"><i class="fas fa-info-circle"></i></button>
            `;
            
            showNotification('Бронирование успешно подтверждено', 'success');
        })
        .catch(error => {
            console.error('Ошибка при подтверждении бронирования:', error);
            showNotification('Ошибка при подтверждении бронирования', 'error');
        });
    }
}

// Функция для отмены бронирования
function cancelBooking(bookingId, bookingRow) {
    if (confirm('Вы уверены, что хотите отменить бронирование ' + bookingId + '?')) {
        // Получаем токен авторизации
        const authToken = localStorage.getItem('authToken');
        
        // Отправляем запрос на отмену бронирования
        fetch(`http://127.0.0.1:8000/api/bookings/cancel/${bookingId}/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при отмене бронирования');
            }
            return response.json();
        })
        .then(data => {
            // Обновляем статус брони в UI
            const statusBadge = bookingRow.querySelector('.status-badge');
            statusBadge.className = 'status-badge status-cancelled';
            statusBadge.textContent = 'Отменено';
            
            // Обновляем кнопки действий
            const actionsColumn = bookingRow.querySelector('.booking-actions');
            actionsColumn.innerHTML = `
                <button class="action-btn info-btn" title="Информация"><i class="fas fa-info-circle"></i></button>
            `;
            
            showNotification('Бронирование отменено', 'success');
        })
        .catch(error => {
            console.error('Ошибка при отмене бронирования:', error);
            showNotification('Ошибка при отмене бронирования', 'error');
        });
    }
}

// Функция для отображения информации о бронировании
function showBookingInfo(bookingId) {
    // Получаем токен авторизации
    const authToken = localStorage.getItem('authToken');
    
    // Отправляем запрос на получение информации о бронировании
    fetch(`http://127.0.0.1:8000/api/bookings/${bookingId}/`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при получении информации о бронировании');
        }
        return response.json();
    })
    .then(data => {
        // Форматируем дату и время
        const bookingDateTime = new Date(data.booking_datetime);
        const formattedDate = bookingDateTime.toLocaleDateString('ru-RU');
        const formattedTime = bookingDateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        // Получаем информацию о пользователе
        const userName = data.user ? 
            `${data.user.first_name} ${data.user.last_name}` : 
            'Не указано';
        
        const userPhone = data.user && data.user.phone ? 
            data.user.phone : 
            'Не указано';
        
        const userEmail = data.user && data.user.email ? 
            data.user.email : 
            'Не указано';
        
        // Определяем статус брони
        let statusText = '';
        switch (data.status) {
            case 'pending':
                statusText = 'Ожидает подтверждения';
                break;
            case 'confirmed':
                statusText = 'Подтверждено';
                break;
            case 'completed':
                statusText = 'Завершено';
                break;
            case 'cancelled':
                statusText = 'Отменено';
                break;
            default:
                statusText = data.status;
        }
        
        // В реальном приложении здесь будет открытие модального окна с подробной информацией
        const bookingInfo = `
            Информация о бронировании #${data.book_number || data.id}
            
            Имя: ${userName}
            Телефон: ${userPhone}
            Email: ${userEmail}
            
            Дата и время: ${formattedDate}, ${formattedTime}
            Количество гостей: ${data.guests_count || 0}
            
            Статус: ${statusText}
            
            Комментарий: ${data.special_requests || 'Нет комментария'}
        `;
        
        alert(bookingInfo);
    })
    .catch(error => {
        console.error('Ошибка при получении информации о бронировании:', error);
        showNotification('Ошибка при получении информации о бронировании', 'error');
    });
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
            
            // В реальном приложении здесь будет запрос к API для получения данных для выбранной страницы
            // Пока просто имитируем загрузку
            showLoading(true);
            setTimeout(() => {
                if (window.currentBranchId) {
                    loadBookings(window.currentBranchId);
                }
            }, 500);
        });
    }
}

// Инициализация выпадающего меню пользователя
function initUserDropdown() {
    const userProfile = document.querySelector('.user-profile');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Получаем информацию о пользователе
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const isStaff = userData.is_staff === true;
    
    // Обновляем содержимое выпадающего меню для персонала
    if (isStaff && userProfile) {
        const userDropdown = userProfile.querySelector('.user-dropdown');
        if (userDropdown) {
            userDropdown.innerHTML = `
                <ul>
                    <li><a href="profile.html"><i class="fas fa-user"></i> Профиль</a></li>
                    <li><a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Выйти</a></li>
                </ul>
            `;
            
            // Получаем обновленную ссылку на кнопку выхода
            const newLogoutBtn = document.getElementById('logout-btn');
            if (newLogoutBtn) {
                newLogoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    logout();
                });
            }
        }
    }
    
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