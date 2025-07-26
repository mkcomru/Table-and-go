// Данные для фильтров
const CUISINE_DATA = [
    { id: 0, name: 'Все' },
    { id: 1, name: 'Итальянская' },
    { id: 2, name: 'Европейская' },
    { id: 3, name: 'Японская' },
    { id: 4, name: 'Русская' },
    { id: 5, name: 'Грузинская' },
    { id: 6, name: 'Китайская' },
    { id: 7, name: 'Бельгийская' }
];

const PRICE_DATA = [
    { id: 0, name: 'Все' },
    { id: 1, name: 'Низкий (до 500₽)' },
    { id: 2, name: 'Средний (500-1500₽)' },
    { id: 3, name: 'Выше среднего (1500-2500₽)' },
    { id: 4, name: 'Высокий (2500₽ и выше)' }
];

const LOCATION_DATA = [
    { id: 0, name: 'Все' },
    { id: 1, name: 'Центр' },
    { id: 2, name: 'Чуркин' },
    { id: 3, name: 'Первая речка' },
    { id: 4, name: 'Вторая речка' },
    { id: 5, name: 'Тихая' },
    { id: 6, name: 'БАМ' },
    { id: 7, name: 'Эгершельд' }
];

const SORT_DATA = [
    { id: 'desc', name: 'По убыванию' },
    { id: 'asc', name: 'По возрастанию' }
];

// Наборы для хранения выбранных фильтров (множественный выбор)
const selectedCuisines = new Set();
const selectedPrices = new Set();
const selectedLocations = new Set();

// Текущие фильтры
let currentFilters = {
    cuisine: null,
    price: null,
    location: null,
    rating: null,
    type: null
};

// Инициализация фильтров при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initFilters();
    setupSortingButton();
    setupSearchButton();
    
    // Закрываем выпадающие списки при клике вне них
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.filter-item') && !e.target.closest('.sort-by')) {
            closeAllDropdowns();
        }
    });
});

// Функция для инициализации фильтров
function initFilters() {
    // Инициализация фильтра кухни
    initFilter('cuisine-filter-btn', 'cuisine-dropdown', CUISINE_DATA, 'cuisine', selectedCuisines);
    
    // Инициализация фильтра среднего чека
    initFilter('price-filter-btn', 'price-dropdown', PRICE_DATA, 'price', selectedPrices);
    
    // Инициализация фильтра местоположения
    initFilter('location-filter-btn', 'location-dropdown', LOCATION_DATA, 'location', selectedLocations);
}

// Функция для инициализации одного фильтра
function initFilter(buttonId, dropdownId, data, filterType, selectedSet) {
    const filterBtn = document.getElementById(buttonId);
    const dropdown = document.getElementById(dropdownId);
    
    if (!filterBtn || !dropdown) return;
    
    // Добавляем обработчик клика на кнопку фильтра
    filterBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Переключаем отображение выпадающего списка
        if (dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
            this.closest('.filter-item').classList.remove('open');
        } else {
            // Закрываем все другие выпадающие списки
            closeAllDropdowns();
            
            // Открываем текущий выпадающий список
            dropdown.style.display = 'block';
            this.closest('.filter-item').classList.add('open');
            
            // Заполняем выпадающий список, если он еще не заполнен
            if (dropdown.querySelector('.filter-options').children.length === 0) {
                populateFilterDropdown(dropdown, data, filterType, selectedSet, filterBtn);
            }
        }
    });
    
    // Предотвращаем закрытие при клике внутри выпадающего списка
    dropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Функция для заполнения выпадающего списка
function populateFilterDropdown(dropdown, data, filterType, selectedSet, filterBtn) {
    const optionsList = dropdown.querySelector('.filter-options');
    if (!optionsList) return;
    
    // Очищаем список
    optionsList.innerHTML = '';
    
    // Добавляем опцию "Все"
    const allOption = document.createElement('li');
    allOption.textContent = 'Все';
    allOption.setAttribute('data-id', '0');
    allOption.classList.add(selectedSet.size === 0 ? 'active' : '');
    
    allOption.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Если опция "Все" выбрана, снимаем выбор со всех других опций
        selectedSet.clear();
        
        // Обновляем отображение
        optionsList.querySelectorAll('li').forEach(li => {
            li.classList.remove('active');
        });
        allOption.classList.add('active');
        
        // Обновляем текст кнопки фильтра
        updateFilterButtonText(filterBtn, selectedSet, getDefaultTextForFilter(filterType));
    });
    
    optionsList.appendChild(allOption);
    
    // Добавляем остальные опции (кроме "Все")
    data.forEach(item => {
        if (item.id === 0) return; // Пропускаем "Все", оно уже добавлено выше
        
        const li = document.createElement('li');
        li.textContent = item.name;
        li.setAttribute('data-id', item.id);
        li.setAttribute('data-name', item.name);
        
        // Если эта опция уже была выбрана, делаем её активной
        if (selectedSet.has(item.name)) {
            li.classList.add('active');
        }
        
        // Добавляем обработчик клика для множественного выбора
        li.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Переключаем состояние выбора текущей опции
            const isSelected = this.classList.contains('active');
            
            if (isSelected) {
                // Снимаем выбор
                selectedSet.delete(this.getAttribute('data-name'));
                this.classList.remove('active');
            } else {
                // Устанавливаем выбор
                selectedSet.add(this.getAttribute('data-name'));
                this.classList.add('active');
                
                // Если выбрана конкретная опция, снимаем выбор с "Все"
                const allOptionEl = optionsList.querySelector('li[data-id="0"]');
                if (allOptionEl) {
                    allOptionEl.classList.remove('active');
                }
            }
            
            // Обновляем текст кнопки фильтра
            updateFilterButtonText(filterBtn, selectedSet, getDefaultTextForFilter(filterType));
        });
        
        optionsList.appendChild(li);
    });
}

