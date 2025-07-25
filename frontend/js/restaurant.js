document.addEventListener('DOMContentLoaded', function() {
    // Получаем id филиала из URL
    const branchId = getBranchIdFromUrl();
    
    if (branchId) {
        // Загружаем данные о филиале
        loadBranchDetails(branchId);
    } else {
        console.error('ID филиала не найден в URL');
        showErrorMessage('Не удалось определить ID заведения. Пожалуйста, проверьте URL.');
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

// Функция для отображения сообщения об ошибке
function showErrorMessage(message) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
        mainContent.prepend(errorDiv);
    }
}

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
            showErrorMessage('Не удалось загрузить информацию о заведении. Пожалуйста, попробуйте позже.');
        });
}

// Функция для обновления информации о филиале на странице
function updateBranchDetails(data) {
    // Обновляем заголовок страницы
    document.title = data.name ? `${data.name} | Table&Go` : 'Table&Go';
    
    // Обновляем название ресторана
    const restaurantNameElement = document.querySelector('.restaurant-name');
    if (restaurantNameElement) {
        restaurantNameElement.textContent = data.name || 'Название заведения недоступно';
    }
    
    // Обновляем описание заведения
    const aboutTextElement = document.querySelector('.about-text');
    if (aboutTextElement) {
        if (data.description) {
            // Разбиваем описание на абзацы (если есть переносы строк)
            const paragraphs = data.description.split('\n').filter(p => p.trim() !== '');
            
            // Очищаем текущее содержимое
            aboutTextElement.innerHTML = '';
            
            // Добавляем каждый абзац как отдельный элемент <p>
            paragraphs.forEach(paragraph => {
                const p = document.createElement('p');
                p.textContent = paragraph.trim();
                aboutTextElement.appendChild(p);
            });
        } else {
            // Если описания нет, добавляем стандартный текст
            aboutTextElement.innerHTML = '<p>Информация о заведении временно недоступна.</p>';
        }
    }
    
    // Обновляем рейтинг и количество отзывов
    const ratingElement = document.querySelector('.restaurant-rating span');
    const reviewsCountElement = document.querySelector('.reviews-count');
    
    if (ratingElement) {
        ratingElement.textContent = data.average_rating !== undefined ? data.average_rating.toFixed(1) : '0.0';
    }
    
    if (reviewsCountElement) {
        const reviewsCount = data.reviews ? data.reviews.length : 0;
        reviewsCountElement.textContent = `(${reviewsCount} отзывов)`;
    }
    
    // Обновляем тип кухни
    const cuisineElement = document.querySelector('.restaurant-cuisine span');
    if (cuisineElement) {
        if (data.cuisine_types && data.cuisine_types.length > 0) {
            cuisineElement.textContent = data.cuisine_types.join(', ');
        } else {
            cuisineElement.textContent = 'Тип кухни не указан';
        }
    }
    
    // Обновляем средний чек
    const priceElement = document.querySelector('.restaurant-price span');
    if (priceElement) {
        if (data.average_check) {
            priceElement.textContent = `Средний чек: ${data.average_check}₽`;
        } else {
            priceElement.textContent = 'Средний чек не указан';
        }
    }
    
    // Обновляем адрес в шапке
    const headerAddressElement = document.querySelector('.restaurant-address span');
    if (headerAddressElement) {
        headerAddressElement.textContent = data.address || 'Адрес не указан';
    }
    
    // Обновляем адрес в блоке контактной информации
    const addressElement = document.querySelector('.contact-info-item.address-item p');
    if (addressElement) {
        addressElement.textContent = data.address || 'Адрес не указан';
    }
    
    // Обновляем район в контактной информации
    const districtElement = document.querySelector('.contact-info-district p');
    if (districtElement) {
        if (data.district) {
            // Если district это объект с полем name, используем его, иначе используем как есть
            const districtName = typeof data.district === 'object' ? data.district.name : data.district;
            districtElement.textContent = `Район: ${districtName}`;
        } else {
            districtElement.textContent = 'Район не указан';
        }
    }
    
    // Обновляем телефон
    const phoneElement = document.querySelector('.contact-info-item.phone-item p');
    if (phoneElement) {
        if (data.phone) {
            // Форматируем номер телефона
            const formattedPhone = formatPhoneNumber(data.phone);
            phoneElement.textContent = formattedPhone;
        } else {
            phoneElement.textContent = 'Телефон не указан';
        }
    }
    
    // Обновляем email
    const emailElement = document.querySelector('.contact-info-item.email-item p');
    if (emailElement) {
        emailElement.textContent = data.email || 'Email не указан';
    }
    
    // Обновляем часы работы
    const hoursElement = document.querySelector('.restaurant-hours span');
    if (hoursElement) {
        if (data.working_hours && data.working_hours.length > 0) {
            const workingHoursText = formatWorkingHours(data.working_hours);
            hoursElement.textContent = workingHoursText;
        } else {
            hoursElement.textContent = 'Часы работы не указаны';
        }
    }
    
    // Обновляем ссылку на PDF меню
    const menuLinkElement = document.querySelector('.download-menu-btn');
    const menuContent = document.querySelector('.menu-content p');
    
    if (menuLinkElement && menuContent) {
        if (data.menu_pdf) {
            menuLinkElement.href = data.menu_pdf;
            menuLinkElement.style.display = 'inline-block';
            menuContent.textContent = `Меню заведения "${data.name}" доступно для скачивания.`;
            
            // Добавляем обработчик клика для отслеживания и отладки
            menuLinkElement.addEventListener('click', function(e) {
                console.log('Клик по ссылке на меню:', data.menu_pdf);
                // Открываем в новой вкладке для предотвращения проблем с CORS
                e.preventDefault();
                window.open(data.menu_pdf, '_blank');
            });
        } else {
            menuLinkElement.style.display = 'none';
            menuContent.textContent = 'Меню в формате PDF недоступно';
        }
    }
    
    // Обновляем фоновое изображение
    const heroSection = document.getElementById('restaurant-hero');
    if (heroSection) {
        if (data.gallery && data.gallery.length > 0) {
            const mainImage = data.gallery.find(img => img.is_main) || data.gallery[0];
            heroSection.style.backgroundImage = `url('${mainImage.url}')`;
            
            // Загружаем галерею изображений
            updateGallery(data.gallery);
            
            // Обновляем изображение для блока бронирования
            updateBookingImage(data.gallery);
        } else {
            // Если нет изображений, используем стандартный фон
            heroSection.style.backgroundImage = 'linear-gradient(to right, #8b1a1a, #d32f2f)';
        }
    }
    
    // Проверяем возможность онлайн-бронирования
    const bookingFormContainer = document.getElementById('booking-form-container');
    const noBookingMessage = document.getElementById('no-booking-message');
    const bookingButton = document.querySelector('.booking-btn');
    
    if (bookingFormContainer && noBookingMessage) {
        // Проверяем значение параметра allow_to_book
        const allowToBook = data.allow_to_book !== undefined ? data.allow_to_book : true;
        
        if (allowToBook) {
            // Если бронирование разрешено, показываем форму и кнопку
            bookingFormContainer.style.display = 'flex';
            noBookingMessage.style.display = 'none';
            if (bookingButton) bookingButton.style.display = 'inline-block';
        } else {
            // Если бронирование запрещено, показываем сообщение и скрываем кнопку
            bookingFormContainer.style.display = 'none';
            noBookingMessage.style.display = 'block';
            if (bookingButton) bookingButton.style.display = 'none';
        }
    }
    
    // Загружаем отзывы
    if (data.reviews && data.reviews.length > 0) {
        updateReviews(data.reviews);
    } else {
        // Если отзывов нет, показываем сообщение
        const reviewsList = document.querySelector('.reviews-list');
        if (reviewsList) {
            reviewsList.innerHTML = '<div class="no-reviews-message">Отзывов пока нет. Будьте первым, кто оставит отзыв!</div>';
        }
    }
}

