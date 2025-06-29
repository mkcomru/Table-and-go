document.addEventListener('DOMContentLoaded', function() {
    // Получаем id филиала из URL
    const branchId = getBranchIdFromUrl();
    
    if (branchId) {
        // Загружаем данные о филиале
        loadBranchDetails(branchId);
    } else {
        console.error('ID филиала не найден в URL');
    }
    
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

// Функция для получения id филиала из URL
function getBranchIdFromUrl() {
    // Получаем текущий URL
    const url = window.location.href;
    
    // Проверяем наличие параметра id в URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id')) {
        return urlParams.get('id');
    }
    
    // Если параметра нет, пытаемся извлечь id из пути URL
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    // Проверяем, является ли последняя часть пути числом
    if (/^\d+$/.test(lastPart)) {
        return lastPart;
    }
    
    return null;
}

// Функция для загрузки данных о филиале
function loadBranchDetails(branchId) {
    const apiUrl = `http://127.0.0.1:8000/api/branch/${branchId}`;
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при загрузке данных о филиале');
            }
            return response.json();
        })
        .then(data => {
            // Обновляем информацию на странице
            updateBranchDetails(data);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Не удалось загрузить информацию о ресторане. Пожалуйста, попробуйте позже.');
        });
}

// Функция для обновления информации о филиале на странице
function updateBranchDetails(data) {
    // Обновляем заголовок страницы
    document.title = `${data.name} | Table&Go`;
    
    // Обновляем название ресторана
    const restaurantNameElement = document.querySelector('.restaurant-name');
    if (restaurantNameElement) {
        restaurantNameElement.textContent = data.name;
    }
    
    // Обновляем рейтинг и количество отзывов
    const ratingElement = document.querySelector('.restaurant-rating span');
    const reviewsCountElement = document.querySelector('.reviews-count');
    
    if (ratingElement && data.average_rating !== undefined) {
        ratingElement.textContent = data.average_rating.toFixed(1);
    }
    
    if (reviewsCountElement) {
        reviewsCountElement.textContent = `(${data.reviews ? data.reviews.length : 0} отзывов)`;
    }
    
    // Обновляем тип кухни
    const cuisineElement = document.querySelector('.restaurant-cuisine span');
    if (cuisineElement && data.cuisine_types) {
        cuisineElement.textContent = data.cuisine_types.join(', ');
    }
    
    // Обновляем средний чек
    const priceElement = document.querySelector('.restaurant-price span');
    if (priceElement && data.average_check) {
        priceElement.textContent = `Средний чек: ${data.average_check}₽`;
    }
    
    // Обновляем адрес
    const addressElement = document.querySelector('.contact-info-item.address-item p');
    if (addressElement && data.address) {
        addressElement.textContent = data.address;
    }
    
    // Обновляем район в контактной информации
    const districtElement = document.querySelector('.contact-info-district p');
    if (districtElement && data.district) {
        // Если district это объект с полем name, используем его, иначе используем как есть
        const districtName = typeof data.district === 'object' ? data.district.name : data.district;
        districtElement.textContent = `Район: ${districtName}`;
    }
    
    // Обновляем телефон
    const phoneElement = document.querySelector('.contact-info-item.phone-item p');
    if (phoneElement && data.phone) {
        // Форматируем номер телефона
        const formattedPhone = formatPhoneNumber(data.phone);
        phoneElement.textContent = formattedPhone;
    }
    
    // Обновляем email
    const emailElement = document.querySelector('.contact-info-item.email-item p');
    if (emailElement && data.email) {
        emailElement.textContent = data.email;
    }
    
    // Обновляем часы работы
    const hoursElement = document.querySelector('.restaurant-hours span');
    if (hoursElement && data.working_hours) {
        const workingHoursText = formatWorkingHours(data.working_hours);
        hoursElement.textContent = workingHoursText;
    }
    
    // Обновляем ссылку на PDF меню
    const menuLinkElement = document.querySelector('.download-menu-btn');
    if (menuLinkElement && data.menu_pdf) {
        menuLinkElement.href = data.menu_pdf;
        menuLinkElement.style.display = 'inline-block';
    } else if (menuLinkElement) {
        menuLinkElement.style.display = 'none';
        const menuContent = document.querySelector('.menu-content');
        if (menuContent) {
            menuContent.innerHTML = '<p>Меню в формате PDF недоступно</p>';
        }
    }
    
    // Обновляем фоновое изображение
    const heroSection = document.getElementById('restaurant-hero');
    if (heroSection && data.gallery && data.gallery.length > 0) {
        const mainImage = data.gallery.find(img => img.is_main) || data.gallery[0];
        heroSection.style.backgroundImage = `url('${mainImage.url}')`;
    }
    
    // Загружаем отзывы
    if (data.reviews && data.reviews.length > 0) {
        updateReviews(data.reviews);
    }
}

