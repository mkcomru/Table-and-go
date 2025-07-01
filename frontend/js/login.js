document.addEventListener('DOMContentLoaded', async function() {
    // Сначала получаем свежие данные с сервера
    await refreshUserData();
    
    // Затем проверяем авторизацию и обновляем UI
    checkAuth();
});

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Получаем данные формы
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Проверяем заполнение полей
        if (!username || !password) {
            showError('Пожалуйста, заполните все поля');
            return;
        }
        
        // Отправляем запрос на авторизацию
        login(username, password);
    });
}

// Функция для авторизации
function login(username, password) {
    const apiUrl = 'http://127.0.0.1:8000/auth/login/';
    
    // Показываем индикатор загрузки
    showLoading(true);
    
    // Определяем, что ввел пользователь: email или имя пользователя
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
    
    // Формируем данные для отправки в зависимости от типа ввода
    let loginData;
    if (isEmail) {
        loginData = {
            email: username,
            password: password
        };
    } else {
        loginData = {
            username: username,
            password: password
        };
    }
    
    // Отладочная информация
    console.log('Отправляемые данные:', loginData);
    
    // Отправляем запрос
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    })
    .then(response => {
        // Скрываем индикатор загрузки
        showLoading(false);
        
        // Отладочная информация
        console.log('Статус ответа:', response.status);
        
        if (!response.ok) {
            // Если ответ не 2xx, обрабатываем ошибку
            return response.json().then(data => {
                console.log('Ошибка от сервера:', data);
                throw new Error(data.detail || 'Ошибка авторизации');
            }).catch(err => {
                if (err instanceof SyntaxError) {
                    // Если ответ не в формате JSON
                    throw new Error('Ошибка авторизации: неверные учетные данные');
                }
                throw err;
            });
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Успешная авторизация:', data);
        
        // Сохраняем токен в localStorage
        if (data.access) {
            localStorage.setItem('authToken', data.access);
        } else if (data.token) {
            // Альтернативное имя поля для токена
            localStorage.setItem('authToken', data.token);
        }
        
        // Сохраняем информацию о пользователе
        let userData = {};
        
        // Проверяем, откуда получить информацию о пользователе
        if (data.user) {
            // Если информация о пользователе в поле user
            userData = data.user;
        } else {
            // Пробуем извлечь информацию из токена JWT
            try {
                const token = data.access || data.token;
                if (token) {
                    const tokenParts = token.split('.');
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        // Копируем нужные поля из payload токена
                        if (payload.first_name) userData.first_name = payload.first_name;
                        if (payload.last_name) userData.last_name = payload.last_name;
                        if (payload.email) userData.email = payload.email;
                        if (payload.username) userData.username = payload.username;
                        if (payload.phone) userData.phone = payload.phone;
                        if (payload.is_staff) userData.is_staff = payload.is_staff;
                        if (payload.is_superuser) userData.is_superuser = payload.is_superuser;
                        if (payload.is_system_admin) userData.is_system_admin = payload.is_system_admin;
                        if (payload.is_branch_admin) userData.is_branch_admin = payload.is_branch_admin;
                        if (payload.administered_branch_ids) userData.administered_branch_ids = payload.administered_branch_ids;
                    }
                }
            } catch (e) {
                console.error('Ошибка при декодировании токена:', e);
            }
        }
        
        // Сохраняем данные пользователя
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // Перенаправляем пользователя в зависимости от его роли
        redirectBasedOnRole(userData);
    })
    .catch(error => {
        console.error('Ошибка:', error);
        
        // Показываем сообщение об ошибке
        let errorMessage = 'Произошла ошибка при авторизации';
        
        if (error.message) {
            if (error.message.includes('credentials') || 
                error.message.includes('username') || 
                error.message.includes('password')) {
                errorMessage = 'Неверное имя пользователя или пароль';
            } else if (error.message.includes('locked')) {
                errorMessage = 'Аккаунт временно заблокирован из-за слишком большого количества попыток входа';
            } else {
                errorMessage = error.message;
            }
        }
        
        showError(errorMessage);
    });
}

// Функция для перенаправления пользователя в зависимости от его роли
function redirectBasedOnRole(userData) {
    // Получаем URL для перенаправления из параметров запроса (если есть)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    
    // Проверяем, является ли пользователь суперпользователем или системным администратором
    const isAdmin = userData.is_superuser === true || userData.is_system_admin === true;
    
    // Если пользователь является персоналом ресторана (is_staff=True) и не является админом
    if (userData.is_staff === true && !isAdmin) {
        // Для персонала разрешаем только admin-panel.html и profile.html
        if (redirectUrl && 
            (redirectUrl.includes('admin-panel.html') || redirectUrl.includes('profile.html'))) {
            window.location.href = redirectUrl;
        } else {
            // В противном случае всегда перенаправляем на панель администратора ресторана
            window.location.href = 'admin-panel.html';
        }
    } else {
        // Для обычных пользователей, суперпользователей и системных администраторов
        // Перенаправляем на указанную страницу или на главную страницу
        window.location.href = redirectUrl || 'index.html';
    }
}

