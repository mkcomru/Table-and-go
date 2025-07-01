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
            // Добавляем класс staff-only к body для стилизации
            document.body.classList.add('staff-only');
            
            // Скрываем ненужные элементы
            hideElementsForStaff();
            
            // Добавляем кнопку возврата
            addBackButton();
            
            // Изменяем заголовок
            updateTitleForStaff();
        }
    } catch (error) {
        console.error('Ошибка при проверке роли пользователя:', error);
    }
}

// Функция для скрытия элементов для персонала
function hideElementsForStaff() {
    // Скрываем навигацию
    const mainNav = document.querySelector('.main-nav');
    if (mainNav) {
        mainNav.style.display = 'none';
    }
    
    // Скрываем разделы формы, которые не нужны персоналу
    // Оставляем только основную информацию
    const sectionsToHide = document.querySelectorAll('.form-section.notification-section, .form-section.security-section');
    sectionsToHide.forEach(section => {
        section.style.display = 'none';
    });
    
    // Скрываем выбор города
    const citySelector = document.querySelector('.city-selector');
    if (citySelector) {
        citySelector.style.display = 'none';
    }
    
    // Скрываем футер (или оставляем только копирайт)
    const footerColumns = document.querySelector('.footer-columns');
    if (footerColumns) {
        footerColumns.style.display = 'none';
    }
}

// Функция для добавления кнопки возврата
function addBackButton() {
    const headerRight = document.querySelector('.header-right');
    
    if (headerRight) {
        // Создаем кнопку возврата на панель администратора
        const backButton = document.createElement('a');
        backButton.href = 'admin-panel.html';
        backButton.className = 'btn btn-primary back-to-admin';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Вернуться к панели';
        
        // Добавляем кнопку в начало блока
        if (headerRight.firstChild) {
            headerRight.insertBefore(backButton, headerRight.firstChild);
        } else {
            headerRight.appendChild(backButton);
        }
    }
}

// Функция для изменения заголовка
function updateTitleForStaff() {
    const title = document.querySelector('.profile-title');
    if (title) {
        title.textContent = 'Профиль сотрудника ресторана';
    }
    
    const subtitle = document.querySelector('.profile-subtitle');
    if (subtitle) {
        subtitle.textContent = 'Ваши личные данные';
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
    } catch (error) {
        console.error('Ошибка при загрузке данных профиля:', error);
    }
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
        alert('Профиль успешно обновлен');
        
        // Обновляем данные на странице
        loadProfileData();
    })
    .catch(error => {
        console.error('Ошибка при обновлении профиля:', error);
        alert('Ошибка при обновлении профиля: ' + error.message);
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
        alert('Пароль успешно изменен');
    })
    .catch(error => {
        console.error('Ошибка при смене пароля:', error);
        alert('Ошибка при смене пароля: ' + error.message);
    });
} 