// Форматирование номера телефона
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Убираем все нецифровые символы
    const digits = phone.replace(/\D/g, '');
    
    // Форматируем номер в формате +7 (XXX) XXX-XX-XX
    if (digits.length === 10) {
        return `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`;
    } else if (digits.length === 11) {
        return `+7 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7, 9)}-${digits.substring(9, 11)}`;
    }
    
    // Если формат не соответствует, возвращаем как есть
    return `+7 ${phone}`;
}

// Форматирование часов работы
function formatWorkingHours(workingHours) {
    if (!workingHours || workingHours.length === 0) {
        return 'Часы работы не указаны';
    }
    
    // Группируем дни с одинаковым расписанием
    const scheduleGroups = [];
    let currentGroup = {
        days: [workingHours[0].day_of_week],
        status: workingHours[0].status,
        is_closed: workingHours[0].is_closed
    };
    
    for (let i = 1; i < workingHours.length; i++) {
        const current = workingHours[i];
        
        if (current.status === currentGroup.status && 
            current.is_closed === currentGroup.is_closed) {
            // Добавляем день к текущей группе
            currentGroup.days.push(current.day_of_week);
        } else {
            // Сохраняем текущую группу и создаем новую
            scheduleGroups.push(currentGroup);
            currentGroup = {
                days: [current.day_of_week],
                status: current.status,
                is_closed: current.is_closed
            };
        }
    }
    
    // Добавляем последнюю группу
    scheduleGroups.push(currentGroup);
    
    // Форматируем каждую группу
    const daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    
    const formattedSchedule = scheduleGroups.map(group => {
        // Форматируем дни
        let daysText;
        if (group.days.length === 7) {
            daysText = 'Ежедневно';
        } else if (group.days.length === 1) {
            daysText = daysOfWeek[group.days[0]];
        } else {
            // Проверяем, идут ли дни подряд
            const sortedDays = [...group.days].sort((a, b) => a - b);
            let isConsecutive = true;
            
            for (let i = 1; i < sortedDays.length; i++) {
                if (sortedDays[i] !== sortedDays[i-1] + 1) {
                    isConsecutive = false;
                    break;
                }
            }
            
            if (isConsecutive) {
                daysText = `${daysOfWeek[sortedDays[0]]}-${daysOfWeek[sortedDays[sortedDays.length - 1]]}`;
            } else {
                daysText = sortedDays.map(day => daysOfWeek[day]).join(', ');
            }
        }
        
        // Форматируем время
        let timeText;
        if (group.is_closed) {
            timeText = 'выходной';
        } else {
            timeText = group.status;
        }
        
        return `${daysText}: ${timeText}`;
    }).join('; ');
    
    return formattedSchedule;
}

// Обновление отзывов
function updateReviews(reviews) {
    const reviewsList = document.querySelector('.reviews-list');
    if (!reviewsList) return;
    
    // Очищаем список отзывов
    reviewsList.innerHTML = '';
    
    // Ограничиваем количество отзывов для отображения
    const maxReviews = 3;
    const displayedReviews = reviews.slice(0, maxReviews);
    
    // Добавляем отзывы на страницу
    displayedReviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        
        // Форматируем дату
        const reviewDate = new Date(review.created_at);
        const formattedDate = reviewDate.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Создаем HTML для отзыва
        reviewCard.innerHTML = `
            <div class="reviewer-info">
                <div class="reviewer-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="reviewer-details">
                    <div class="reviewer-name">${review.user_name || 'Анонимный пользователь'}</div>
                    <div class="review-date">${formattedDate}</div>
                </div>
            </div>
            <div class="review-rating">
                ${generateStars(review.rating)}
            </div>
            <div class="review-text">
                <p>${review.comment || 'Без комментария'}</p>
            </div>
        `;
        
        reviewsList.appendChild(reviewCard);
    });
    
    // Обновляем счетчик отзывов
    const reviewsCountElement = document.querySelector('.reviews-count');
    if (reviewsCountElement) {
        reviewsCountElement.textContent = `(${reviews.length} отзывов)`;
    }
}

// Генерация HTML для звезд рейтинга
function generateStars(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHtml += '<i class="fas fa-star"></i>';
        } else {
            starsHtml += '<i class="far fa-star"></i>';
        }
    }
    return starsHtml;
}

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