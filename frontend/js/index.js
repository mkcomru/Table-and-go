document.addEventListener('DOMContentLoaded', function() {
    // Загружаем список заведений с сервера
    loadRestaurants();
    
    // Инициализация поиска
    initSearch();
    
    // Инициализация фильтров
    initFilters();
});

// Функция для загрузки списка заведений
function loadRestaurants() {
    const apiUrl = 'http://127.0.0.1:8000/api/branches/';
    const restaurantsContainer = document.querySelector('.restaurants-grid');
    
    if (!restaurantsContainer) return;
    
    // Показываем индикатор загрузки
    restaurantsContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Загрузка заведений...</div>';
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при загрузке данных о заведениях');
            }
            return response.json();
        })
        .then(data => {
            // Очищаем контейнер
            restaurantsContainer.innerHTML = '';
            
            if (!data || data.length === 0) {
                restaurantsContainer.innerHTML = '<div class="no-results">Заведения не найдены</div>';
                return;
            }
            
            // Создаем карточки для каждого заведения
            data.forEach(restaurant => {
                const card = createRestaurantCard(restaurant);
                restaurantsContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Ошибка:', error);
            restaurantsContainer.innerHTML = '<div class="error-message">Не удалось загрузить список заведений. Пожалуйста, попробуйте позже.</div>';
        });
}

// Функция для создания карточки ресторана
function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    
    // Получаем главное изображение или первое доступное
    let imageUrl = 'assets/images/placeholder-restaurant.jpg'; // Путь к изображению-заглушке
    if (restaurant.gallery && restaurant.gallery.length > 0) {
        const mainImage = restaurant.gallery.find(img => img.is_main) || restaurant.gallery[0];
        imageUrl = mainImage.url;
    }
    
    // Форматируем рейтинг
    const rating = restaurant.average_rating !== undefined ? restaurant.average_rating.toFixed(1) : 'Нет';
    
    // Форматируем типы кухни
    const cuisineTypes = restaurant.cuisine_types && restaurant.cuisine_types.length > 0 
        ? restaurant.cuisine_types.join(', ') 
        : 'Не указано';
    
    // Форматируем средний чек
    const averageCheck = restaurant.average_check 
        ? `${restaurant.average_check}₽` 
        : 'Не указан';
    
    card.innerHTML = `
        <div class="restaurant-card-image">
            <img src="${imageUrl}" alt="${restaurant.name || 'Ресторан'}">
        </div>
        <div class="restaurant-card-content">
            <h3 class="restaurant-card-title">${restaurant.name || 'Без названия'}</h3>
            <div class="restaurant-card-rating">
                <i class="fas fa-star"></i>
                <span>${rating}</span>
            </div>
            <div class="restaurant-card-info">
                <div class="restaurant-card-cuisine">
                    <i class="fas fa-utensils"></i>
                    <span>${cuisineTypes}</span>
                </div>
                <div class="restaurant-card-price">
                    <i class="fas fa-wallet"></i>
                    <span>${averageCheck}</span>
                </div>
            </div>
            <div class="restaurant-card-address">
                <i class="fas fa-map-marker-alt"></i>
                <span>${restaurant.address || 'Адрес не указан'}</span>
            </div>
        </div>
        <a href="restaurant.html?id=${restaurant.id}" class="restaurant-card-link"></a>
    `;
    
    return card;
}

// Функция для инициализации поиска
function initSearch() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                // Выполняем поиск
                searchRestaurants(searchTerm);
            }
        });
    }
}

