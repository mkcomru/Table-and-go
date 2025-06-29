document.addEventListener('DOMContentLoaded', function() {
    // Инициализация формы бронирования
    initBookingForm();
    
    // Инициализация кнопки бронирования в шапке
    initBookingButton();
    
    // Инициализация кнопки "Поделиться"
    initShareButton();
    
    // Инициализация плавной прокрутки
    initSmoothScroll();
    
    // Функционал для формы отправки отзыва
    initReviewForm();
});

// Функция для инициализации формы бронирования
function initBookingForm() {
    const bookingForm = document.getElementById('booking-form');
    
    if (bookingForm) {
        // Инициализация счетчика гостей
        initGuestsCounter();
        
        // Инициализация выбора даты
        initDatePicker();
        
        // Инициализация выбора времени
        initTimePicker();
        
        // Обработчик отправки формы
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Получаем данные формы
            const formData = {
                date: document.getElementById('booking-date').value,
                time: document.getElementById('booking-time').value,
                guestsCount: document.getElementById('guests-count').value,
                comment: document.getElementById('booking-comment').value
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

// Инициализация счетчика гостей
function initGuestsCounter() {
    const minusBtn = document.querySelector('.minus-btn');
    const plusBtn = document.querySelector('.plus-btn');
    const guestsInput = document.getElementById('guests-count');
    
    if (minusBtn && plusBtn && guestsInput) {
        // Начальное значение
        let guestsCount = parseInt(guestsInput.value) || 2;
        
        // Минимальное и максимальное количество гостей
        const minGuests = parseInt(guestsInput.getAttribute('min')) || 1;
        const maxGuests = parseInt(guestsInput.getAttribute('max')) || 20;
        
        // Обновление значения в поле
        const updateGuestsCount = () => {
            guestsInput.value = guestsCount;
            
            // Управление активностью кнопок
            minusBtn.disabled = guestsCount <= minGuests;
            plusBtn.disabled = guestsCount >= maxGuests;
            
            // Визуальное отображение состояния кнопок
            minusBtn.style.opacity = guestsCount <= minGuests ? '0.5' : '1';
            plusBtn.style.opacity = guestsCount >= maxGuests ? '0.5' : '1';
        };
        
        // Обработчики для кнопок
        minusBtn.addEventListener('click', () => {
            if (guestsCount > minGuests) {
                guestsCount--;
                updateGuestsCount();
            }
        });
        
        plusBtn.addEventListener('click', () => {
            if (guestsCount < maxGuests) {
                guestsCount++;
                updateGuestsCount();
            }
        });
        
        // Обработчик для ручного ввода
        guestsInput.addEventListener('input', () => {
            let value = parseInt(guestsInput.value);
            
            // Проверка на число
            if (isNaN(value)) {
                value = 2;
            }
            
            // Ограничение минимального и максимального значения
            if (value < minGuests) value = minGuests;
            if (value > maxGuests) value = maxGuests;
            
            guestsCount = value;
            // Не обновляем поле ввода сразу, чтобы не мешать пользователю вводить число
        });
        
        // Обработчик потери фокуса для обновления значения
        guestsInput.addEventListener('blur', () => {
            updateGuestsCount();
        });
        
        // Инициализация
        updateGuestsCount();
    }
}

// Инициализация выбора даты
function initDatePicker() {
    const dateInput = document.getElementById('booking-date');
    
    if (dateInput) {
        // Обработчик фокуса для показа календаря
        dateInput.addEventListener('focus', function() {
            // В реальном проекте здесь будет инициализация календаря
            // Например, с использованием библиотеки flatpickr или аналогичной
            
            // Временное решение - просто меняем тип поля
            this.type = 'date';
            
            // Устанавливаем минимальную дату - сегодня
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            this.setAttribute('min', formattedDate);
        });
        
        // Обработчик потери фокуса для форматирования даты
        dateInput.addEventListener('blur', function() {
            if (!this.value) {
                this.type = 'text';
            }
        });
    }
}

// Инициализация выбора времени
function initTimePicker() {
    const timeInput = document.getElementById('booking-time');
    
    if (timeInput) {
        // Обработчик фокуса для показа выбора времени
        timeInput.addEventListener('focus', function() {
            // В реальном проекте здесь будет инициализация выбора времени
            // Например, с использованием библиотеки flatpickr или аналогичной
            
            // Временное решение - просто меняем тип поля
            this.type = 'time';
            
            // Устанавливаем шаг в 30 минут
            this.setAttribute('step', '1800');
        });
        
        // Обработчик потери фокуса для форматирования времени
        timeInput.addEventListener('blur', function() {
            if (!this.value) {
                this.type = 'text';
            }
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

function initReviewForm() {
    const starRating = document.querySelector('.star-rating');
    if (!starRating) return;

    const stars = starRating.querySelectorAll('i');
    let selectedRating = 0;

    // Обработчик для выбора рейтинга
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            selectedRating = rating;
            updateStars(stars, rating);
        });

        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            updateStars(stars, rating, true);
        });

        star.addEventListener('mouseout', function() {
            updateStars(stars, selectedRating);
        });
    });

    // Кнопка добавления фото
    const addPhotoBtn = document.querySelector('.add-photo-btn');
    if (addPhotoBtn) {
        addPhotoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Здесь будет логика для добавления фото
            alert('Функционал добавления фото будет реализован позже');
        });
    }

    // Кнопка отправки отзыва
    const submitReviewBtn = document.querySelector('.submit-review-btn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const reviewText = document.querySelector('.review-textarea textarea').value;
            
            if (selectedRating === 0) {
                alert('Пожалуйста, выберите рейтинг');
                return;
            }
            
            if (!reviewText.trim()) {
                alert('Пожалуйста, напишите отзыв');
                return;
            }
            
            // Здесь будет логика отправки отзыва на сервер
            alert(`Спасибо за ваш отзыв! Рейтинг: ${selectedRating}, Текст: ${reviewText}`);
            
            // Сбросить форму
            resetReviewForm(stars);
        });
    }
}

// Обновление отображения звезд
function updateStars(stars, rating, isHover = false) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

// Сброс формы отзыва
function resetReviewForm(stars) {
    // Сбросить рейтинг
    stars.forEach(star => {
        star.classList.remove('fas');
        star.classList.add('far');
    });
    
    // Очистить текстовое поле
    document.querySelector('.review-textarea textarea').value = '';
} 