document.addEventListener('DOMContentLoaded', function() {
    loadImages();
    initFilters();
    initBookingButtons();
    loadEstablishments();
});

function loadImages() {
    if (typeof IMAGES === 'undefined') {
        console.error('Объект IMAGES не найден. Убедитесь, что файл images.js загружен перед script.js');
        return;
    }
    
    for (const key in IMAGES.restaurants) {
        const restaurant = IMAGES.restaurants[key];
        const elementId = restaurant.elementId || key.toLowerCase();
        
        const imgElement = document.getElementById(`img-restaurant-${elementId}`);
        if (imgElement) {
            if (restaurant.imageFit) {
                imgElement.style.objectFit = restaurant.imageFit;
            }
            
            if (restaurant.imagePosition) {
                imgElement.style.objectPosition = restaurant.imagePosition;
            }
            
            imgElement.src = restaurant.image;
            imgElement.alt = restaurant.name;
        } else {
            console.log(`Элемент с ID img-restaurant-${elementId} не найден для ресторана ${restaurant.name}`);
        }
    }
    
    for (const key in IMAGES.bars) {
        const bar = IMAGES.bars[key];
        const elementId = bar.elementId || key.toLowerCase();
        
        const imgElement = document.getElementById(`img-bar-${elementId}`);
        if (imgElement) {
            if (bar.imageFit) {
                imgElement.style.objectFit = bar.imageFit;
            }
            
            if (bar.imagePosition) {
                imgElement.style.objectPosition = bar.imagePosition;
            }
            
            imgElement.src = bar.image;
            imgElement.alt = bar.name;
        } else {
            console.log(`Элемент с ID img-bar-${elementId} не найден для бара ${bar.name}`);
        }
    }
}

const selectedCuisines = new Set();
const selectedPrices = new Set();
const selectedLocations = new Set();

function initFilters() {
    if (typeof FILTERS_DATA === 'undefined') {
        console.error('Объект FILTERS_DATA не найден. Убедитесь, что файл filters-data.js загружен перед script.js');
        return;
    }
    
    initFilterButtonText();
    
    const cuisineFilter = document.querySelector('.filter-item:nth-child(1) .filter-btn');
    if (cuisineFilter) {
        cuisineFilter.addEventListener('click', function() {
            showDropdown(this, FILTERS_DATA.cuisines, 'cuisine');
        });
    }
    
    const priceFilter = document.querySelector('.filter-item:nth-child(2) .filter-btn');
    if (priceFilter) {
        priceFilter.addEventListener('click', function() {
            showDropdown(this, FILTERS_DATA.prices, 'price');
        });
    }
    
    const locationFilter = document.querySelector('.filter-item:nth-child(3) .filter-btn');
    if (locationFilter) {
        locationFilter.addEventListener('click', function() {
            showDropdown(this, FILTERS_DATA.locations, 'location');
        });
    }
    
    const searchButton = document.querySelector('.search-btn');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            applyFilters();
        });
    }
    
    initSorting();
}

