// Функция для создания карточки ресторана
function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'card restaurant-card';
    card.setAttribute('data-id', restaurant.id);
    
    // Добавляем обработчик клика для перехода на страницу ресторана
    card.addEventListener('click', function() {
        window.location.href = `restaurant.html?id=${restaurant.id}`;
    });
    
    card.innerHTML = `
        <div class="card-image">
            <img src="${restaurant.image}" alt="${restaurant.name}">
        </div>
        <div class="card-body">
            <div class="card-header">
                <h3 class="card-title">${restaurant.name}</h3>
                <div class="rating">
                    <i class="fas fa-star"></i>
                    <span>${restaurant.rating}</span>
                </div>
            </div>
            <div class="card-info">
                <div class="cuisine">${restaurant.cuisine}</div>
                <div class="address">${restaurant.address}</div>
            </div>
            <button class="book-btn">Забронировать</button>
        </div>
    `;
    
    // Добавляем обработчик для кнопки бронирования
    const bookBtn = card.querySelector('.book-btn');
    bookBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Предотвращаем всплытие события клика
        window.location.href = `restaurant.html?id=${restaurant.id}#booking-section`;
    });
    
    return card;
}

// Функция для создания карточки бара
function createBarCard(bar) {
    const card = document.createElement('div');
    card.className = 'card bar-card';
    card.setAttribute('data-id', bar.id);
    
    // Добавляем обработчик клика для перехода на страницу бара
    card.addEventListener('click', function() {
        window.location.href = `restaurant.html?id=${bar.id}`;
    });
    
    card.innerHTML = `
        <div class="card-image">
            <img src="${bar.image}" alt="${bar.name}">
        </div>
        <div class="card-body">
            <div class="card-header">
                <h3 class="card-title">${bar.name}</h3>
                <div class="rating">
                    <i class="fas fa-star"></i>
                    <span>${bar.rating}</span>
                </div>
            </div>
            <div class="card-info">
                <div class="cuisine">${bar.cuisine}</div>
                <div class="address">${bar.address}</div>
            </div>
            <button class="book-btn">Забронировать</button>
        </div>
    `;
    
    // Добавляем обработчик для кнопки бронирования
    const bookBtn = card.querySelector('.book-btn');
    bookBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Предотвращаем всплытие события клика
        window.location.href = `restaurant.html?id=${bar.id}#booking-section`;
    });
    
    return card;
}

// Функция для загрузки заведений с сервера
function loadEstablishments() {
    // В реальном проекте здесь будет запрос к API
    // Для демонстрации используем заглушки
    
    // Загрузка ресторанов
    fetchRestaurants()
        .then(restaurants => {
            displayRestaurants(restaurants);
        })
        .catch(error => {
            console.error('Ошибка при загрузке ресторанов:', error);
            displayEmptyMessage('restaurants-container', 'Не удалось загрузить рестораны');
        });
    
    // Загрузка баров
    fetchBars()
        .then(bars => {
            displayBars(bars);
        })
        .catch(error => {
            console.error('Ошибка при загрузке баров:', error);
            displayEmptyMessage('bars-container', 'Не удалось загрузить бары');
        });
}

// Функция для отображения ресторанов
function displayRestaurants(restaurants) {
    const container = document.getElementById('restaurants-container');
    
    if (!container) {
        console.error('Контейнер для ресторанов не найден');
        return;
    }
    
    if (restaurants.length === 0) {
        displayEmptyMessage('restaurants-container', 'Рестораны не найдены');
        return;
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Добавляем карточки ресторанов
    restaurants.forEach(restaurant => {
        const card = createRestaurantCard(restaurant);
        container.appendChild(card);
    });
}

// Функция для отображения баров
function displayBars(bars) {
    const container = document.getElementById('bars-container');
    
    if (!container) {
        console.error('Контейнер для баров не найден');
        return;
    }
    
    if (bars.length === 0) {
        displayEmptyMessage('bars-container', 'Бары не найдены');
        return;
    }
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Добавляем карточки баров
    bars.forEach(bar => {
        const card = createBarCard(bar);
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

// Функция для получения данных о ресторанах с сервера
function fetchRestaurants() {
    // В реальном проекте здесь будет запрос к API
    // Для демонстрации используем заглушку
    return new Promise((resolve) => {
        setTimeout(() => {
            const restaurants = [
                {
                    id: 1,
                    name: 'Токио Kawaii',
                    cuisine: 'Японская кухня',
                    address: 'ул. Светланская, д.83',
                    rating: 4.8,
                    image: 'assets/images/restaurants/Tokyo_Kawaii_1.jpg'
                },
                {
                    id: 2,
                    name: 'Итальяно',
                    cuisine: 'Итальянская кухня',
                    address: 'ул. Пушкинская, д.17',
                    rating: 4.5,
                    image: 'assets/images/restaurants/Italiano_1.jpg'
                },
                {
                    id: 3,
                    name: 'Морской бриз',
                    cuisine: 'Морепродукты',
                    address: 'ул. Набережная, д.10',
                    rating: 4.7,
                    image: 'assets/images/restaurants/SeaBreeze_1.jpg'
                },
                {
                    id: 4,
                    name: 'Русский двор',
                    cuisine: 'Русская кухня',
                    address: 'ул. Ленина, д.45',
                    rating: 4.6,
                    image: 'assets/images/restaurants/RussianYard_1.jpg'
                }
            ];
            resolve(restaurants);
        }, 500);
    });
}

// Функция для получения данных о барах с сервера
function fetchBars() {
    // В реальном проекте здесь будет запрос к API
    // Для демонстрации используем заглушку
    return new Promise((resolve) => {
        setTimeout(() => {
            const bars = [
                {
                    id: 5,
                    name: 'Craft Beer',
                    cuisine: 'Крафтовое пиво',
                    address: 'ул. Алеутская, д.15',
                    rating: 4.9,
                    image: 'assets/images/bars/CraftBeer_1.jpg'
                },
                {
                    id: 6,
                    name: 'Wine & Cheese',
                    cuisine: 'Винный бар',
                    address: 'ул. Фонтанная, д.22',
                    rating: 4.7,
                    image: 'assets/images/bars/WineCheese_1.jpg'
                },
                {
                    id: 7,
                    name: 'Whiskey Bar',
                    cuisine: 'Виски-бар',
                    address: 'ул. Океанский пр-т, д.7',
                    rating: 4.8,
                    image: 'assets/images/bars/WhiskeyBar_1.jpg'
                },
                {
                    id: 8,
                    name: 'Cocktail Heaven',
                    cuisine: 'Коктейль-бар',
                    address: 'ул. Посьетская, д.12',
                    rating: 4.6,
                    image: 'assets/images/bars/CocktailHeaven_1.jpg'
                }
            ];
            resolve(bars);
        }, 700);
    });
} 