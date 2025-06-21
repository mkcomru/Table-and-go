document.addEventListener('DOMContentLoaded', function() {
    loadImages();
    initFilters();
    initBookingButtons();
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
            alert('Функция поиска будет реализована позже');
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
                    
                    console.log(`Сортировка: ${sort.value}`);
                    
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
            
            const card = this.closest('.restaurant-card');
            const title = card ? card.querySelector('.card-title').textContent : 'ресторан';
            
            alert(`Бронирование столика в "${title}" будет реализовано позже`);
        });
    });
}
