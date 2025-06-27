document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        setupFormValidation(registerForm);
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm(registerForm)) {
                const formData = {
                    first_name: document.getElementById('first_name').value,
                    last_name: document.getElementById('last_name').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    password: document.getElementById('password').value
                };

                fetch('http://127.0.0.1:8000/auth/register/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Ошибка регистрации');
                })
                .then(data => {
                    // Сохраняем токены в localStorage
                    localStorage.setItem('access_token', data.access);
                    localStorage.setItem('refresh_token', data.refresh);
                    
                    // Перенаправляем на главную страницу
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                });
            }
        });
    }
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        setupFormValidation(loginForm);
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm(loginForm)) {
                alert('Вход выполнен успешно! Вы будете перенаправлены на главную страницу.');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        });
    }
    
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
        const emailInput = document.getElementById('email');
        emailInput.addEventListener('input', function() {
            validateInput(emailInput);
        });
        emailInput.addEventListener('blur', function() {
            validateInput(emailInput);
        });
        resetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const confirmCheckbox = document.getElementById('confirm_reset');
            let isValid = validateInput(emailInput) && confirmCheckbox.checked;
            if (isValid) {
                alert('Инструкции по восстановлению пароля отправлены на указанный email.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else if (!confirmCheckbox.checked) {
                alert('Пожалуйста, подтвердите, что у вас есть доступ к указанной почте.');
            }
        });
    }
});

function setupFormValidation(form) {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            validateInput(input);
        });
        input.addEventListener('blur', function() {
            validateInput(input);
        });
    });
}

function validateForm(form) {
    const inputs = form.querySelectorAll('input');
    let isValid = true;
    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    return isValid;
}

function validateInput(input) {
    const value = input.value.trim();
    const type = input.type;
    const id = input.id;
    input.classList.remove('valid');
    if (value === '') {
        return false;
    }
    if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return false;
        }
    } else if (id === 'phone') {
        const phoneRegex = /^[+0-9]{10,15}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            return false;
        }
    } else if (id === 'password') {
        if (value.length < 6) {
            return false;
        }
    } else if (id === 'email_phone') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[+0-9]{10,15}$/;
        if (!emailRegex.test(value) && !phoneRegex.test(value.replace(/\s/g, ''))) {
            return false;
        }
    }
    input.classList.add('valid');
    return true;
} 