// Вспомогательная функция для обновления текста кнопки фильтра
function updateFilterButtonText(button, selectedSet, defaultText) {
    const buttonText = button.querySelector('span');
    if (!buttonText) return;
    
    if (selectedSet.size === 0) {
        buttonText.textContent = defaultText;
    } else if (selectedSet.size === 1) {
        buttonText.textContent = Array.from(selectedSet)[0];
    } else {
        buttonText.textContent = `Выбрано ${selectedSet.size}`;
    }
}

// Возвращает текст по умолчанию для фильтра
function getDefaultTextForFilter(filterType) {
    switch(filterType) {
        case 'cuisine': return 'Кухня';
        case 'price': return 'Средний чек';
        case 'location': return 'Местоположение';
        default: return 'Фильтр';
    }
}

// Функция для настройки кнопки сортировки
function setupSortingButton() {
    const sortBtn = document.querySelector('.sort-btn');
    if (!sortBtn) return;
    
    // Создаем выпадающий список для сортировки, если его еще нет
    let sortDropdown = document.querySelector('.sort-dropdown');
    if (!sortDropdown) {
        sortDropdown = document.createElement('div');
        sortDropdown.className = 'sort-dropdown';
        sortDropdown.style.display = 'none';
        
        SORT_DATA.forEach(item => {
            const option = document.createElement('div');
            option.className = 'sort-option';
            option.textContent = item.name;
            option.setAttribute('data-value', item.id);
            
            option.addEventListener('click', function() {
                // Обновляем текст кнопки сортировки
                sortBtn.querySelector('span').textContent = this.textContent;
                
                // Сохраняем выбранную сортировку
                currentFilters.rating = this.getAttribute('data-value');
                
                // Закрываем выпадающий список
                sortDropdown.style.display = 'none';
                sortBtn.closest('.sort-by').classList.remove('open');
            });
            
            sortDropdown.appendChild(option);
        });
        
        // Добавляем выпадающий список в DOM
        sortBtn.closest('.sort-by').appendChild(sortDropdown);
    }
    
    // Добавляем обработчик клика на кнопку сортировки
    sortBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Закрываем все выпадающие списки фильтров
        closeAllDropdowns();
        
        // Переключаем состояние выпадающего списка сортировки
        const sortBy = this.closest('.sort-by');
        sortBy.classList.toggle('open');
        
        if (sortBy.classList.contains('open')) {
            sortDropdown.style.display = 'block';
        } else {
            sortDropdown.style.display = 'none';
        }
    });
}

// Функция для настройки кнопки поиска
function setupSearchButton() {
    const searchBtn = document.getElementById('search-btn');
    if (!searchBtn) return;
    
    searchBtn.addEventListener('click', function() {
        // Применяем фильтры только при нажатии на кнопку
        applyFilters();
        
        // Закрываем все выпадающие списки
        closeAllDropdowns();
    });
}

// Функция для закрытия всех выпадающих списков
function closeAllDropdowns(exceptItem = null) {
    document.querySelectorAll('.filter-item.open').forEach(item => {
        if (item !== exceptItem) {
            item.classList.remove('open');
            const dropdown = item.querySelector('.filter-dropdown');
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }
    });
    
    document.querySelectorAll('.sort-by.open').forEach(item => {
        if (item !== exceptItem) {
            item.classList.remove('open');
            const dropdown = item.querySelector('.sort-dropdown');
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }
    });
}

