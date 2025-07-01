document.addEventListener('DOMContentLoaded', function() {
    const resetForm = document.getElementById('reset-form');
    const emailInput = document.getElementById('email');
    
    if (resetForm) {
        resetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Валидация email
            if (!validateEmail(emailInput.value)) {
                showError(emailInput, 'Пожалуйста, введите корректный email');
                return;
            }
            
            // Отправка запроса на восстановление пароля
            requestPasswordReset(emailInput.value);
        });
    }
    
    // Проверка параметров URL для страницы установки нового пароля
    const urlParams = new URLSearchParams(window.location.search);
    const uidb64 = urlParams.get('uid');
    const token = urlParams.get('token');
    
    if (uidb64 && token) {
        // Если в URL есть параметры для сброса пароля, проверяем их валидность
        validateResetToken(uidb64, token);
    }
});

// Функция для валидации email
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// Функция для отображения ошибки
function showError(input, message) {
    const formGroup = input.parentElement;
    formGroup.classList.add('error');
    
    let errorMessage = formGroup.querySelector('.error-message');
    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        formGroup.appendChild(errorMessage);
    }
    
    errorMessage.textContent = message;
    
    // Убираем ошибку через 5 секунд
    setTimeout(() => {
        formGroup.classList.remove('error');
        errorMessage.textContent = '';
    }, 5000);
}

// Функция для отображения сообщения об успехе
function showSuccess(message) {
    const resetForm = document.getElementById('reset-form');
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <p>${message}</p>
    `;
    
    // Заменяем форму на сообщение об успехе
    resetForm.style.display = 'none';
    resetForm.parentElement.appendChild(successMessage);
}

// Функция для запроса на восстановление пароля
async function requestPasswordReset(email) {
    try {
        const response = await fetch('http://127.0.0.1:8000/auth/password-reset/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('Инструкции по восстановлению пароля отправлены на ваш email.');
        } else {
            showError(document.getElementById('email'), data.detail || 'Произошла ошибка при отправке запроса.');
        }
    } catch (error) {
        console.error('Ошибка при отправке запроса:', error);
        showError(document.getElementById('email'), 'Произошла ошибка при отправке запроса. Пожалуйста, попробуйте позже.');
    }
}

// Функция для проверки токена сброса пароля
async function validateResetToken(uidb64, token) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/auth/password-reset-confirm/${uidb64}/${token}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.valid) {
            // Показываем форму для установки нового пароля
            showResetPasswordForm(uidb64, token);
        } else {
            // Показываем сообщение об ошибке
            showTokenError(data.detail || 'Ссылка для восстановления пароля недействительна или срок её действия истек.');
        }
    } catch (error) {
        console.error('Ошибка при проверке токена:', error);
        showTokenError('Произошла ошибка при проверке ссылки. Пожалуйста, попробуйте позже.');
    }
}

// Функция для отображения формы установки нового пароля
function showResetPasswordForm(uidb64, token) {
    const container = document.querySelector('.auth-form-wrapper');
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаем форму для установки нового пароля
    container.innerHTML = `
        <h1 class="auth-title">Установка нового пароля</h1>
        <p class="reset-description">Введите новый пароль для вашей учетной записи.</p>
        <form class="auth-form" id="new-password-form">
            <div class="form-group">
                <input type="password" id="new-password" name="new-password" placeholder="Новый пароль" required>
            </div>
            <div class="form-group">
                <input type="password" id="confirm-password" name="confirm-password" placeholder="Подтверждение пароля" required>
            </div>
            <button type="submit" class="auth-button">Сохранить новый пароль</button>
        </form>
    `;
    
    // Добавляем обработчик для формы
    const newPasswordForm = document.getElementById('new-password-form');
    newPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Проверяем, что пароли совпадают
        if (newPassword !== confirmPassword) {
            showError(document.getElementById('confirm-password'), 'Пароли не совпадают');
            return;
        }
        
        // Отправляем запрос на установку нового пароля
        completePasswordReset(uidb64, token, newPassword);
    });
}

// Функция для отображения ошибки с токеном
function showTokenError(message) {
    const container = document.querySelector('.auth-form-wrapper');
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаем сообщение об ошибке
    container.innerHTML = `
        <h1 class="auth-title">Ошибка восстановления пароля</h1>
        <div class="error-box">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
        <div class="auth-links">
            <p><a href="reset-password.html">Запросить новую ссылку</a> или <a href="login.html">вернуться на страницу входа</a></p>
        </div>
    `;
}

// Функция для завершения процесса сброса пароля
async function completePasswordReset(uidb64, token, password) {
    try {
        const response = await fetch('http://127.0.0.1:8000/auth/password-reset-complete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uidb64,
                token,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Показываем сообщение об успехе
            const container = document.querySelector('.auth-form-wrapper');
            container.innerHTML = `
                <h1 class="auth-title">Пароль изменен</h1>
                <div class="success-box">
                    <i class="fas fa-check-circle"></i>
                    <p>Ваш пароль успешно изменен. Теперь вы можете войти в систему, используя новый пароль.</p>
                </div>
                <div class="auth-links">
                    <p><a href="login.html" class="auth-button">Войти в систему</a></p>
                </div>
            `;
        } else {
            showError(document.getElementById('new-password'), data.detail || 'Произошла ошибка при установке нового пароля.');
        }
    } catch (error) {
        console.error('Ошибка при установке нового пароля:', error);
        showError(document.getElementById('new-password'), 'Произошла ошибка при установке нового пароля. Пожалуйста, попробуйте позже.');
    }
} 