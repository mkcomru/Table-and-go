const API_BASE_URL = 'http://127.0.0.1:8000';
const API_KEY = 'bc32bd3883ae477fb118378f68e61bc7';

document.addEventListener('DOMContentLoaded', function() {
    loadRestaurantsData();
    initCarouselControls();
    initBarCarousel();
});

/**
 * Выполняет запрос к API с использованием API-ключа
 * @param {string} endpoint - конечная точка API (без базового URL)
 * @param {string} method - HTTP метод (GET, POST, PUT, DELETE)
 * @param {Object} data - данные для отправки (для POST, PUT)
 * @returns {Promise} - промис с результатом запроса
 */
function makeApiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const options = {
        method: method,
        headers: {
            'Authorization': `Api-Key ${API_KEY}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка запроса: ${response.status}`);
            }
            return response.json();
        });
}

function loadRestaurantsData() {
    makeApiRequest('/api/establishments/?type=restaurant')
        .then(data => {
            renderRestaurantCards(data.results);
        })
        .catch(error => {
            console.error('Ошибка при загрузке данных ресторанов:', error);
            console.log('Загружаем локальные данные...');
            fetch('assets/data/establishments_restaurants.json')
                .then(response => response.json())
                .then(data => {
                    renderRestaurantCards(data.results);
                })
                .catch(fallbackError => {
                    console.error('Не удалось загрузить даже локальные данные:', fallbackError);
                });
        });
}

function renderRestaurantCards(restaurants) {
    const restaurantsContainer = document.getElementById('restaurants-container');
    if (!restaurantsContainer) return;

    restaurantsContainer.innerHTML = '';

    restaurants.forEach(restaurant => {
        const card = createRestaurantCard(restaurant);
        restaurantsContainer.appendChild(card);
    });
    
    updateCarouselState();
}

function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'card restaurant-card';

    let priceCategory = '';
    if (restaurant.average_check <= 500) priceCategory = '₽';
    else if (restaurant.average_check <= 1500) priceCategory = '₽₽';
    else if (restaurant.average_check <= 2500) priceCategory = '₽₽₽';
    else priceCategory = '₽₽₽₽';

    const cuisineText = restaurant.cuisine_types.join(', ');

    card.innerHTML = `
        <div class="card-image">
            <img src="${restaurant.photo}" alt="${restaurant.name}">
        </div>
        <div class="card-body">
            <div class="card-header">
                <h3 class="card-title">${restaurant.name}</h3>
                <div class="rating">
                    <i class="fas fa-star"></i>
                    <span>${restaurant.average_rating > 0 ? restaurant.average_rating.toFixed(1) : '0'}</span>
                </div>
            </div>
            <div class="card-info">
                <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${cuisineText}">${cuisineText} • ${priceCategory}</p>
                <p class="address">${restaurant.address}</p>
            </div>
            <a href="#" class="btn book-btn" data-id="${restaurant.id}">Забронировать</a>
        </div>
    `;

    return card;
}

function initCarouselControls() {
    initSingleCarousel('.popular-section.restaurant-section', '#restaurants-container');
}

function initBarCarousel() {
    initSingleCarousel('.popular-section.bars-section', '#bars-container');
}

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
    
    const getCards = () => cardsContainer.querySelectorAll('.card');
    
    prevArrow.addEventListener('click', function() {
        console.log(`Клик на стрелку "Предыдущий" в ${sectionSelector}`);
        if (currentPage > 0) {
            currentPage--;
            showPageForCarousel(cardsContainer, currentPage, prevArrow, nextArrow);
        }
    });
    
    nextArrow.addEventListener('click', function() {
        console.log(`Клик на стрелку "Следующий" в ${sectionSelector}`);
        const totalCards = getCards().length;
        const cardsPerPage = getCardsPerPage();
        const maxPage = Math.ceil(totalCards / cardsPerPage) - 1;
        
        if (currentPage < maxPage) {
            currentPage++;
            showPageForCarousel(cardsContainer, currentPage, prevArrow, nextArrow);
        }
    });
    
    updateCarouselButtons(cardsContainer, prevArrow, nextArrow, currentPage);
}

function getCardsPerPage() {
    const width = window.innerWidth;
    if (width <= 576) return 1;
    if (width <= 768) return 2;
    if (width <= 1024) return 3;
    return 4;
}

function showPageForCarousel(container, pageIndex, prevArrow, nextArrow) {
    const cardsPerPage = getCardsPerPage();
    const cards = container.querySelectorAll('.card');
    
    const cardWidth = cards.length > 0 ? cards[0].offsetWidth + 20 : 0;
    
    const translateX = -pageIndex * cardsPerPage * cardWidth;
    
    container.style.transform = `translateX(${translateX}px)`;
    
    updateCarouselButtons(container, prevArrow, nextArrow, pageIndex);
}

function updateCarouselButtons(container, prevArrow, nextArrow, currentPage = 0) {
    const cards = container.querySelectorAll('.card');
    const cardsPerPage = getCardsPerPage();
    const maxPage = Math.ceil(cards.length / cardsPerPage) - 1;
    
    if (prevArrow) {
        prevArrow.classList.toggle('disabled', currentPage <= 0);
    }
    
    if (nextArrow) {
        nextArrow.classList.toggle('disabled', currentPage >= maxPage);
    }
}

function showPage(pageIndex) {
    const container = document.getElementById('restaurants-container');
    if (!container) return;
    
    const section = document.querySelector('.popular-section.restaurant-section');
    if (!section) return;
    
    const sectionContainer = section.querySelector('.container');
    const prevArrow = sectionContainer.querySelector('.carousel-arrow.prev');
    const nextArrow = sectionContainer.querySelector('.carousel-arrow.next');
    
    showPageForCarousel(container, pageIndex, prevArrow, nextArrow);
}

function updateCarouselState(currentPage = 0) {
    const container = document.getElementById('restaurants-container');
    if (!container) return;
    
    const section = document.querySelector('.popular-section.restaurant-section');
    if (!section) return;
    
    const sectionContainer = section.querySelector('.container');
    const prevArrow = sectionContainer.querySelector('.carousel-arrow.prev');
    const nextArrow = sectionContainer.querySelector('.carousel-arrow.next');
    
    updateCarouselButtons(container, prevArrow, nextArrow, currentPage);
}

window.addEventListener('resize', function() {
    const carouselContainers = document.querySelectorAll('#restaurants-container, #bars-container');
    
    carouselContainers.forEach(container => {
        if (!container) return;
        
        const carouselContainer = container.closest('.carousel-container');
        if (!carouselContainer) return;
        
        const section = carouselContainer.closest('.popular-section');
        if (!section) return;
        
        const sectionContainer = section.querySelector('.container');
        const prevArrow = sectionContainer.querySelector('.carousel-arrow.prev');
        const nextArrow = sectionContainer.querySelector('.carousel-arrow.next');
        
        setTimeout(() => {
            container.style.transform = 'translateX(0)';
            
            updateCarouselButtons(container, prevArrow, nextArrow, 0);
        }, 100);
    });
});