// Функция для поиска заведений
function searchRestaurants(searchTerm) {
    const apiUrl = `http://127.0.0.1:8000/api/branches/search/?q=${encodeURIComponent(searchTerm)}`;
    const restaurantsContainer = document.querySelector('.restaurants-grid');
    
    if (!restaurantsContainer) return;
    
    // Показываем индикатор загрузки
    restaurantsContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Поиск заведений...</div>';
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при поиске заведений');
            }
            return response.json();
        })
        .then(data => {
            // Очищаем контейнер
            restaurantsContainer.innerHTML = '';
            
            if (!data || data.length === 0) {
                restaurantsContainer.innerHTML = `<div class="no-results">По запросу "${searchTerm}" ничего не найдено</div>`;
                return;
            }
            
            // Создаем карточки для каждого заведения
            data.forEach(restaurant => {
                const card = createRestaurantCard(restaurant);
                restaurantsContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Ошибка:', error);
            restaurantsContainer.innerHTML = '<div class="error-message">Не удалось выполнить поиск. Пожалуйста, попробуйте позже.</div>';
        });
}

// Функция для инициализации фильтров
function initFilters() {
    const filterForm = document.getElementById('filter-form');
    
    if (filterForm) {
        // Загружаем список районов
        loadDistricts();
        
        // Загружаем типы кухни
        loadCuisineTypes();
        
        // Обработчик отправки формы фильтров
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Собираем данные фильтров
            const formData = new FormData(filterForm);
            const filters = {
                district: formData.get('district'),
                cuisine_type: formData.get('cuisine_type'),
                price_range: formData.get('price_range')
            };
            
            // Применяем фильтры
            applyFilters(filters);
        });
        
        // Кнопка сброса фильтров
        const resetButton = filterForm.querySelector('.reset-filters-btn');
        if (resetButton) {
            resetButton.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Сбрасываем значения полей формы
                filterForm.reset();
                
                // Загружаем все заведения
                loadRestaurants();
            });
        }
    }
}

// Функция для загрузки списка районов
function loadDistricts() {
    const districtSelect = document.getElementById('district-select');
    
    if (!districtSelect) return;
    
    // Загружаем список районов с API
    fetch('http://127.0.0.1:8000/api/districts/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при загрузке списка районов');
            }
            return response.json();
        })
        .then(data => {
            // Добавляем опции в select
            if (data && data.length > 0) {
                data.forEach(district => {
                    const option = document.createElement('option');
                    option.value = district.id;
                    option.textContent = district.name;
                    districtSelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке районов:', error);
        });
}

// Функция для загрузки типов кухни
function loadCuisineTypes() {
    const cuisineSelect = document.getElementById('cuisine-select');
    
    if (!cuisineSelect) return;
    
    // Загружаем список типов кухни с API
    fetch('http://127.0.0.1:8000/api/cuisine-types/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при загрузке типов кухни');
            }
            return response.json();
        })
        .then(data => {
            // Добавляем опции в select
            if (data && data.length > 0) {
                data.forEach(cuisine => {
                    const option = document.createElement('option');
                    option.value = cuisine.id;
                    option.textContent = cuisine.name;
                    cuisineSelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке типов кухни:', error);
        });
}

// Функция для применения фильтров
function applyFilters(filters) {
    // Формируем URL с параметрами фильтрации
    let apiUrl = 'http://127.0.0.1:8000/api/branches/filter/?';
    
    const params = [];
    if (filters.district) params.push(`district=${filters.district}`);
    if (filters.cuisine_type) params.push(`cuisine_type=${filters.cuisine_type}`);
    if (filters.price_range) params.push(`price_range=${filters.price_range}`);
    
    apiUrl += params.join('&');
    
    const restaurantsContainer = document.querySelector('.restaurants-grid');
    
    if (!restaurantsContainer) return;
    
    // Показываем индикатор загрузки
    restaurantsContainer.innerHTML = '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Применение фильтров...</div>';
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при применении фильтров');
            }
            return response.json();
        })
        .then(data => {
            // Очищаем контейнер
            restaurantsContainer.innerHTML = '';
            
            if (!data || data.length === 0) {
                restaurantsContainer.innerHTML = '<div class="no-results">По заданным фильтрам ничего не найдено</div>';
                return;
            }
            
            // Создаем карточки для каждого заведения
            data.forEach(restaurant => {
                const card = createRestaurantCard(restaurant);
                restaurantsContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Ошибка:', error);
            restaurantsContainer.innerHTML = '<div class="error-message">Не удалось применить фильтры. Пожалуйста, попробуйте позже.</div>';
        });
} 