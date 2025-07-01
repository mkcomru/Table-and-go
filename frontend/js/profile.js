document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, авторизован ли пользователь
    checkAuthStatus();
    
    // Инициализируем форму профиля
    initProfileForm();
    
    // Инициализируем модальное окно смены пароля
    initPasswordModal();
    
    // Инициализация плавной прокрутки к футеру
    initSmoothScroll();
});

// Функция для проверки статуса авторизации
function checkAuthStatus() {
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    // Если есть токен доступа, считаем пользователя авторизованным
    if (authToken) {
        console.log('Пользователь авторизован:', userData);
        
        // Обновляем интерфейс для авторизованного пользователя
        updateAuthUI(userData);
        
        // Загружаем данные пользователя
        loadUserProfile();
    } else {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        window.location.href = 'login.html?redirect=profile.html';
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
        <div class="user-dropdown">
            <ul>
                <li><a href="profile.html" class="active"><i class="fas fa-user"></i> Профиль</a></li>
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

// Функция для загрузки данных пользователя
async function loadUserProfile() {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            throw new Error('Пользователь не авторизован');
        }
        
        // Запрос к API для получения данных пользователя
        const response = await fetch('http://127.0.0.1:8000/auth/me/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при получении данных пользователя');
        }
        
        const userData = await response.json();
        
        // Сохраняем данные пользователя в localStorage
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // Заполняем форму профиля данными пользователя
        fillProfileForm(userData);
        
    } catch (error) {
        console.error('Ошибка при загрузке профиля пользователя:', error);
        showError('Не удалось загрузить данные профиля. Пожалуйста, попробуйте позже.');
    }
}

// Функция для заполнения формы профиля данными пользователя
function fillProfileForm(userData) {
    // Заполняем шапку профиля
    document.getElementById('user-avatar').src = userData.photo || 'assets/default-avatar.png';
    document.getElementById('profile-name').textContent = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || 'Пользователь';
    document.getElementById('profile-email').textContent = userData.email || '';
    
    // Если известна дата регистрации, отображаем её
    if (userData.date_joined) {
        const registrationDate = new Date(userData.date_joined);
        const month = registrationDate.toLocaleString('ru', { month: 'long' });
        const year = registrationDate.getFullYear();
        document.querySelector('.profile-date').textContent = `На сайте с ${month} ${year}`;
    }
    
    // Заполняем поля формы
    document.getElementById('first-name').value = userData.first_name || '';
    document.getElementById('last-name').value = userData.last_name || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('phone').value = userData.phone || '';
    
    // Устанавливаем чекбоксы уведомлений
    document.getElementById('email-notifications').checked = userData.email_notifications !== false;
    document.getElementById('sms-notifications').checked = userData.sms_notifications !== false;
    document.getElementById('promo-notifications').checked = userData.promo_notifications === true;
    
    // Если известна дата последнего изменения пароля, отображаем её
    if (userData.last_password_change) {
        const passwordChangeDate = new Date(userData.last_password_change);
        const day = passwordChangeDate.getDate();
        const month = passwordChangeDate.toLocaleString('ru', { month: 'long' });
        const year = passwordChangeDate.getFullYear();
        document.querySelector('.password-date').textContent = `Последнее изменение: ${day} ${month} ${year}`;
    }
}

// Функция для инициализации формы профиля
function initProfileForm() {
    const profileForm = document.getElementById('profile-form');
    const cancelBtn = document.getElementById('cancel-btn');
    
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateProfile();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            // Перезагружаем страницу для отмены изменений
            window.location.reload();
        });
    }
}