function initSorting() {
    const sortBtn = document.querySelector('.sort-btn');
    if (sortBtn) {
        const sortBtnText = sortBtn.querySelector('span');
        if (sortBtnText && FILTERS_DATA.sorting.title) {
            sortBtnText.textContent = FILTERS_DATA.sorting.title;
        }
        
        sortBtn.addEventListener('click', function() {
            const sortContainer = sortBtn.closest('.sort-by');
            const existingList = sortContainer.querySelector('.sort-dropdown');
            
            if (existingList) {
                existingList.remove();
                sortContainer.classList.remove('open');
                return;
            }
            
            document.querySelectorAll('.filter-dropdown').forEach(dropdown => dropdown.remove());
            document.querySelectorAll('.filter-item.open').forEach(item => {
                item.classList.remove('open');
            });
            
            sortContainer.classList.add('open');
            
            const sortList = document.createElement('div');
            sortList.className = 'sort-dropdown';
            
            FILTERS_DATA.sorting.options.forEach(sort => {
                const sortItem = document.createElement('div');
                sortItem.className = 'sort-option';
                sortItem.textContent = sort.name;
                sortItem.dataset.value = sort.value;
                
                sortItem.addEventListener('click', function() {
                    if (sortBtnText) {
                        sortBtnText.textContent = sort.name;
                    }
                    
                    // Применяем сортировку к обоим типам заведений
                    let ratingDirection = '';
                    if (sort.value === 'rating-desc') {
                        ratingDirection = 'desc';
                    } else if (sort.value === 'rating-asc') {
                        ratingDirection = 'asc';
                    }
                    
                    if (ratingDirection) {
                        loadEstablishments({ rating: ratingDirection });
                    }
                    
                    sortList.remove();
                    sortContainer.classList.remove('open');
                });
                
                sortList.appendChild(sortItem);
            });
            
            if (sortContainer) {                
                sortContainer.appendChild(sortList);
                
                document.addEventListener('click', function closeSortDropdown(e) {
                    if (!sortList.contains(e.target) && e.target !== sortBtn && !sortBtn.contains(e.target)) {
                        sortList.remove();
                        sortContainer.classList.remove('open');
                        document.removeEventListener('click', closeSortDropdown);
                    }
                });
            }
        });
    }
}

function initFilterButtonText() {
    initButtonText('.filter-item:nth-child(1) .filter-btn', selectedCuisines, 'Кухня');
    initButtonText('.filter-item:nth-child(2) .filter-btn', selectedPrices, 'Средний чек');
    initButtonText('.filter-item:nth-child(3) .filter-btn', selectedLocations, 'Местоположение');
}

function initButtonText(selector, selectedItems, defaultText) {
    const buttonText = document.querySelector(`${selector} span`);
    if (!buttonText) return;
    
    if (selectedItems.size === 0) {
        buttonText.textContent = defaultText;
    } else if (selectedItems.size === 1) {
        buttonText.textContent = Array.from(selectedItems)[0];
    } else {
        buttonText.textContent = `Выбрано ${selectedItems.size}`;
    }
}

function showDropdown(filterButton, options, filterType) {
    const filterItem = filterButton.closest('.filter-item');
    const existingDropdown = filterItem.querySelector('.filter-dropdown');
    
    document.querySelectorAll('.filter-item.open').forEach(item => {
        item.classList.remove('open');
    });
    
    if (existingDropdown) {
        existingDropdown.remove();
        return;
    }
    
    const allDropdowns = document.querySelectorAll('.filter-dropdown');
    allDropdowns.forEach(dropdown => dropdown.remove());
    
    filterItem.classList.add('open');
    
    const dropdown = document.createElement('div');
    dropdown.className = 'filter-dropdown';
    
    const checkboxes = [];
    let allCheckbox = null;
    
    let selectedSet;
    let defaultButtonText;
    
    switch (filterType) {
        case 'cuisine':
            selectedSet = selectedCuisines;
            defaultButtonText = 'Кухня';
            break;
        case 'price':
            selectedSet = selectedPrices;
            defaultButtonText = 'Средний чек';
            break;
        case 'location':
            selectedSet = selectedLocations;
            defaultButtonText = 'Местоположение';
            break;
        default:
            selectedSet = new Set();
            defaultButtonText = 'Фильтр';
    }
    
    options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'filter-option';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `filter-option-${filterType}-${option.replace(/\s+/g, '-').toLowerCase()}`;
        checkbox.className = 'custom-checkbox';
        
        if (option === 'Все') {
            checkbox.checked = selectedSet.size > 0 && (options.length - 1 === selectedSet.size);
            allCheckbox = checkbox;
        } else {
            checkbox.checked = selectedSet.has(option);
            checkboxes.push(checkbox);
        }
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        
        if (option.includes('(') && option.includes(')')) {
            const bracketIndex = option.indexOf('(');
            const mainText = option.substring(0, bracketIndex).trim();
            const bracketText = option.substring(bracketIndex);
            
            label.textContent = mainText + ' ';
            const spanElement = document.createElement('span');
            spanElement.textContent = bracketText;
            label.appendChild(spanElement);
        } else {
            label.textContent = option;
        }
        
        optionElement.appendChild(checkbox);
        optionElement.appendChild(label);
        
        checkbox.addEventListener('change', function() {
            if (checkbox.dataset.processing) return;
            
            checkbox.dataset.processing = 'true';
            handleCheckboxLogic(this, option, allCheckbox, checkboxes, selectedSet, filterButton, defaultButtonText);
            
            setTimeout(() => {
                delete checkbox.dataset.processing;
            }, 0);
        });
        
        optionElement.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (e.target === checkbox || e.target === label || label.contains(e.target)) {
                return;
            }
            
            checkbox.checked = !checkbox.checked;
            
            const changeEvent = new Event('change');
            checkbox.dispatchEvent(changeEvent);
        });
        
        dropdown.appendChild(optionElement);
    });
    
    if (filterItem) {
        filterItem.appendChild(dropdown);
    }
    
    document.addEventListener('click', function closeDropdown(e) {
        if (!dropdown.contains(e.target) && e.target !== filterButton && !filterButton.contains(e.target)) {
            dropdown.remove();
            filterItem.classList.remove('open');
            document.removeEventListener('click', closeDropdown);
        }
    });
}

