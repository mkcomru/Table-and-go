document.addEventListener('DOMContentLoaded', async function() {
    // Сначала получаем свежие данные с сервера
    await refreshUserData();
    
    // Затем проверяем авторизацию
    checkAuth();
    
    // Инициализируем страницу отзывов
    initReviewsPage();
});

// Глобальные переменные
let currentPage = 1;
let totalPages = 1;
let reviewsData = [];
let filteredReviews = [];

// Функция для проверки авторизации
function checkAuth() {
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    // Если есть токен доступа, считаем пользователя авторизованным
    if (authToken) {
        console.log('Пользователь авторизован:', userData);
        
        // Обновляем интерфейс для авторизованного пользователя
        updateAuthUI(userData);
    } else {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        window.location.href = 'login.html?redirect=my-reviews.html';
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
        const userJson = localStorage.getItem('user_data');
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
    `;
    
    // Проверяем, является ли пользователь суперпользователем или системным администратором
    const isAdmin = userData.is_superuser === true || userData.is_system_admin === true;
    
    // Создаем выпадающее меню
    const userDropdown = document.createElement('div');
    userDropdown.className = 'user-dropdown';
    
    // Формируем HTML для выпадающего меню
    let dropdownHtml = `
        <ul>
            <li><a href="profile.html"><i class="fas fa-user"></i> Профиль</a></li>
            <li><a href="my-bookings.html"><i class="fas fa-calendar-alt"></i> Мои брони</a></li>
            <li><a href="my-reviews.html" class="active"><i class="fas fa-star"></i> Мои отзывы</a></li>
    `;
    
    // Добавляем ссылку на админ-панель только для администраторов
    if (isAdmin) {
        dropdownHtml += `
            <li><a href="http://127.0.0.1:8000/admin" target="_blank"><i class="fas fa-tools"></i> Админ-панель</a></li>
        `;
    }
    
    // Добавляем кнопку выхода
    dropdownHtml += `
            <li><a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Выйти</a></li>
        </ul>
    `;
    
    userDropdown.innerHTML = dropdownHtml;
    
    userProfileElement.appendChild(userDropdown);
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

// Функция для обновления данных пользователя
async function refreshUserData() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    
    try {
        const response = await fetch('http://127.0.0.1:8000/auth/me/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            localStorage.setItem('user_data', JSON.stringify(userData));
        }
    } catch (error) {
        console.error('Ошибка при обновлении данных пользователя:', error);
    }
}

// Инициализация страницы отзывов
function initReviewsPage() {
    // Проверяем авторизацию
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }
    
    // Загружаем отзывы пользователя
    loadUserReviews();
    
    // Инициализируем поиск
    const searchInput = document.getElementById('search-reviews');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterReviews();
        });
    }
    
    // Инициализируем фильтр по датам
    const filterSelect = document.getElementById('filter-reviews');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            filterReviews();
        });
    }
    
    // Инициализируем модальное окно для редактирования отзыва
    initEditReviewModal();
}

// Загрузка отзывов пользователя
async function loadUserReviews() {
    const authToken = localStorage.getItem('authToken');
    
    try {
        const response = await fetch('http://127.0.0.1:8000/api/reviews/user/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при загрузке отзывов');
        }
        
        const data = await response.json();
        reviewsData = data.results || data;
        
        // Отладочная информация
        console.log('Загруженные отзывы:', reviewsData);
        
        totalPages = Math.ceil(reviewsData.length / 5); // 5 отзывов на страницу
        
        // Применяем текущие фильтры
        filterReviews();
        
    } catch (error) {
        console.error('Ошибка при загрузке отзывов:', error);
        showNotification('Ошибка при загрузке отзывов', 'error');
        
        // Скрываем индикатор загрузки и показываем сообщение об ошибке
        document.querySelector('.loader').style.display = 'none';
        const emptyMessage = document.getElementById('empty-reviews');
        if (emptyMessage) {
            emptyMessage.querySelector('p').textContent = 'Не удалось загрузить отзывы';
            emptyMessage.style.display = 'block';
        }
    }
}

// Фильтрация отзывов по поиску и дате
function filterReviews() {
    const searchQuery = document.getElementById('search-reviews').value.toLowerCase();
    const dateFilter = document.getElementById('filter-reviews').value;
    
    // Фильтруем отзывы
    filteredReviews = reviewsData.filter(review => {
        // Фильтр по поиску (название ресторана)
        const matchesSearch = review.branch_name.toLowerCase().includes(searchQuery);
        
        // Фильтр по дате
        let matchesDate = true;
        if (dateFilter !== 'all') {
            const reviewDate = new Date(review.created_at);
            const now = new Date();
            let compareDate;
            
            switch (dateFilter) {
                case 'month':
                    compareDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case '3months':
                    compareDate = new Date(now.setMonth(now.getMonth() - 3));
                    break;
                case 'year':
                    compareDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
            }
            
            matchesDate = reviewDate >= compareDate;
        }
        
        return matchesSearch && matchesDate;
    });
    
    // Обновляем общее количество страниц
    totalPages = Math.ceil(filteredReviews.length / 5);
    
    // Сбрасываем текущую страницу
    currentPage = 1;
    
    // Отображаем отфильтрованные отзывы
    renderReviews();
}

// Отрисовка отзывов на странице
function renderReviews() {
    const container = document.getElementById('reviews-container');
    const emptyMessage = document.getElementById('empty-reviews');
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Если отзывов нет, показываем сообщение
    if (filteredReviews.length === 0) {
        emptyMessage.style.display = 'block';
        renderPagination();
        return;
    }
    
    // Скрываем сообщение о пустом списке
    emptyMessage.style.display = 'none';
    
    // Определяем отзывы для текущей страницы
    const startIndex = (currentPage - 1) * 5;
    const endIndex = Math.min(startIndex + 5, filteredReviews.length);
    const currentReviews = filteredReviews.slice(startIndex, endIndex);
    
    // Отрисовываем каждый отзыв
    currentReviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        reviewCard.setAttribute('data-id', review.id);
        
        // Формируем звезды рейтинга
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= review.rating) {
                starsHTML += '<i class="fas fa-star star"></i>';
            } else {
                starsHTML += '<i class="far fa-star star"></i>';
            }
        }
        
        // Форматируем дату
        const reviewDate = new Date(review.created_at);
        const formattedDate = reviewDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        // Отладочная информация для проверки значения is_approved
        console.log(`Отзыв ${review.id} для ${review.branch_name}:`, {
            is_approved: review.is_approved,
            type: typeof review.is_approved
        });
        
        // Определяем статус публикации (проверяем все возможные варианты поля)
        let isApproved = false;
        if (review.is_approved === true || review.is_approved === 'true' || review.is_approved === 1) {
            isApproved = true;
        }
        
        const statusClass = isApproved ? 'published' : 'pending';
        const statusText = isApproved ? 'Опубликован' : 'Ожидает публикации';
        
        // Создаем HTML для карточки отзыва в новом дизайне
        reviewCard.innerHTML = `
            <img src="${review.branch_image || 'assets/default-restaurant.jpg'}" alt="${review.branch_name}" class="review-image">
            <div class="review-content">
                <div class="review-header">
                    <div class="review-title-container">
                        <h3 class="review-restaurant-name">${review.branch_name}</h3>
                        <span class="review-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="review-edit" data-id="${review.id}">
                        <i class="fas fa-pen"></i> Редактировать отзыв
                    </div>
                </div>
                
                <div class="review-date">${formattedDate}</div>
                
                <div class="review-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${review.branch_address || 'Адрес не указан'}</span>
                </div>
                
                <div class="review-rating">
                    ${starsHTML}
                </div>
                
                <div class="review-text">
                    ${review.text}
                </div>
            </div>
        `;
        
        container.appendChild(reviewCard);
        
        // Добавляем обработчик события для кнопки редактирования
        const editBtn = reviewCard.querySelector('.review-edit');
        
        editBtn.addEventListener('click', function() {
            openEditReviewModal(review);
        });
    });
    
    // Отрисовываем пагинацию
    renderPagination();
}

// Отрисовка пагинации
function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) {
        return;
    }
    
    // Кнопка "Предыдущая"
    const prevBtn = document.createElement('button');
    prevBtn.className = `pagination-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderReviews();
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // Номера страниц
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', function() {
            currentPage = i;
            renderReviews();
        });
        paginationContainer.appendChild(pageBtn);
    }
    
    // Кнопка "Следующая"
    const nextBtn = document.createElement('button');
    nextBtn.className = `pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            renderReviews();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// Инициализация модального окна для редактирования отзыва
function initEditReviewModal() {
    // Создаем модальное окно, если его еще нет
    if (!document.getElementById('edit-review-modal')) {
        const modalHTML = `
            <div class="modal" id="edit-review-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Редактирование отзыва</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-review-form">
                            <input type="hidden" id="review-id">
                            <div class="form-group">
                                <label for="review-rating">Оценка</label>
                                <div class="star-rating" id="edit-star-rating">
                                    <i class="far fa-star star" data-rating="1"></i>
                                    <i class="far fa-star star" data-rating="2"></i>
                                    <i class="far fa-star star" data-rating="3"></i>
                                    <i class="far fa-star star" data-rating="4"></i>
                                    <i class="far fa-star star" data-rating="5"></i>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="review-text">Текст отзыва</label>
                                <textarea id="review-text" class="form-control" rows="5" required></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-cancel">Отмена</button>
                        <button class="btn btn-primary" id="save-review-btn">Сохранить</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Добавляем обработчики для модального окна
        const modal = document.getElementById('edit-review-modal');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const saveBtn = document.getElementById('save-review-btn');
        const stars = modal.querySelectorAll('.star');
        
        // Закрытие модального окна
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('show');
        });
        
        cancelBtn.addEventListener('click', function() {
            modal.classList.remove('show');
        });
        
        // Обработка клика по звездам
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                updateStarRating(rating);
            });
        });
        
        // Сохранение отзыва
        saveBtn.addEventListener('click', function() {
            saveReview();
        });
    }
}

