document.addEventListener('DOMContentLoaded', function() {
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const uidb64 = urlParams.get('uid');
    const token = urlParams.get('token');
    
    // Проверяем наличие параметров
    if (!uidb64 || !token) {
        showError('Неверная ссылка для восстановления пароля. Пожалуйста, проверьте ссылку или запросите новую.');
        return;
    }
    
    // Проверяем валидность токена
    validateResetToken(uidb64, token);
});

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
            showError(data.detail || 'Ссылка для восстановления пароля недействительна или срок её действия истек.');
        }
    } catch (error) {
        console.error('Ошибка при проверке токена:', error);
        showError('Произошла ошибка при проверке ссылки. Пожалуйста, попробуйте позже.');
    }
}

// Функция для отображения формы установки нового пароля
function showResetPasswordForm(uidb64, token) {
    const container = document.getElementById('reset-container');
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Создаем форму для установки нового пароля
    container.innerHTML = `
        <h1 class="auth-title">Установка нового пароля</h1>
        <p class="reset-description">Введите новый пароль для вашей учетной записи.</p>
        <form class="auth-form" id="new-password-form">
            <div class="form-group">
                <input type="password" id="new-password" name="new-password" placeholder="Новый пароль" required>
                <i class="fas fa-eye toggle-password"></i>
            </div>
            <div class="form-group">
                <input type="password" id="confirm-password" name="confirm-password" placeholder="Подтверждение пароля" required>
                <i class="fas fa-eye toggle-password"></i>
            </div>
            <button type="submit" class="auth-button">Сохранить новый пароль</button>
        </form>
        <div class="auth-links">
            <p><a href="login.html">Вернуться на страницу входа</a></p>
        </div>
    `;
    
    // Добавляем обработчики для показа/скрытия пароля
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });
    
    // Добавляем обработчик для формы
    const newPasswordForm = document.getElementById('new-password-form');
    newPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Проверяем, что пароли совпадают
        if (newPassword !== confirmPassword) {
            showFormError('confirm-password', 'Пароли не совпадают');
            return;
        }
        
        // Проверяем сложность пароля
        if (newPassword.length < 8) {
            showFormError('new-password', 'Пароль должен содержать не менее 8 символов');
            return;
        }
        
        // Отправляем запрос на установку нового пароля
        completePasswordReset(uidb64, token, newPassword);
    });
}

// Функция для отображения ошибки в форме
function showFormError(inputId, message) {
    const input = document.getElementById(inputId);
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

// Функция для отображения общей ошибки
function showError(message) {
    const container = document.getElementById('reset-container');
    
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
            const container = document.getElementById('reset-container');
            container.innerHTML = `
                <h1 class="auth-title">Пароль изменен</h1>
                <div class="success-box">
                    <i class="fas fa-check-circle"></i>
                    <p>Ваш пароль успешно изменен. Теперь вы можете войти в систему, используя новый пароль.</p>
                </div>
                <div class="auth-links">
                    <a href="login.html" class="auth-button">Войти в систему</a>
                </div>
            `;
        } else {
            showFormError('new-password', data.detail || 'Произошла ошибка при установке нового пароля.');
        }
    } catch (error) {
        console.error('Ошибка при установке нового пароля:', error);
        showFormError('new-password', 'Произошла ошибка при установке нового пароля. Пожалуйста, попробуйте позже.');
    }
} 