document.addEventListener('DOMContentLoaded', function() {
    // Инициализация формы бронирования
    initBookingForm();
    
    // Инициализация кнопки бронирования в шапке
    initBookingButton();
    
    // Инициализация кнопки "Поделиться"
    initShareButton();
    
    // Инициализация плавной прокрутки
    initSmoothScroll();
});

// Функция для инициализации формы бронирования
function initBookingForm() {
    const bookingForm = document.getElementById('booking-form');
    
    if (bookingForm) {
        // Устанавливаем минимальную дату - сегодня
        const bookingDate = document.getElementById('booking-date');
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        bookingDate.setAttribute('min', formattedDate);
        
        // Обработчик отправки формы
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Получаем данные формы
            const formData = {
                date: document.getElementById('booking-date').value,
                time: document.getElementById('booking-time').value,
                guestsCount: document.getElementById('guests-count').value,
                specialRequests: document.getElementById('special-requests').value
            };
            
            // Проверяем авторизацию пользователя
            const isLoggedIn = checkUserAuthentication();
            
            if (!isLoggedIn) {
                // Если пользователь не авторизован, показываем сообщение
                alert('Для бронирования необходимо авторизоваться');
                window.location.href = 'login.html';
                return;
            }
            
            // Отправляем данные на сервер
            sendBookingRequest(formData);
        });
    }
}

// Функция для проверки авторизации пользователя
function checkUserAuthentication() {
    // Проверяем наличие токена в localStorage
    const token = localStorage.getItem('authToken');
    return !!token;
}

// Функция для отправки запроса на бронирование
function sendBookingRequest(formData) {
    // Здесь будет код для отправки запроса на сервер
    console.log('Отправка запроса на бронирование:', formData);
    
    // Имитация отправки запроса
    setTimeout(() => {
        // Показываем сообщение об успешном бронировании
        alert('Ваша заявка на бронирование успешно отправлена! Мы свяжемся с вами для подтверждения.');
        
        // Очищаем форму
        document.getElementById('booking-form').reset();
    }, 1000);
}

// Функция для инициализации кнопки бронирования в шапке
function initBookingButton() {
    const bookingBtn = document.querySelector('.booking-btn');
    
    if (bookingBtn) {
        bookingBtn.addEventListener('click', function() {
            // Плавная прокрутка к форме бронирования
            const bookingSection = document.getElementById('booking-section');
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

// Функция для инициализации кнопки "Поделиться"
function initShareButton() {
    const shareBtn = document.querySelector('.share-btn');
    
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            // Проверяем поддержку Web Share API
            if (navigator.share) {
                navigator.share({
                    title: document.querySelector('.restaurant-name').textContent,
                    url: window.location.href
                })
                .then(() => console.log('Успешно поделились'))
                .catch((error) => console.log('Ошибка при попытке поделиться:', error));
            } else {
                // Если Web Share API не поддерживается, копируем ссылку в буфер обмена
                const url = window.location.href;
                
                // Создаем временный элемент для копирования
                const tempInput = document.createElement('input');
                tempInput.value = url;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                
                // Показываем уведомление
                alert('Ссылка скопирована в буфер обмена');
            }
        });
    }
}

// Функция для плавной прокрутки к якорным ссылкам
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            const targetElement = document.querySelector(href);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Обновляем URL с хэшем, но без перезагрузки страницы
                history.pushState(null, null, href);
            }
        });
    });
} 