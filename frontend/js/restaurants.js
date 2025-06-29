// Функция для создания карточки заведения
function createEstablishmentCard(establishment) {
    const card = document.createElement('div');
    card.className = 'card restaurant-card';
    card.setAttribute('data-id', establishment.id);
    
    // Добавляем обработчик клика для перехода на страницу заведения
    card.addEventListener('click', function() {
        window.location.href = `restaurant.html?id=${establishment.id}`;
    });
    
    // Получаем данные для отображения
    let photo = establishment.photo;
    
    // Если фото нет, пробуем найти локальное изображение по названию заведения
    if (!photo || photo === '') {
        const name = establishment.name.replace(/\s+/g, '_');
        const type = establishment.establishment_type === 'bar' ? 'bars' : 'restaurants';
        const localPath = `assets/images/${type}/${name}.jpg`;
        
        // Проверяем, существует ли такое локальное изображение
        photo = localPath;
    }
    
    const defaultImage = 'assets/images/vdk_panorama.png'; // Используем существующее изображение как заглушку
    const rating = parseFloat(establishment.rating || 0).toFixed(1);
    const cuisines = Array.isArray(establishment.cuisine_types) && establishment.cuisine_types.length > 0 
        ? establishment.cuisine_types.join(', ') 
        : 'Разная кухня';
    
    // Формируем строку с адресом
    let addressText = '';
    if (establishment.address) {
        addressText = establishment.address;
        if (establishment.district) {
            addressText += `, ${establishment.district}`;
        }
    } else if (establishment.district) {
        addressText = establishment.district;
    } else {
        addressText = 'Адрес не указан';
    }
    
    // Определяем символы для среднего чека
    let priceCategory = '';
    const avgCheck = establishment.average_check || 0;
    if (avgCheck <= 500) priceCategory = '₽';
    else if (avgCheck <= 1500) priceCategory = '₽₽';
    else if (avgCheck <= 2500) priceCategory = '₽₽₽';
    else priceCategory = '₽₽₽₽';
    
    card.innerHTML = `
        <div class="card-image">
            <img src="${photo}" alt="${establishment.name}" onerror="this.src='${defaultImage}'">
        </div>
        <div class="card-body">
            <div class="card-header">
                <h3 class="card-title">${establishment.name}</h3>
                <div class="rating">
                    <i class="fas fa-star"></i>
                    <span>${rating}</span>
                </div>
            </div>
            <div class="card-info">
                <div class="cuisine-price">
                    <span class="cuisine">${cuisines}</span>
                    <span class="price-category">${priceCategory}</span>
                </div>
                <div class="address">${addressText}</div>
            </div>
            <button class="book-btn">Забронировать</button>
        </div>
    `;
    
    // Добавляем обработчик для кнопки бронирования
    const bookBtn = card.querySelector('.book-btn');
    bookBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Предотвращаем всплытие события клика
        window.location.href = `restaurant.html?id=${establishment.id}#booking-section`;
    });
    
    return card;
}

// Функция для загрузки заведений с сервера
function loadEstablishments() {
    console.log('Загрузка данных о заведениях...');
    
    // Проверяем, загружены ли уже данные
    const restaurantsLoaded = document.querySelector('#restaurants-container .card');
    const barsLoaded = document.querySelector('#bars-container .card');
    
    // Загрузка ресторанов, если они еще не загружены
    if (!restaurantsLoaded) {
        fetchEstablishments('restaurant')
            .then(restaurants => {
                console.log('Получены рестораны:', restaurants);
                displayEstablishments(restaurants, 'restaurants-container');
            })
            .catch(error => {
                console.error('Ошибка при загрузке ресторанов:', error);
                displayEmptyMessage('restaurants-container', 'Не удалось загрузить рестораны');
            });
    }
    
    // Загрузка баров, если они еще не загружены
    if (!barsLoaded) {
        fetchEstablishments('bar')
            .then(bars => {
                console.log('Получены бары:', bars);
                displayEstablishments(bars, 'bars-container');
            })
            .catch(error => {
                console.error('Ошибка при загрузке баров:', error);
                displayEmptyMessage('bars-container', 'Не удалось загрузить бары');
            });
    }
}