// Функция для обновления профиля пользователя
async function updateProfile() {
    try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            throw new Error('Пользователь не авторизован');
        }
        
        // Собираем данные из формы
        const formData = {
            first_name: document.getElementById('first-name').value,
            last_name: document.getElementById('last-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            email_notifications: document.getElementById('email-notifications').checked,
            sms_notifications: document.getElementById('sms-notifications').checked,
            promo_notifications: document.getElementById('promo-notifications').checked
        };
        
        // Отправляем запрос на обновление профиля
        const response = await fetch('http://127.0.0.1:8000/auth/update/', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при обновлении профиля');
        }
        
        const updatedUserData = await response.json();
        
        // Обновляем данные в localStorage
        localStorage.setItem('user_data', JSON.stringify(updatedUserData));
        
        // Также обновляем имя и фамилию в JWT токене, если это возможно
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    // Обновляем данные в токене (хотя это не изменит сам токен)
                    payload.first_name = updatedUserData.first_name;
                    payload.last_name = updatedUserData.last_name;
                }
            } catch (e) {
                console.error('Ошибка при обновлении данных в токене:', e);
            }
        }
        
        // Обновляем интерфейс
        updateAuthUI(updatedUserData);
        
        // Показываем уведомление об успехе
        showNotification('Профиль успешно обновлен', 'success');
        
    } catch (error) {
        console.error('Ошибка при обновлении профиля:', error);
        showError(error.message || 'Не удалось обновить профиль. Пожалуйста, попробуйте позже.');
    }
}

// Функция для инициализации модального окна смены пароля
function initPasswordModal() {
    const changePasswordBtn = document.getElementById('change-password-btn');
    const passwordModal = document.getElementById('password-modal');
    const closeModalBtn = passwordModal?.querySelector('.modal-close');
    const cancelModalBtn = passwordModal?.querySelector('.modal-cancel');
    const savePasswordBtn = document.getElementById('save-password-btn');
    
    // Открытие модального окна
    if (changePasswordBtn && passwordModal) {
        changePasswordBtn.addEventListener('click', function() {
            passwordModal.classList.add('show');
            document.body.classList.add('modal-open');
        });
    }
    
    // Закрытие модального окна
    const closeModal = () => {
        if (passwordModal) {
            passwordModal.classList.remove('show');
            document.body.classList.remove('modal-open');
            document.getElementById('password-form').reset();
        }
    };
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', closeModal);
    }
    
    if (passwordModal) {
        passwordModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
    
    // Сохранение нового пароля
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', function() {
            changePassword();
        });
    }
    
    // Добавляем ссылку на восстановление пароля
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
            window.location.href = 'reset-password.html';
        });
    }
}

// Функция для смены пароля
async function changePassword() {
    try {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Проверяем, что все поля заполнены
        if (!currentPassword || !newPassword || !confirmPassword) {
            showError('Пожалуйста, заполните все поля');
            return;
        }
        
        // Проверяем, что новые пароли совпадают
        if (newPassword !== confirmPassword) {
            showError('Новый пароль и подтверждение не совпадают');
            return;
        }
        
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
            throw new Error('Пользователь не авторизован');
        }
        
        // Отправляем запрос на смену пароля
        const response = await fetch('http://127.0.0.1:8000/auth/change-password/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при смене пароля');
        }
        
        // Закрываем модальное окно
        const passwordModal = document.getElementById('password-modal');
        passwordModal.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        // Очищаем форму
        document.getElementById('password-form').reset();
        
        // Обновляем дату последнего изменения пароля
        const now = new Date();
        const day = now.getDate();
        const month = now.toLocaleString('ru', { month: 'long' });
        const year = now.getFullYear();
        document.querySelector('.password-date').textContent = `Последнее изменение: ${day} ${month} ${year}`;
        
        // Показываем уведомление об успехе
        showNotification('Пароль успешно изменен', 'success');
        
        // Обновляем данные пользователя
        loadUserProfile();
        
    } catch (error) {
        console.error('Ошибка при смене пароля:', error);
        showError(error.message || 'Не удалось изменить пароль. Пожалуйста, проверьте правильность текущего пароля.');
    }
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
}

// Функция для отображения ошибки
function showError(message) {
    const container = document.querySelector('.profile-container');
    
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
    });
    
    // Автоматически скрываем ошибку через 5 секунд
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
        }
    }, 5000);
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