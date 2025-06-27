document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    
    // Проверяем, авторизован ли пользователь
    checkAuthStatus();
    
    if (registerForm) {
        // Добавляем обработчики событий для проверки полей в реальном времени
        setupValidation();
        
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Получаем данные из формы
            const firstName = document.getElementById('first_name').value;
            const lastName = document.getElementById('last_name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value.replace(/\D/g, '');
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            // Проверяем заполненность полей
            if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
                showError('register-error', 'Пожалуйста, заполните все поля');
                return;
            }
            
            // Проверяем совпадение паролей
            if (password !== confirmPassword) {
                showError('register-error', 'Пароли не совпадают');
                return;
            }
            
            // Подготавливаем данные для отправки
            const registerData = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
                password: password
            };
            
            console.log('Отправляемые данные:', registerData);
            
            // Отправка запроса на сервер
            fetch('http://127.0.0.1:8000/auth/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData)
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    return response.json().then(data => {
                        // Обработка ошибок от сервера
                        let errorMessage = 'Ошибка при регистрации';
                        if (data.email) {
                            errorMessage = `Email: ${data.email.join(', ')}`;
                        } else if (data.phone) {
                            errorMessage = `Телефон: ${data.phone.join(', ')}`;
                        } else if (data.password) {
                            errorMessage = `Пароль: ${data.password.join(', ')}`;
                        } else if (data.detail) {
                            errorMessage = data.detail;
                        }
                        throw new Error(errorMessage);
                    }).catch(err => {
                        throw new Error('Ошибка при регистрации. Пожалуйста, проверьте введенные данные.');
                    });
                }
            })
            .then(data => {
                // Сохраняем токены в localStorage
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                
                // Сохраняем данные пользователя
                if (data.user) {
                    localStorage.setItem('user_data', JSON.stringify(data.user));
                }
                
                // Показываем сообщение об успешной регистрации
                showSuccess('register-success', 'Регистрация успешно завершена! Перенаправление...');
                
                // Перенаправляем на главную страницу через 2 секунды
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            })
            .catch(error => {
                console.error('Ошибка регистрации:', error);
                showError('register-error', error.message || 'Ошибка при регистрации');
            });
        });
    }
});

// Функция для настройки валидации в реальном времени
function setupValidation() {
    // Валидация имени (не пустое)
    const firstNameInput = document.getElementById('first_name');
    if (firstNameInput) {
        firstNameInput.addEventListener('input', function() {
            validateField(this, this.value.trim().length > 1);
        });
    }
    
    // Валидация фамилии (не пустое)
    const lastNameInput = document.getElementById('last_name');
    if (lastNameInput) {
        lastNameInput.addEventListener('input', function() {
            validateField(this, this.value.trim().length > 1);
        });
    }
    
    // Валидация email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            validateField(this, emailRegex.test(this.value));
        });
    }
    
    // Валидация телефона
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            const phoneValue = this.value.replace(/\D/g, '');
            validateField(this, phoneValue.length >= 10);
        });
    }
    
    // Валидация пароля (минимум 6 символов)
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            validateField(this, this.value.length >= 6);
            
            // Проверяем совпадение паролей при изменении основного пароля
            const confirmPasswordInput = document.getElementById('confirm_password');
            if (confirmPasswordInput.value) {
                validateField(confirmPasswordInput, confirmPasswordInput.value === this.value);
            }
        });
    }
    
    // Валидация подтверждения пароля
    const confirmPasswordInput = document.getElementById('confirm_password');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const passwordInput = document.getElementById('password');
            validateField(this, this.value === passwordInput.value && this.value !== '');
        });
    }
}

// Функция для валидации поля и отображения/скрытия иконки
function validateField(inputElement, isValid) {
    if (isValid) {
        inputElement.classList.add('valid');
    } else {
        inputElement.classList.remove('valid');
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
                <li><a href="#"><i class="fas fa-calendar-alt"></i> Мои брони</a></li>
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
    
    // Перезагружаем страницу
    window.location.reload();
}

// Функция для отображения сообщения об ошибке
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('active');
        
        // Автоматически скрыть сообщение через 5 секунд
        setTimeout(() => {
            errorElement.classList.remove('active');
        }, 5000);
    }
}

// Функция для отображения сообщения об успехе
function showSuccess(elementId, message) {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.classList.add('active');
    }
} 