// Функция для проверки авторизации
function checkAuth() {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        // Сначала проверяем локально
        try {
            // Проверяем формат токена JWT
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                // Если токен не в формате JWT, удаляем его
                localStorage.removeItem('authToken');
                localStorage.removeItem('user_data');
                updateAuthUI(false);
                return;
            }
            
            // Декодируем payload токена
            const payload = JSON.parse(atob(tokenParts[1]));
            
            // Проверяем срок действия токена
            const expTime = payload.exp * 1000; // exp в секундах, преобразуем в миллисекунды
            
            if (expTime < Date.now()) {
                // Если токен истек, удаляем его
                console.log('Токен истек');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user_data');
                updateAuthUI(false);
                return;
            }
            
            // Получаем информацию о пользователе из localStorage
            const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
            
            // Если пользователь является персоналом ресторана (is_staff=True)
            const isStaff = userData.is_staff === true;
            const isAdmin = userData.is_superuser === true || userData.is_system_admin === true;
            
            // Если это персонал на странице профиля - скрываем ненужные элементы навигации
            if (isStaff && !isAdmin && window.location.pathname.includes('profile.html')) {
                // Скрываем ненужные элементы в хедере
                hideNavElementsForStaff();
            }
            
            // Проверка перенаправления для персонала (не администраторов)
            if (isStaff && !isAdmin && 
                !window.location.pathname.includes('admin-panel.html') && 
                !window.location.pathname.includes('profile.html')) {
                window.location.href = 'admin-panel.html';
                return;
            }
            
            // Если пользователь не является персоналом и не является админом, но пытается зайти на admin-panel.html,
            // перенаправляем его на главную страницу
            if (!isStaff && !isAdmin && window.location.pathname.includes('admin-panel.html')) {
                window.location.href = 'index.html';
                return;
            }
            
            // Если локальная проверка прошла успешно, проверяем на сервере
            fetch('http://127.0.0.1:8000/auth/verify/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: token })
            })
            .then(response => {
                if (response.ok) {
                    // Если токен валидный, обновляем UI
                    updateAuthUI(true);
                    
                    // Если это страница входа и пользователь уже авторизован, перенаправляем в зависимости от роли
                    if (window.location.pathname.includes('login.html')) {
                        redirectBasedOnRole(userData);
                    }
                } else {
                    // Если токен невалидный, удаляем его
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user_data');
                    updateAuthUI(false);
                }
            })
            .catch(error => {
                console.error('Ошибка при проверке токена на сервере:', error);
                // В случае ошибки сети считаем токен действительным, так как локальная проверка прошла успешно
                updateAuthUI(true);
            });
        } catch (error) {
            console.error('Ошибка при проверке токена:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user_data');
            updateAuthUI(false);
        }
    } else {
        updateAuthUI(false);
    }
}

// Функция для скрытия ненужных элементов навигации для персонала
function hideNavElementsForStaff() {
    // Скрываем все элементы навигации в хедере
    const headerNav = document.querySelector('.header-nav');
    if (headerNav) {
        headerNav.style.display = 'none';
    }
    
    // Скрываем блок "Сотрудничество", если он есть
    const cooperationBlock = document.querySelector('.cooperation');
    if (cooperationBlock) {
        cooperationBlock.style.display = 'none';
    }
    
    // Скрываем блок "Мои брони", если он есть
    const myBookingsBlock = document.querySelector('.my-bookings-section');
    if (myBookingsBlock) {
        myBookingsBlock.style.display = 'none';
    }
    
    // Скрываем блок "Контакты", если он есть
    const contactsBlock = document.querySelector('.contacts-section');
    if (contactsBlock) {
        contactsBlock.style.display = 'none';
    }
    
    // Скрываем блок "Отзывы", если он есть
    const reviewsBlock = document.querySelector('.reviews-section');
    if (reviewsBlock) {
        reviewsBlock.style.display = 'none';
    }
    
    // Скрываем все ссылки из основной навигации
    const navLinks = document.querySelectorAll('.nav-item');
    navLinks.forEach(link => {
        link.style.display = 'none';
    });
    
    // Добавляем кнопку возврата на панель администратора
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
        // Проверяем, нет ли уже такой кнопки
        if (!document.querySelector('.back-to-admin')) {
            const backButton = document.createElement('a');
            backButton.href = 'admin-panel.html';
            backButton.className = 'btn btn-primary back-to-admin';
            backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Вернуться к панели';
            headerRight.insertBefore(backButton, headerRight.firstChild);
        }
    }
}