// Открытие модального окна для редактирования отзыва
function openEditReviewModal(review) {
    const modal = document.getElementById('edit-review-modal');
    const reviewIdInput = document.getElementById('review-id');
    const reviewTextInput = document.getElementById('review-text');
    
    // Заполняем форму данными отзыва
    reviewIdInput.value = review.id;
    reviewTextInput.value = review.text;
    
    // Устанавливаем рейтинг
    updateStarRating(review.rating);
    
    // Показываем модальное окно
    modal.classList.add('show');
}

// Обновление отображения звезд рейтинга
function updateStarRating(rating) {
    const stars = document.querySelectorAll('#edit-star-rating .star');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star star active';
        } else {
            star.className = 'far fa-star star';
        }
    });
}

// Сохранение отредактированного отзыва
async function saveReview() {
    const reviewId = document.getElementById('review-id').value;
    const reviewText = document.getElementById('review-text').value;
    const activeStars = document.querySelectorAll('#edit-star-rating .star.active').length;
    
    if (!reviewText.trim()) {
        showNotification('Пожалуйста, введите текст отзыва', 'error');
        return;
    }
    
    if (activeStars === 0) {
        showNotification('Пожалуйста, поставьте оценку', 'error');
        return;
    }
    
    const authToken = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/reviews/${reviewId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: reviewText,
                rating: activeStars
            })
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при обновлении отзыва');
        }
        
        // Закрываем модальное окно
        document.getElementById('edit-review-modal').classList.remove('show');
        
        // Обновляем данные отзыва в массиве
        const updatedReview = await response.json();
        const index = reviewsData.findIndex(review => review.id === parseInt(reviewId));
        
        if (index !== -1) {
            reviewsData[index] = { ...reviewsData[index], ...updatedReview };
        }
        
        // Обновляем отображение
        filterReviews();
        
        showNotification('Отзыв успешно обновлен', 'success');
        
    } catch (error) {
        console.error('Ошибка при обновлении отзыва:', error);
        showNotification('Ошибка при обновлении отзыва', 'error');
    }
}

// Удаление отзыва
async function deleteReview(reviewId) {
    const authToken = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/reviews/${reviewId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при удалении отзыва');
        }
        
        // Удаляем отзыв из массива
        reviewsData = reviewsData.filter(review => review.id !== reviewId);
        
        // Обновляем отображение
        filterReviews();
        
        showNotification('Отзыв успешно удален', 'success');
        
    } catch (error) {
        console.error('Ошибка при удалении отзыва:', error);
        showNotification('Ошибка при удалении отзыва', 'error');
    }
}

// Показ уведомления
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