function handleCheckboxLogic(checkbox, option, allCheckbox, checkboxes, selectedSet, filterButton, defaultButtonText) {
    if (option === 'Все') {
        const isChecked = checkbox.checked;
        
        checkboxes.forEach(cb => {
            cb.dataset.processing = 'true';
            cb.checked = isChecked;
            
            const itemOption = cb.nextElementSibling.textContent;
            if (isChecked) {
                selectedSet.add(itemOption);
            } else {
                selectedSet.delete(itemOption);
            }
            
            setTimeout(() => {
                delete cb.dataset.processing;
            }, 0);
        });
    } else {
        if (checkbox.checked) {
            selectedSet.add(option);
        } else {
            selectedSet.delete(option);
        }
        
        const allItemsSelected = checkboxes.every(cb => cb.checked);
        
        if (allCheckbox) {
            allCheckbox.dataset.processing = 'true';
            allCheckbox.checked = checkboxes.length > 0 && allItemsSelected;
            
            setTimeout(() => {
                delete allCheckbox.dataset.processing;
            }, 0);
        }
    }
    
    updateButtonText(filterButton, checkboxes, allCheckbox, defaultButtonText);
}

function updateButtonText(filterButton, checkboxes, allCheckbox, defaultText) {
    const buttonText = filterButton.querySelector('span');
    
    if (!buttonText) return;
    
    const selectedItems = checkboxes
        .filter(cb => cb.checked)
        .map(cb => {
            const label = cb.nextElementSibling;
            return label.textContent;
        });
    
    if (allCheckbox && allCheckbox.checked) {
        buttonText.textContent = 'Все';
        return;
    }
    
    if (selectedItems.length === 0) {
        buttonText.textContent = defaultText;
    } else if (selectedItems.length === 1) {
        let displayText = selectedItems[0];
        
        const bracketIndex = displayText.indexOf('(');
        if (bracketIndex > 0) {
            displayText = displayText.substring(0, bracketIndex).trim();
        }
        
        buttonText.textContent = displayText;
    } else {
        buttonText.textContent = `Выбрано ${selectedItems.length}`;
    }
}

function initBookingButtons() {
    const bookButtons = document.querySelectorAll('.book-btn');
    bookButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const card = this.closest('.card');
            const title = card ? card.querySelector('.card-title').textContent : 'заведение';
            
            console.log(`Бронирование столика в "${title}"`);
        });
    });
}