// Функция для обновления галереи изображений
function updateGallery(gallery) {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid || !gallery || gallery.length === 0) return;
    
    // Очищаем текущее содержимое
    galleryGrid.innerHTML = '';
    
    // Добавляем изображения в галерею
    gallery.forEach(image => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = image.caption || 'Фото заведения';
        
        galleryItem.appendChild(img);
        galleryGrid.appendChild(galleryItem);
    });
}

// Функция для обновления изображения в блоке бронирования
function updateBookingImage(gallery) {
    const bookingImage = document.querySelector('.booking-image');
    if (!bookingImage || !gallery || gallery.length === 0) return;
    
    // Выбираем изображение (не главное, если возможно)
    const image = gallery.length > 1 ? 
        gallery.find(img => !img.is_main) || gallery[0] : 
        gallery[0];
    
    // Создаем элемент изображения
    const img = document.createElement('img');
    img.src = image.url;
    img.alt = 'Фото заведения';
    
    // Очищаем и добавляем изображение
    bookingImage.innerHTML = '';
    bookingImage.appendChild(img);
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
    
    // Если отзывов нет, показываем сообщение
    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = '<div class="no-reviews-message">Отзывов пока нет. Будьте первым, кто оставит отзыв!</div>';
        return;
    }
    
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
        
        // Получаем имя пользователя (используем user_full_name, если доступно)
        const userName = review.user_full_name || review.user_name || 'Анонимный пользователь';
        
        // Создаем HTML для отзыва
        reviewCard.innerHTML = `
            <div class="reviewer-info">
                <div class="reviewer-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="reviewer-details">
                    <div class="reviewer-name">${userName}</div>
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
        // При инициализации формы проверяем авторизацию пользователя
        const isLoggedIn = checkUserAuthentication();
        
        // Если пользователь не авторизован, показываем предупреждение
        const submitButton = bookingForm.querySelector('.btn-booking');
        if (!isLoggedIn && submitButton) {
            submitButton.textContent = 'Войти для бронирования';
            submitButton.classList.add('login-required');
            
            // Добавляем подсказку рядом с кнопкой
            const helpText = document.createElement('div');
            helpText.className = 'login-notice';
            helpText.textContent = 'Требуется авторизация для бронирования';
            submitButton.parentNode.insertBefore(helpText, submitButton.nextSibling);
        }
        
        // Инициализация счетчика гостей
        initGuestsCounter();
        
        // Инициализация выбора даты
        initDatePicker();
        
        // Инициализация выбора времени
        initTimePicker();
        
        // Обработчик отправки формы
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Проверяем авторизацию пользователя
            const isLoggedIn = checkUserAuthentication();
            
            if (!isLoggedIn) {
                // Если пользователь не авторизован, перенаправляем на страницу входа
                // Сохраняем URL текущей страницы в localStorage для возврата после авторизации
                localStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = 'login.html';
                return;
            }
            
            // Получаем данные формы
            const formData = {
                date: document.getElementById('booking-date').value,
                time: document.getElementById('booking-time').value,
                guestsCount: document.getElementById('guests-count').value,
                comment: document.getElementById('booking-comment').value
            };
            
            // Проверяем заполнение всех обязательных полей
            if (!formData.date) {
                showNotification('Пожалуйста, выберите дату', 'error');
                return;
            }
            
            if (!formData.time) {
                showNotification('Пожалуйста, выберите время', 'error');
                return;
            }
            
            if (!formData.guestsCount || parseInt(formData.guestsCount) < 1) {
                showNotification('Пожалуйста, укажите количество гостей', 'error');
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
    
    if (!token) {
        return false;
    }
    
    // Проверяем, не истек ли токен (если это JWT)
    try {
        // Простая проверка формата JWT (без проверки подписи)
        if (token.split('.').length === 3) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expTime = payload.exp * 1000; // exp в секундах, преобразуем в миллисекунды
            
            if (expTime < Date.now()) {
                console.log('Токен истек');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                return false;
            }
        }
    } catch (e) {
        console.error('Ошибка при проверке токена:', e);
        // Если возникла ошибка при проверке, считаем токен действительным
        // Сервер все равно проверит его при запросе
    }
    
    return true;
}

// Функция для отправки запроса на бронирование
function sendBookingRequest(formData) {
    // Получаем ID филиала из URL
    const branchId = getBranchIdFromUrl();
    if (!branchId) {
        showNotification('Не удалось определить ID заведения', 'error');
        return;
    }
    
    // Получаем токен авторизации из localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
        showNotification('Для бронирования необходимо авторизоваться', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    // Создаем объект с данными для отправки
    const bookingDateTime = createDateTime(formData.date, formData.time);
    
    // Проверяем валидность даты и времени
    if (!bookingDateTime) {
        showNotification('Указаны некорректные дата или время', 'error');
        return;
    }
    
    // Формируем данные для отправки в формате сериализатора
    const bookingData = {
        branch: parseInt(branchId),
        booking_datetime: bookingDateTime.toISOString(),
        guests_count: parseInt(formData.guestsCount),
        special_requests: formData.comment || ''
    };
    
    console.log('Отправка запроса на бронирование:', bookingData);
    
    // Показываем индикатор загрузки
    const submitBtn = document.querySelector('.btn-booking');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    
    // Отправляем запрос на сервер
    fetch('http://127.0.0.1:8000/api/bookings/create/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
    })
    .then(response => {
        if (!response.ok) {
            // Если сервер вернул ошибку, пытаемся получить детали
            return response.json().then(errorData => {
                throw new Error(JSON.stringify(errorData));
            });
        }
        return response.json();
    })
    .then(data => {
        // Обработка успешного ответа
        console.log('Ответ сервера:', data);
        
        // Показываем сообщение об успешном бронировании
        showNotification(`Бронирование успешно создано. Номер брони: ${data.booking_number}`, 'success');
        
        // Очищаем форму
        document.getElementById('booking-form').reset();
        
        // Можно перенаправить пользователя на страницу со своими бронированиями
        setTimeout(() => {
            window.location.href = 'my-bookings.html';
        }, 3000);
    })
    .catch(error => {
        // Обработка ошибок
        console.error('Ошибка при бронировании:', error);
        
        // Пытаемся получить детальное сообщение об ошибке
        let errorMessage = 'Не удалось выполнить бронирование. Пожалуйста, попробуйте позже.';
        
        try {
            const errorData = JSON.parse(error.message);
            
            // Проверяем различные возможные форматы ошибок от сервера
            if (errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData.detail) {
                errorMessage = errorData.detail;
            } else if (errorData.booking_datetime) {
                errorMessage = `Ошибка даты/времени: ${errorData.booking_datetime}`;
            } else if (errorData.guests_count) {
                errorMessage = `Ошибка количества гостей: ${errorData.guests_count}`;
            } else if (errorData.branch) {
                errorMessage = `Ошибка выбора заведения: ${errorData.branch}`;
            }
        } catch (e) {
            // Если не удалось разобрать JSON, используем общее сообщение
            errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
    })
    .finally(() => {
        // Возвращаем кнопку в исходное состояние
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    });
}

// Вспомогательная функция для создания объекта DateTime из строковых значений даты и времени
function createDateTime(dateStr, timeStr) {
    try {
        // Преобразуем строку даты в формат YYYY-MM-DD
        let formattedDate = dateStr;
        
        // Если дата в формате ДД.ММ.ГГГГ, преобразуем её
        if (dateStr.includes('.')) {
            const [day, month, year] = dateStr.split('.');
            formattedDate = `${year}-${month}-${day}`;
        }
        
        // Создаем объект даты/времени
        const dateTime = new Date(`${formattedDate}T${timeStr}`);
        
        // Проверяем валидность
        if (isNaN(dateTime.getTime())) {
            return null;
        }
        
        return dateTime;
    } catch (e) {
        console.error('Ошибка при создании даты/времени:', e);
        return null;
    }
}

// Функция для инициализации кнопки бронирования в шапке
function initBookingButton() {
    const bookingBtn = document.querySelector('.booking-btn');
    
    if (bookingBtn) {
        bookingBtn.addEventListener('click', function() {
            // Проверяем, доступно ли бронирование
            const bookingFormContainer = document.getElementById('booking-form-container');
            const noBookingMessage = document.getElementById('no-booking-message');
            
            // Плавная прокрутка к секции бронирования
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
                showNotification('Ссылка скопирована в буфер обмена', 'success');
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

// Функция для создания и отображения уведомлений
function showNotification(message, type = 'success') {
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
            showNotification('Функционал добавления фото будет реализован позже', 'info');
        });
    }

    // Кнопка отправки отзыва
    const submitReviewBtn = document.querySelector('.submit-review-btn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Проверяем авторизацию пользователя перед валидацией формы
            const isLoggedIn = checkUserAuthentication();
            
            if (!isLoggedIn) {
                // Если пользователь не авторизован, сразу перенаправляем на страницу логина
                window.location.href = 'login.html';
                return;
            }
            
            const reviewText = document.querySelector('.review-textarea textarea').value;
            
            if (selectedRating === 0) {
                showNotification('Пожалуйста, выберите рейтинг', 'error');
                return;
            }
            
            if (!reviewText.trim()) {
                showNotification('Пожалуйста, напишите отзыв', 'error');
                return;
            }
            
            // Получаем ID филиала из URL
            const branchId = getBranchIdFromUrl();
            if (!branchId) {
                showNotification('Не удалось определить ID заведения', 'error');
                return;
            }
            
            // Формируем данные для отправки
            const reviewData = {
                branch: branchId,
                rating: selectedRating,
                comment: reviewText,
                visit_date: getCurrentDate() // Текущая дата как дата посещения
            };
            
            // Отправляем отзыв
            submitReview(reviewData, function() {
                // Колбэк после успешной отправки
                resetReviewForm(stars);
                selectedRating = 0; // Сбрасываем выбранный рейтинг
                
                // Добавляем небольшую задержку перед обновлением данных,
                // чтобы дать серверу время на обработку отзыва
                setTimeout(() => {
                    // Перезагружаем данные о филиале, чтобы обновить отзывы
                    loadBranchDetails(branchId);
                }, 1000);
            });
        });
    }
}

// Получение текущей даты в формате YYYY-MM-DD
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Функция для отправки отзыва на сервер
function submitReview(reviewData, successCallback) {
    // Добавляем слеш в конце URL для Django (APPEND_SLASH=True)
    const apiUrl = 'http://127.0.0.1:8000/api/review/create/';
    
    // Получаем токен авторизации
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        showNotification('Для отправки отзыва необходимо авторизоваться', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    // Отладочная информация
    console.log('Отправляемые данные отзыва:', reviewData);
    
    // Показываем уведомление о процессе отправки
    showNotification('Отправка отзыва...', 'info');
    
    // Отправляем запрос
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
    })
    .then(response => {
        // Отладочная информация
        console.log('Статус ответа:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Если токен недействителен, перенаправляем на страницу логина
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                throw new Error('Сессия истекла. Пожалуйста, авторизуйтесь снова.');
            } else if (response.status === 400) {
                return response.json().then(data => {
                    console.log('Ошибка от сервера:', data);
                    throw new Error(Object.values(data).flat().join('\n'));
                });
            } else {
                throw new Error('Ошибка при отправке отзыва');
            }
        }
        return response.json();
    })
    .then(data => {
        console.log('Успешный ответ:', data);
        
        // Проверяем формат ответа - если сервер вернул статус 200, считаем отзыв успешно отправленным
        if (data.success || data.id || data.review_id || 
            (data.status && data.status === 'success') || 
            data.user || Object.keys(data).length > 0) {
            
            // Показываем сообщение в зависимости от ответа сервера
            if (data.message && data.message.includes('обновлен')) {
                showNotification('Ваш предыдущий отзыв был успешно обновлен! После модерации он появится на странице заведения.', 'success');
            } else {
                showNotification('Ваш отзыв успешно отправлен! После модерации он появится на странице заведения.', 'success');
            }
            
            if (successCallback) successCallback();
        } else {
            showNotification('Произошла ошибка при отправке отзыва', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        // Показываем сообщение об ошибке только если это не ошибка авторизации
        if (!error.message.includes('авторизуйтесь')) {
            showNotification(error.message || 'Произошла ошибка при отправке отзыва', 'error');
        }
    });
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