// Функция для применения фильтров и запроса данных
function applyFilters() {
    // Формируем параметры запроса
    const params = new URLSearchParams();
    
    // Добавляем параметры фильтрации по кухне
    if (selectedCuisines.size > 0) {
        const cuisineIds = Array.from(selectedCuisines).map(cuisine => {
            // Находим ID кухни по имени
            const cuisineObj = CUISINE_DATA.find(item => item.name === cuisine);
            return cuisineObj ? cuisineObj.id : null;
        }).filter(id => id !== null);
        
        if (cuisineIds.length > 0) {
            params.append('cuisine', cuisineIds.join(','));
        }
    }
    
    // Добавляем параметры фильтрации по цене
    if (selectedPrices.size > 0) {
        const priceIds = Array.from(selectedPrices).map(price => {
            // Находим ID ценовой категории по имени
            const priceObj = PRICE_DATA.find(item => item.name === price);
            return priceObj ? priceObj.id : null;
        }).filter(id => id !== null);
        
        if (priceIds.length > 0) {
            params.append('check', priceIds.join(','));
        }
    }
    
    // Добавляем параметры фильтрации по местоположению
    if (selectedLocations.size > 0) {
        const locationIds = Array.from(selectedLocations).map(location => {
            // Находим ID местоположения по имени
            const locationObj = LOCATION_DATA.find(item => item.name === location);
            return locationObj ? locationObj.id : null;
        }).filter(id => id !== null);
        
        if (locationIds.length > 0) {
            params.append('district', locationIds.join(','));
        }
    }
    
    if (currentFilters.rating) {
        params.append('rating', currentFilters.rating);
    }
    
    // Загружаем рестораны с примененными фильтрами
    fetchFilteredEstablishments('restaurant', params.toString());
    
    // Загружаем бары с примененными фильтрами
    fetchFilteredEstablishments('bar', params.toString());
}

// Функция для загрузки отфильтрованных заведений
function fetchFilteredEstablishments(type, queryParams) {
    // Определяем идентификаторы контейнеров
    const containerId = type === 'restaurant' ? 'restaurants-container' : 'bars-container';
    // Для renderCards нужно передавать именно эти ID
    const sliderContainerId = containerId;
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    // Очищаем контейнер для индикации загрузки
    container.innerHTML = '<div class="empty-message"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>';
    
    // Формируем URL для запроса
    let apiUrl = `http://127.0.0.1:8000/api/branch/?type=${type}`;
    if (queryParams) {
        apiUrl += `&${queryParams}`;
    }
    
    // Выполняем запрос
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка при загрузке данных: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Проверяем доступность функции renderCards
            if (typeof window.renderCards === 'function') {
                // Используем оригинальную функцию renderCards для единообразного отображения
                window.renderCards(data.results || [], sliderContainerId);
            } else {
                console.error('Функция renderCards не найдена в глобальной области');
                // Если основная функция недоступна, используем локальную версию
                renderCardsLocal(data.results || [], containerId);
            }
        })
        .catch(error => {
            console.error(`Ошибка при загрузке ${type}:`, error);
            
            // Показываем сообщение об ошибке в соответствующем контейнере
            container.innerHTML = '<div class="empty-message">Не удалось загрузить данные. Пожалуйста, попробуйте позже.</div>';
        });
}

// Локальная версия функции renderCards (на случай если глобальная недоступна)
function renderCardsLocal(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Очищаем контейнер
    container.innerHTML = '';
    
    // Если нет элементов, показываем сообщение
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-message">Заведения не найдены</div>';
        return;
    }
    
    // Создаем карточки для каждого заведения, полностью идентичные карточкам из глобальной функции renderCards
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-id', item.id);
        
        // Добавляем обработчик клика для перехода на страницу ресторана
        card.addEventListener('click', function() {
            window.location.href = `restaurant.html?id=${item.id}`;
        });
        
        // Создаем содержимое карточки
        const imageUrl = item.main_image || 'assets/images/default-restaurant.jpg';
        
        card.innerHTML = `
            <div class="card-image" style="background-image: url('${imageUrl}')">
                <div class="card-rating">
                    <i class="fas fa-star"></i>
                    <span>${item.average_rating ? item.average_rating.toFixed(1) : 'Нет'}</span>
                </div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.name}</h3>
                <div class="card-info">
                    <div class="card-cuisine">
                        <i class="fas fa-utensils"></i>
                        <span>${item.establishment && item.establishment.cuisines ? 
                            item.establishment.cuisines.map(c => c.name).join(', ') : 'Разная кухня'}</span>
                    </div>
                    <div class="card-price">
                        <i class="fas fa-wallet"></i>
                        <span>${item.average_check ? `${item.average_check}₽` : 'Цена не указана'}</span>
                    </div>
                </div>
                <div class="card-address">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${item.address || 'Адрес не указан'}</span>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    // Если существует функция initSlider, вызываем её
    if (typeof window.initSlider === 'function') {
        window.initSlider(containerId);
    }
} 