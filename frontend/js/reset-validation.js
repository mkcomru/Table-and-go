document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    const resetForm = document.getElementById('reset-form');
    
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            validateEmail(emailInput);
        });
        
        emailInput.addEventListener('blur', function() {
            validateEmail(emailInput);
        });
    }
    
    if (resetForm) {
        resetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            let isValid = validateEmail(emailInput);
            
            if (isValid) {
                alert('Инструкции по восстановлению пароля отправлены на указанный email.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            }
        });
    }
});

function validateEmail(input) {
    const value = input.value.trim();
    
    input.classList.remove('valid');
    
    if (value === '') {
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return false;
    }
    
    input.classList.add('valid');
    return true;
} 