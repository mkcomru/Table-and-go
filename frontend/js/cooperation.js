// Функциональность для страницы сотрудничества

document.addEventListener('DOMContentLoaded', function() {
    // Обработка отправки формы сотрудничества
    const cooperationForm = document.getElementById('cooperation-request-form');
    
    if (cooperationForm) {
        cooperationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Получение значений полей формы
            const name = document.getElementById('name').value;
            const surname = document.getElementById('surname').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const additionalInfo = document.getElementById('additional-info').value;
            
            // Валидация формы
            if (!name || !surname || !email || !phone) {
                showNotification('Пожалуйста, заполните все обязательные поля', 'error');
                return;
            }
            
            // Имитация отправки данных на сервер
            setTimeout(() => {
                showNotification('Ваша заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
                cooperationForm.reset();
            }, 1000);
        });
    }
    
    // Функция для отображения уведомлений
    function showNotification(message, type) {
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
    
    // Плавная прокрутка к форме
    const startButtons = document.querySelectorAll('a[href="#cooperation-form"]');
    
    if (startButtons.length > 0) {
        startButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    const yOffset = -80; // Учитываем высоту шапки
                    const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    
                    window.scrollTo({
                        top: y,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}); 