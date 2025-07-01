document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, авторизован ли пользователь и какая у него роль
    checkUserRole();
    
    // Инициализируем обработчики событий и загружаем данные профиля
    initProfilePage();
});

// Функция для проверки роли пользователя
function checkUserRole() {
    // Получаем данные пользователя из localStorage
    const userDataStr = localStorage.getItem('user_data');
    if (!userDataStr) {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        window.location.href = 'login.html?redirect=profile.html';
        return;
    }
    
    try {
        // Парсим данные пользователя
        const userData = JSON.parse(userDataStr);
        
        // Проверяем, является ли пользователь персоналом
        const isStaff = userData.is_staff === true;
        const isAdmin = userData.is_superuser === true || userData.is_system_admin === true;
        
        // Если пользователь является персоналом, но не администратором
        if (isStaff && !isAdmin) {
            // Перенаправляем на страницу администратора ресторана
            window.location.href = 'profile-restaurant.html';
            return;
        }
    } catch (error) {
        console.error('Ошибка при проверке роли пользователя:', error);
    }
}

// Функция для инициализации страницы профиля
function initProfilePage() {
    // Загружаем данные профиля с сервера или из localStorage
    loadProfileData();
    
    // Инициализируем модальное окно для смены пароля
    initPasswordModal();
    
    // Инициализируем форму профиля
    initProfileForm();
}

// Функция для загрузки данных профиля
function loadProfileData() {
    // Получаем данные пользователя из localStorage
    const userDataStr = localStorage.getItem('user_data');
    if (!userDataStr) return;
    
    try {
        const userData = JSON.parse(userDataStr);
        
        // Заполняем поля формы
        document.getElementById('first-name').value = userData.first_name || '';
        document.getElementById('last-name').value = userData.last_name || '';
        document.getElementById('email').value = userData.email || '';
        document.getElementById('phone').value = userData.phone || '';
        
        // Обновляем имя и email в шапке профиля
        const profileName = document.getElementById('profile-name');
        if (profileName) {
            let displayName = '';
            if (userData.first_name && userData.last_name) {
                displayName = `${userData.first_name} ${userData.last_name}`;
            } else if (userData.first_name) {
                displayName = userData.first_name;
            } else if (userData.username) {
                displayName = userData.username;
            } else {
                displayName = 'Пользователь';
            }
            profileName.textContent = displayName;
        }
        
        const profileEmail = document.getElementById('profile-email');
        if (profileEmail && userData.email) {
            profileEmail.textContent = userData.email;
        }
        
        // Обновляем информацию о пользователе в шапке сайта
        updateHeaderUserInfo(userData);
    } catch (error) {
        console.error('Ошибка при загрузке данных профиля:', error);
    }
}

// Обновление информации о пользователе в шапке сайта
function updateHeaderUserInfo(userData) {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;
    
    // Очищаем текущее содержимое
    headerRight.innerHTML = '';
    
    // Создаем элемент профиля пользователя
    const userProfile = document.createElement('div');
    userProfile.className = 'user-profile';
    
    let displayName = '';
    if (userData.first_name && userData.last_name) {
        displayName = `${userData.first_name} ${userData.last_name}`;
    } else if (userData.first_name) {
        displayName = userData.first_name;
    } else if (userData.username) {
        displayName = userData.username;
    } else {
        displayName = 'Пользователь';
    }
    
    userProfile.innerHTML = `
        <div class="user-avatar">
            <img src="assets/default-avatar.png" alt="Аватар" class="avatar-image">
        </div>
        <div class="user-info">
            <span class="user-name">${displayName}</span>
            <i class="fas fa-chevron-down"></i>
        </div>
        <div class="user-dropdown">
            <ul>
                <li><a href="profile.html"><i class="fas fa-user"></i> Профиль</a></li>
                <li><a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Выйти</a></li>
            </ul>
        </div>
    `;
    
    headerRight.appendChild(userProfile);
    
    // Инициализируем выпадающее меню пользователя
    initUserDropdown();
}