// Функция для отображения заведений
function displayEstablishments(establishments, containerId) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Контейнер ${containerId} не найден`);
        return;
    }
    
    if (!establishments || establishments.length === 0) {
        displayEmptyMessage(containerId, 'Заведения не найдены');
        return;
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Добавляем карточки заведений
    establishments.forEach(establishment => {
        const card = createEstablishmentCard(establishment);
        container.appendChild(card);
    });
}

// Функция для отображения сообщения о пустом результате
function displayEmptyMessage(containerId, message) {
    const container = document.getElementById(containerId);
    
    if (container) {
        container.innerHTML = `<div class="empty-message">${message}</div>`;
    }
}

// Функция для получения данных о заведениях с сервера
function fetchEstablishments(type) {
    const apiUrl = `http://127.0.0.1:8000/api/branch/?type=${type}`;
    
    console.log(`Запрос к API: ${apiUrl}`);
    
    return fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Данные с сервера (${type}):`, data);
            console.log(`Структура данных:`, JSON.stringify(data).substring(0, 300) + '...');
            
            // Проверяем структуру данных (пагинация)
            const results = data.results || data;
            
            if (Array.isArray(results)) {
                console.log(`Найдено ${results.length} записей типа ${type}`);
                
                // Выводим пример первой записи для отладки
                if (results.length > 0) {
                    console.log(`Пример записи:`, results[0]);
                }
                
                return results.map(item => {
                    return {
                        id: item.id,
                        name: item.establishment_name || item.name,
                        address: item.address || '',
                        district: item.district || '',
                        rating: item.rating || 0,
                        photo: item.photo || '',
                        cuisine_types: item.cuisine_types || [],
                        average_check: item.average_check || 0,
                        establishment_type: type
                    };
                });
            } else {
                console.error('Полученные данные не содержат массив результатов:', data);
                return [];
            }
        })
        .catch(error => {
            console.error(`Ошибка при получении данных (${type}):`, error);
            return [];
        });
}

// Инициализация загрузки данных при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем данные только один раз при загрузке страницы
    loadEstablishments();
    
    // Инициализация карусели после загрузки данных
    setTimeout(() => {
        initCarouselControls();
    }, 1000);
});

// Функция для инициализации карусели
function initCarouselControls() {
    const restaurantSection = document.querySelector('.popular-section.restaurant-section');
    const barsSection = document.querySelector('.popular-section.bars-section');
    
    if (restaurantSection) {
        initSingleCarousel('.popular-section.restaurant-section', '#restaurants-container');
    }
    
    if (barsSection) {
        initSingleCarousel('.popular-section.bars-section', '#bars-container');
    }
}

// Функция для инициализации одной карусели
function initSingleCarousel(sectionSelector, containerSelector) {
    const section = document.querySelector(sectionSelector);
    if (!section) return;
    
    const container = section.querySelector('.container');
    const prevArrow = container.querySelector('.carousel-arrow.prev');
    const nextArrow = container.querySelector('.carousel-arrow.next');
    const cardsContainer = container.querySelector(containerSelector);
    
    if (!prevArrow || !nextArrow || !cardsContainer) {
        console.error(`Элементы карусели не найдены в секции ${sectionSelector}!`);
        return;
    }
    
    console.log(`Карусель инициализирована для секции ${sectionSelector}`);
    
    let currentPage = 0;
    
    prevArrow.addEventListener('click', function() {
        if (currentPage > 0) {
            currentPage--;
            showPageForCarousel(cardsContainer, currentPage, prevArrow, nextArrow);
        }
    });
    
    nextArrow.addEventListener('click', function() {
        const totalCards = cardsContainer.querySelectorAll('.card').length;
        const cardsPerPage = getCardsPerPage();
        const maxPage = Math.ceil(totalCards / cardsPerPage) - 1;
        
        if (currentPage < maxPage) {
            currentPage++;
            showPageForCarousel(cardsContainer, currentPage, prevArrow, nextArrow);
        }
    });
    
    updateCarouselButtons(cardsContainer, prevArrow, nextArrow, currentPage);
}

// Функция для определения количества карточек на странице в зависимости от ширины экрана
function getCardsPerPage() {
    const width = window.innerWidth;
    if (width <= 576) return 1;
    if (width <= 768) return 2;
    if (width <= 1024) return 3;
    return 4;
}

// Функция для отображения определенной страницы карусели
function showPageForCarousel(container, pageIndex, prevArrow, nextArrow) {
    const cardsPerPage = getCardsPerPage();
    const cards = container.querySelectorAll('.card');
    
    const cardWidth = cards.length > 0 ? cards[0].offsetWidth + 20 : 0;
    
    const translateX = -pageIndex * cardsPerPage * cardWidth;
    
    container.style.transform = `translateX(${translateX}px)`;
    
    updateCarouselButtons(container, prevArrow, nextArrow, pageIndex);
}

// Функция для обновления состояния кнопок карусели
function updateCarouselButtons(container, prevArrow, nextArrow, currentPage = 0) {
    const cards = container.querySelectorAll('.card');
    const cardsPerPage = getCardsPerPage();
    const maxPage = Math.ceil(cards.length / cardsPerPage) - 1;
    
    prevArrow.classList.toggle('disabled', currentPage <= 0);
    nextArrow.classList.toggle('disabled', currentPage >= maxPage);
} 