// Функция для загрузки заведений с API
async function loadEstablishments(params = {}) {
  try {
    // Загружаем рестораны и бары отдельными запросами
    await Promise.all([
      loadRestaurants(params),
      loadBars(params)
    ]);
  } catch (error) {
    console.error('Ошибка при загрузке заведений:', error);
  }
}

// Функция для загрузки ресторанов
async function loadRestaurants(params = {}) {
  try {
    // Строим URL с query-параметрами
    let url = 'http://127.0.0.1:8000/api/branch/';
    
    // Копируем параметры и добавляем тип заведения
    const restaurantParams = { ...params, type: 'restaurant' };
    
    const queryParams = [];
    for (const [key, value] of Object.entries(restaurantParams)) {
      if (value) {
        queryParams.push(`${key}=${encodeURIComponent(value)}`);
      }
    }
    
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }
    
    console.log('Загрузка ресторанов с URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.results) {
      // Отображаем рестораны
      displayRestaurants(data.results);
      return data.results;
    }
    return [];
  } catch (error) {
    console.error('Ошибка при загрузке ресторанов:', error);
    displayRestaurants([]);
    return [];
  }
}

// Функция для загрузки баров
async function loadBars(params = {}) {
  try {
    // Строим URL с query-параметрами
    let url = 'http://127.0.0.1:8000/api/branch/';
    
    // Копируем параметры и добавляем тип заведения
    const barParams = { ...params, type: 'bar' };
    
    const queryParams = [];
    for (const [key, value] of Object.entries(barParams)) {
      if (value) {
        queryParams.push(`${key}=${encodeURIComponent(value)}`);
      }
    }
    
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }
    
    console.log('Загрузка баров с URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.results) {
      // Отображаем бары
      displayBars(data.results);
      return data.results;
    }
    return [];
  } catch (error) {
    console.error('Ошибка при загрузке баров:', error);
    displayBars([]);
    return [];
  }
}

// Функция для отображения ресторанов
function displayRestaurants(restaurants) {
  const container = document.getElementById('restaurants-container');
  if (!container) {
    console.error('Контейнер ресторанов не найден');
    return;
  }
  
  console.log('Отображение ресторанов:', restaurants.length, restaurants);
  
  // Очищаем контейнер
  container.innerHTML = '';
  
  // Проверяем, есть ли рестораны для отображения
  if (restaurants.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'Рестораны не найдены';
    container.appendChild(emptyMessage);
    return;
  }
  
  // Добавляем карточки ресторанов
  restaurants.forEach(restaurant => {
    const priceLevel = getPriceLevel(restaurant.average_check);
    
    const card = document.createElement('div');
    card.className = 'card restaurant-card';
    card.innerHTML = `
      <div class="card-image">
        <img src="${restaurant.photo}" alt="${restaurant.name}">
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
          <p>${restaurant.cuisine_types.join(', ')} • ${priceLevel}</p>
          <p class="address">${restaurant.address}</p>
        </div>
        <a href="#" class="btn book-btn">Забронировать</a>
      </div>
    `;
    
    container.appendChild(card);
  });
}

// Функция для отображения баров
function displayBars(bars) {
  const container = document.getElementById('bars-container');
  if (!container) {
    console.error('Контейнер баров не найден');
    return;
  }
  
  console.log('Отображение баров:', bars.length, bars);
  
  // Очищаем контейнер
  container.innerHTML = '';
  
  // Проверяем, есть ли бары для отображения
  if (bars.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'Бары не найдены';
    container.appendChild(emptyMessage);
    return;
  }
  
  // Добавляем карточки баров
  bars.forEach(bar => {
    const priceLevel = getPriceLevel(bar.average_check);
    
    const card = document.createElement('div');
    card.className = 'card bar-card';
    card.innerHTML = `
      <div class="card-image">
        <img src="${bar.photo}" alt="${bar.name}">
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
          <p>${bar.cuisine_types.join(', ')} • ${priceLevel}</p>
          <p class="address">${bar.address}</p>
        </div>
        <a href="#" class="btn book-btn">Забронировать</a>
      </div>
    `;
    
    container.appendChild(card);
  });
}