// Функция для обновления UI в зависимости от статуса авторизации
function updateAuthUI(isLoggedInOrUserData) {
    const loginBtn = document.querySelector('.header-right .btn-outline');
    const registerBtn = document.querySelector('.header-right .btn-primary');
    const headerRight = document.querySelector('.header-right');
    
    // Определяем, авторизован ли пользователь
    const isLoggedIn = typeof isLoggedInOrUserData === 'boolean' ? isLoggedInOrUserData : true;
    
    if (isLoggedIn && headerRight) {
        // Получаем информацию о пользователе
        let userData = {};
        
        // Если передан объект с данными пользователя, используем его
        if (typeof isLoggedInOrUserData === 'object' && isLoggedInOrUserData !== null) {
            userData = isLoggedInOrUserData;
        } else {
            // Иначе берем данные из localStorage
            const userJson = localStorage.getItem('user_data');
            if (userJson) {
                try {
                    userData = JSON.parse(userJson);
                } catch (e) {
                    console.error('Ошибка при парсинге данных пользователя:', e);
                }
            }
        }
        
        // Определяем имя для отображения
        let displayName = 'Пользователь';
        if (userData.first_name && userData.last_name) {
            displayName = `${userData.first_name} ${userData.last_name}`;
        } else if (userData.first_name) {
            displayName = userData.first_name;
        } else if (userData.username) {
            displayName = userData.username;
        } else if (userData.email) {
            displayName = userData.email;
        }
        
        // Если пользователь авторизован, показываем профиль и кнопку выхода
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        
        // Проверяем, существует ли уже профиль пользователя
        const existingProfile = document.querySelector('.user-profile');
        if (existingProfile) {
            existingProfile.remove();
        }
        
        // Создаем элементы для профиля и кнопки выхода
        const userProfile = document.createElement('div');
        userProfile.className = 'user-profile';
        userProfile.innerHTML = `
            <div class="user-avatar">
                <img src="assets/default-avatar.png" alt="Аватар" class="avatar-image">
            </div>
            <div class="user-info">
                <span class="user-name">${displayName}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
        `;
        
        // Проверяем, является ли пользователь суперпользователем, системным администратором или персоналом
        const isAdmin = userData.is_superuser === true || userData.is_system_admin === true;
        const isStaff = userData.is_staff === true;
        
        const userDropdown = document.createElement('div');
        userDropdown.className = 'user-dropdown';
        
        // Формируем HTML для выпадающего меню в зависимости от роли пользователя
        let dropdownHtml = '<ul>';
        
        // Для персонала показываем только профиль и кнопку выхода
        if (isStaff && !isAdmin) {
            dropdownHtml += `
                <li><a href="profile.html"><i class="fas fa-user"></i> Профиль</a></li>
                <li><a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Выйти</a></li>
            `;
        } else {
            // Для обычных пользователей и администраторов показываем все пункты меню
            dropdownHtml += `
                <li><a href="profile.html"><i class="fas fa-user"></i> Профиль</a></li>
                <li><a href="my-bookings.html"><i class="fas fa-calendar-check"></i> Мои брони</a></li>
                <li><a href="my-reviews.html"><i class="fas fa-star"></i> Мои отзывы</a></li>
            `;
            
            // Добавляем ссылку на админ-панель только для администраторов
            if (isAdmin) {
                dropdownHtml += `
                    <li><a href="http://127.0.0.1:8000/admin" target="_blank"><i class="fas fa-tools"></i> Админ-панель</a></li>
                `;
            }
            
            // Добавляем ссылку на панель администратора ресторана для персонала
            if (isStaff) {
                dropdownHtml += `
                    <li><a href="admin-panel.html"><i class="fas fa-concierge-bell"></i> Панель ресторана</a></li>
                `;
            }
            
            // Добавляем кнопку выхода
            dropdownHtml += `
                <li><a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Выйти</a></li>
            `;
        }
        
        dropdownHtml += '</ul>';
        
        userDropdown.innerHTML = dropdownHtml;
        
        userProfile.appendChild(userDropdown);
        headerRight.appendChild(userProfile);
        
        // Добавляем обработчик для показа/скрытия выпадающего меню
        userProfile.addEventListener('click', function() {
            userProfile.classList.toggle('active');
        });
        
        // Добавляем обработчик для кнопки выхода
        document.getElementById('logout-btn').addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
        
        // Закрываем выпадающее меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                userProfile.classList.remove('active');
            }
        });
    } else {
        // Если пользователь не авторизован, показываем кнопки входа и регистрации
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        
        // Удаляем профиль пользователя, если он существует
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            userProfile.remove();
        }
    }
}

// Функция для выхода из аккаунта
function logout() {
    // Удаляем токен и информацию о пользователе
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_data');
    
    // Перезагружаем страницу
    window.location.reload();
}

// Функция для отображения ошибки
function showError(message) {
    const errorElement = document.querySelector('.error-message');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Скрываем сообщение через 5 секунд
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// Функция для отображения/скрытия индикатора загрузки
function showLoading(isLoading) {
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    
    if (submitBtn) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Войти';
        }
    }
}

// Функция для обновления данных пользователя при загрузке страницы
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
            // Обновляем UI, если нужно
            if (typeof updateAuthUI === 'function') {
                updateAuthUI(userData);
            }
        }
    } catch (error) {
        console.error('Ошибка при обновлении данных пользователя:', error);
    }
} 