// Инициализация выпадающего меню пользователя
function initUserDropdown() {
    const userProfile = document.querySelector('.user-profile');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (userProfile) {
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
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

// Функция для инициализации модального окна смены пароля
function initPasswordModal() {
    const changePasswordBtn = document.getElementById('change-password-btn');
    const passwordModal = document.getElementById('password-modal');
    const closeBtn = passwordModal?.querySelector('.modal-close');
    const cancelBtn = passwordModal?.querySelector('.modal-cancel');
    const savePasswordBtn = document.getElementById('save-password-btn');
    
    if (changePasswordBtn && passwordModal) {
        // Открываем модальное окно при клике на кнопку
        changePasswordBtn.addEventListener('click', function() {
            passwordModal.style.display = 'block';
        });
        
        // Закрываем модальное окно при клике на крестик
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                passwordModal.style.display = 'none';
            });
        }
        
        // Закрываем модальное окно при клике на кнопку отмены
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                passwordModal.style.display = 'none';
            });
        }
        
        // Закрываем модальное окно при клике вне его
        window.addEventListener('click', function(e) {
            if (e.target === passwordModal) {
                passwordModal.style.display = 'none';
            }
        });
        
        // Обрабатываем сохранение пароля
        if (savePasswordBtn) {
            savePasswordBtn.addEventListener('click', function() {
                const currentPassword = document.getElementById('current-password').value;
                const newPassword = document.getElementById('new-password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                
                if (!currentPassword || !newPassword || !confirmPassword) {
                    alert('Пожалуйста, заполните все поля');
                    return;
                }
                
                if (newPassword !== confirmPassword) {
                    alert('Новый пароль и подтверждение не совпадают');
                    return;
                }
                
                // Отправляем запрос на смену пароля
                changePassword(currentPassword, newPassword);
            });
        }
    }
}

// Функция для инициализации формы профиля
function initProfileForm() {
    const profileForm = document.getElementById('profile-form');
    const cancelBtn = document.getElementById('cancel-btn');
    
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Получаем данные формы
            const formData = {
                first_name: document.getElementById('first-name').value,
                last_name: document.getElementById('last-name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value
            };
            
            // Отправляем запрос на обновление профиля
            updateProfile(formData);
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            // Перезагружаем данные профиля
            loadProfileData();
        });
    }
}

// Функция для обновления профиля
function updateProfile(formData) {
    // Получаем токен авторизации
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    
    // Отправляем запрос на обновление профиля
    fetch('http://127.0.0.1:8000/auth/update-profile/', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при обновлении профиля');
        }
        return response.json();
    })
    .then(data => {
        // Обновляем данные пользователя в localStorage
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        Object.assign(userData, formData);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // Показываем уведомление об успешном обновлении
        showNotification('Профиль успешно обновлен', 'success');
        
        // Обновляем данные на странице
        loadProfileData();
    })
    .catch(error => {
        console.error('Ошибка при обновлении профиля:', error);
        showNotification('Ошибка при обновлении профиля', 'error');
    });
}

// Функция для смены пароля
function changePassword(currentPassword, newPassword) {
    // Получаем токен авторизации
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    
    // Отправляем запрос на смену пароля
    fetch('http://127.0.0.1:8000/auth/change-password/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при смене пароля');
        }
        return response.json();
    })
    .then(data => {
        // Закрываем модальное окно
        const passwordModal = document.getElementById('password-modal');
        if (passwordModal) {
            passwordModal.style.display = 'none';
        }
        
        // Очищаем поля формы
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        
        // Показываем уведомление об успешной смене пароля
        showNotification('Пароль успешно изменен', 'success');
    })
    .catch(error => {
        console.error('Ошибка при смене пароля:', error);
        showNotification('Ошибка при смене пароля', 'error');
    });
}

// Функция для отображения уведомлений
function showNotification(message, type = 'success') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Добавляем уведомление на страницу
    document.body.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Скрываем и удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
} 