// Функция для определения уровня цен (₽, ₽₽, ₽₽₽, ₽₽₽₽)
function getPriceLevel(averageCheck) {
  const check = parseFloat(averageCheck);
  
  if (check <= 1000) return '₽';
  if (check <= 2000) return '₽₽';
  if (check <= 3000) return '₽₽₽';
  return '₽₽₽₽';
}

// Функция для применения фильтров
function applyFilters() {
    const params = {};
    
    // Добавляем параметры фильтрации по кухне
    if (selectedCuisines.size > 0) {
        // Сопоставление названий кухонь с их ID в бэкенде на основе предоставленной таблицы
        const cuisineMapping = {
            'Европейская': 65,
            'Русская': 66,
            'Грузинская': 67,
            'Японская': 68,
            'Китайская': 69,
            'Итальянская': 70,
            'Корейская': 71,
            'Бельгийская': 72
        };
        
        const selectedCuisineIds = Array.from(selectedCuisines)
            .map(cuisine => {
                // Удаляем описание в скобках, если есть
                const cleanCuisine = cuisine.replace(/\s*\(.*\)\s*/, '').trim();
                return cuisineMapping[cleanCuisine];
            })
            .filter(id => id !== undefined);
        
        if (selectedCuisineIds.length > 0) {
            params.cuisine = selectedCuisineIds.join(',');
            console.log('Выбранные кухни:', Array.from(selectedCuisines), 'ID:', selectedCuisineIds);
        }
    }
    
    // Добавляем параметры фильтрации по ценовому диапазону
    if (selectedPrices.size > 0) {
        // Сопоставление ценовых диапазонов с их ID на основе кода бэкенда
        const priceMapping = {
            'Низкий (до 500р)': 1,
            'Средний (500 - 1500р)': 2,
            'Выше среднего (1500 - 2500р)': 3,
            'Высокий (2500р и выше)': 4
        };
        
        const selectedPriceIds = Array.from(selectedPrices)
            .map(price => {
                // Удаляем описание в скобках, если есть
                const cleanPrice = price.replace(/\s*\(.*\)\s*/, '').trim();
                console.log('Обработка цены:', price, 'Очищенная:', cleanPrice, 'ID:', priceMapping[price]);
                return priceMapping[price];
            })
            .filter(id => id !== undefined);
        
        if (selectedPriceIds.length > 0) {
            params.check = selectedPriceIds.join(',');
            console.log('Выбранные ценовые диапазоны:', Array.from(selectedPrices), 'ID:', selectedPriceIds);
        }
    }
    
    // Добавляем параметры фильтрации по району
    if (selectedLocations.size > 0) {
        // Сопоставление районов с их ID на основе предоставленной таблицы
        const districtMapping = {
            'Центр': 53,
            'Чуркин': 54,
            'Первая речка': 55,
            'Вторая речка': 56,
            'Тихая': 57
        };
        
        const selectedDistrictIds = Array.from(selectedLocations)
            .map(location => {
                // Удаляем описание в скобках, если есть
                const cleanLocation = location.replace(/\s*\(.*\)\s*/, '').trim();
                console.log('Обработка района:', location, 'Очищенный:', cleanLocation, 'ID:', districtMapping[location]);
                return districtMapping[location];
            })
            .filter(id => id !== undefined);
        
        if (selectedDistrictIds.length > 0) {
            params.district = selectedDistrictIds.join(',');
            console.log('Выбранные районы:', Array.from(selectedLocations), 'ID:', selectedDistrictIds);
        }
    }
    
    console.log('Итоговые параметры фильтрации:', params);
    
    // Загружаем заведения с применёнными фильтрами
    loadEstablishments(params);
}
