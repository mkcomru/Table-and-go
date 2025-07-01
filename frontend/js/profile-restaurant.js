document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации и роли пользователя
    checkAuthAndRole();
});

// Функция для проверки авторизации и роли пользователя
function checkAuthAndRole() {
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    // Если нет токена, перенаправляем на страницу входа
    if (!authToken) {
        window.location.href = 'login.html?redirect=profile-restaurant.html';
        return;
    }
    
    // Проверяем, является ли пользователь персоналом ресторана
    const isStaff = userData.is_staff === true;
    const isAdmin = userData.is_superuser === true || userData.is_system_admin === true;
    
    // Если пользователь не является персоналом ресторана и не является администратором,
    // перенаправляем на обычную страницу профиля
    if (!isStaff && !isAdmin) {
        window.location.href = 'profile.html';
        return;
    }
    
    // Если авторизация и проверка роли прошли успешно, инициализируем компоненты
    initUserDropdown();
    initProfileForm();
    initPhotoUpload();
    initMenuUpload();
    
    // Загружаем информацию о филиалах пользователя
    loadBranchInfo();
    
    // Обновляем имя пользователя в шапке
    updateUserInfo(userData);
    
    // Добавляем заголовок "Панель администратора ресторана"
    setupAdminHeader();
}

// Функция для настройки заголовка администратора
function setupAdminHeader() {
    // Проверяем, есть ли уже заголовок администратора
    let adminHeader = document.querySelector('.admin-header');
    
    // Если заголовка нет, создаем его
    if (!adminHeader) {
        const header = document.querySelector('header');
        
        adminHeader = document.createElement('div');
        adminHeader.className = 'admin-header';
        adminHeader.innerHTML = `
            <div class="container">
                <div class="admin-header-content">
                    <h1>Панель администратора ресторана</h1>
                </div>
            </div>
        `;
        
        // Вставляем заголовок после шапки
        if (header && header.nextSibling) {
            header.parentNode.insertBefore(adminHeader, header.nextSibling);
        } else if (header) {
            header.parentNode.appendChild(adminHeader);
        }
    }
}

// Инициализация выпадающего меню пользователя
function initUserDropdown() {
    const userProfile = document.querySelector('.user-profile');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (userProfile) {
        userProfile.addEventListener('click', function() {
            this.classList.toggle('active');
        });
        
        // Закрываем выпадающее меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!userProfile.contains(e.target)) {
                userProfile.classList.remove('active');
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Функция для выхода из системы
function logout() {
    // Удаляем токен и данные пользователя
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_data');
    
    // Перенаправляем на страницу входа
    window.location.href = 'login.html';
}

// Обновление информации о пользователе
function updateUserInfo(userData) {
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        let displayName = 'Администратор';
        
        if (userData.first_name && userData.last_name) {
            displayName = `${userData.first_name} ${userData.last_name}`;
        } else if (userData.first_name) {
            displayName = userData.first_name;
        } else if (userData.username) {
            displayName = userData.username;
        }
        
        // Если есть информация о ресторане, добавляем её
        if (window.currentBranchName) {
            displayName = `Администратор ${window.currentBranchName}`;
        }
        
        userNameElement.textContent = displayName;
    }
}

// Загрузка информации о филиале
function loadBranchInfo() {
    const authToken = localStorage.getItem('authToken');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    // Проверяем, является ли пользователь суперпользователем или системным администратором
    const isAdmin = userData.is_superuser === true || userData.is_system_admin === true;
    
    // Если пользователь является администратором системы, получаем список всех филиалов
    if (isAdmin) {
        fetch('http://127.0.0.1:8000/api/branch/', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при загрузке филиалов');
            }
            return response.json();
        })
        .then(data => {
            const branches = data.results || data;
            
            if (branches && branches.length > 0) {
                // Сохраняем ID первого филиала
                const branchId = branches[0].id;
                
                // Загружаем детальную информацию о филиале
                loadBranchDetails(branchId);
            } else {
                showNotification('Нет доступных филиалов', 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке филиалов:', error);
            showNotification('Ошибка при загрузке филиалов', 'error');
        });
    } else {
        // Для обычных администраторов филиалов получаем только их филиалы
        fetch('http://127.0.0.1:8000/api/branch-admin/', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при загрузке филиалов');
            }
            return response.json();
        })
        .then(data => {
            const branchAdmins = data.results || data;
            
            if (branchAdmins && branchAdmins.length > 0) {
                // Получаем ID филиала, которым управляет администратор
                const branchId = branchAdmins[0].branch;
                
                // Загружаем детальную информацию о филиале
                loadBranchDetails(branchId);
            } else {
                showNotification('У вас нет доступа к филиалам', 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке филиалов:', error);
            showNotification('Ошибка при загрузке филиалов', 'error');
        });
    }
}

// Загрузка данных филиала
function loadBranchDetails(branchId) {
    const authToken = localStorage.getItem('authToken');
    
    // Сохраняем ID филиала в глобальной переменной для дальнейшего использования
    window.currentBranchId = branchId;
    
    // Загружаем детальную информацию о филиале
    fetch(`http://127.0.0.1:8000/api/branch/${branchId}/`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при загрузке данных филиала');
        }
        return response.json();
    })
    .then(data => {
        // Сохраняем название филиала
        window.currentBranchName = data.name;
        
        // Обновляем имя пользователя в шапке с названием ресторана
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        updateUserInfo(userData);
        
        // Заполняем форму данными филиала
        fillProfileForm(data);
        
        // Если в ответе есть фотографии, отображаем их
        if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
            renderBranchPhotos(data.gallery);
        }
        
        // Обновляем статус меню
        if (data.menu_pdf) {
            updateMenuStatus(data.menu_pdf);
        }
    })
    .catch(error => {
        console.error('Ошибка при загрузке данных филиала:', error);
        showNotification('Ошибка при загрузке данных филиала', 'error');
    });
}

// Обновление статуса меню
function updateMenuStatus(menuUrl) {
    const menuStatusText = document.getElementById('menu-status-text');
    if (menuStatusText) {
        if (menuUrl) {
            const menuFileName = menuUrl.split('/').pop();
            menuStatusText.innerHTML = `
                Меню загружено: <a href="${menuUrl}" target="_blank">${menuFileName}</a>
            `;
        } else {
            menuStatusText.textContent = 'Меню не загружено';
        }
    }
}

// Заполнение формы профиля данными
function fillProfileForm(branchData) {
    document.getElementById('restaurant-name').value = branchData.name || '';
    
    // Обработка данных о кухне
    if (branchData.cuisine_types && Array.isArray(branchData.cuisine_types)) {
        document.getElementById('restaurant-cuisine').value = branchData.cuisine_types.join(', ');
    } else {
        document.getElementById('restaurant-cuisine').value = branchData.cuisine || '';
    }
    
    document.getElementById('restaurant-address').value = branchData.address || '';
    document.getElementById('restaurant-phone').value = branchData.phone || '';
    
    // Обработка часов работы
    if (branchData.working_hours && Array.isArray(branchData.working_hours)) {
        const workingHoursText = branchData.working_hours
            .map(day => {
                return `${day.day_name}: ${day.status || (day.is_closed ? 'Выходной' : `${day.opening_time} - ${day.closing_time}`)}`;
            })
            .join('; ');
        document.getElementById('restaurant-hours').value = workingHoursText;
    } else {
        document.getElementById('restaurant-hours').value = branchData.working_hours || '';
    }
    
    document.getElementById('restaurant-avg-check').value = branchData.average_check || '';
    document.getElementById('restaurant-description').value = branchData.description || '';
    
    // Если есть главное фото, устанавливаем его
    if (branchData.gallery && Array.isArray(branchData.gallery) && branchData.gallery.length > 0) {
        const mainPhoto = branchData.gallery.find(photo => photo.is_main);
        if (mainPhoto) {
            document.getElementById('main-photo-preview').src = mainPhoto.url;
        }
    } else if (branchData.main_photo) {
        document.getElementById('main-photo-preview').src = branchData.main_photo;
    }
}

// Отображение фотографий филиала
function renderBranchPhotos(photos) {
    const photosGrid = document.querySelector('.photos-grid');
    
    // Очищаем сетку от существующих фотографий (кроме заглушек для добавления)
    const existingPhotos = photosGrid.querySelectorAll('.photo-item:not(.add-photo)');
    existingPhotos.forEach(photo => photo.remove());
    
    // Добавляем фотографии в начало сетки
    photos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.setAttribute('data-id', photo.id);
        
        photoItem.innerHTML = `
            <img src="${photo.url || photo.image}" alt="Фото ресторана">
            <div class="photo-actions">
                <button class="photo-action-btn delete-photo" title="Удалить фото"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Добавляем обработчик для кнопки удаления
        const deleteBtn = photoItem.querySelector('.delete-photo');
        deleteBtn.addEventListener('click', function() {
            deletePhoto(photo.id);
        });
        
        // Добавляем фото в начало сетки (перед заглушками для добавления)
        const addPhotoItems = photosGrid.querySelectorAll('.add-photo');
        if (addPhotoItems.length > 0) {
            photosGrid.insertBefore(photoItem, addPhotoItems[0]);
        } else {
            photosGrid.appendChild(photoItem);
        }
    });
}

// Инициализация формы профиля
function initProfileForm() {
    const saveBtn = document.getElementById('save-profile');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            saveProfileChanges();
        });
    }
}

// Сохранение изменений профиля
function saveProfileChanges() {
    const authToken = localStorage.getItem('authToken');
    
    // Собираем данные формы
    const branchData = {
        name: document.getElementById('restaurant-name').value,
        address: document.getElementById('restaurant-address').value,
        phone: document.getElementById('restaurant-phone').value,
        average_check: document.getElementById('restaurant-avg-check').value,
        description: document.getElementById('restaurant-description').value
    };
    
    // Отправляем запрос на обновление данных филиала
    fetch(`http://127.0.0.1:8000/api/branch/${window.currentBranchId}/update/`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(branchData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при сохранении данных филиала');
        }
        return response.json();
    })
    .then(data => {
        showNotification('Данные успешно сохранены', 'success');
        
        // Обновляем данные на странице
        fillProfileForm(data);
        
        // Если в ответе есть фотографии, отображаем их
        if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
            renderBranchPhotos(data.gallery);
        }
        
        // Обновляем статус меню
        if (data.menu_pdf) {
            updateMenuStatus(data.menu_pdf);
        }
    })
    .catch(error => {
        console.error('Ошибка при сохранении данных филиала:', error);
        showNotification('Ошибка при сохранении данных', 'error');
    });
}

// Инициализация загрузки фотографий
function initPhotoUpload() {
    const mainPhotoBtn = document.getElementById('upload-main-photo');
    const addPhotoItems = document.querySelectorAll('.add-photo');
    
    // Обработчик для загрузки главного фото
    if (mainPhotoBtn) {
        mainPhotoBtn.addEventListener('click', function() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    uploadMainPhoto(this.files[0]);
                }
            });
            
            document.body.appendChild(fileInput);
            fileInput.click();
            
            // Удаляем элемент после выбора файла
            fileInput.addEventListener('change', function() {
                document.body.removeChild(fileInput);
            });
        });
    }
    
    // Обработчики для добавления фотографий
    addPhotoItems.forEach(item => {
        item.addEventListener('click', function() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    uploadPhoto(this.files[0]);
                }
            });
            
            document.body.appendChild(fileInput);
            fileInput.click();
            
            // Удаляем элемент после выбора файла
            fileInput.addEventListener('change', function() {
                document.body.removeChild(fileInput);
            });
        });
    });
}

// Загрузка главного фото
function uploadMainPhoto(file) {
    const authToken = localStorage.getItem('authToken');
    
    // Создаем объект FormData для отправки файла
    const formData = new FormData();
    formData.append('main_photo', file);
    
    // Отправляем запрос на загрузку главного фото
    fetch(`http://127.0.0.1:8000/api/branch/${window.currentBranchId}/upload-main-photo/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при загрузке главного фото');
        }
        return response.json();
    })
    .then(data => {
        // Обновляем превью главного фото
        document.getElementById('main-photo-preview').src = data.main_photo;
        showNotification('Главное фото успешно загружено', 'success');
    })
    .catch(error => {
        console.error('Ошибка при загрузке главного фото:', error);
        showNotification('Ошибка при загрузке фото', 'error');
    });
}

// Загрузка фотографии
function uploadPhoto(file) {
    const authToken = localStorage.getItem('authToken');
    
    // Создаем объект FormData для отправки файла
    const formData = new FormData();
    formData.append('image', file);
    formData.append('branch', window.currentBranchId);
    
    // Отправляем запрос на загрузку фото
    fetch(`http://127.0.0.1:8000/api/branch/${window.currentBranchId}/photos/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при загрузке фото');
        }
        return response.json();
    })
    .then(data => {
        // После успешной загрузки обновляем данные филиала
        loadBranchDetails(window.currentBranchId);
        showNotification('Фото успешно загружено', 'success');
    })
    .catch(error => {
        console.error('Ошибка при загрузке фото:', error);
        showNotification('Ошибка при загрузке фото', 'error');
    });
}

// Удаление фотографии
function deletePhoto(photoId) {
    const authToken = localStorage.getItem('authToken');
    
    // Отправляем запрос на удаление фото
    fetch(`http://127.0.0.1:8000/api/branch/${window.currentBranchId}/photos/${photoId}/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при удалении фото');
        }
        
        // Удаляем фото из DOM
        const photoItem = document.querySelector(`.photo-item[data-id="${photoId}"]`);
        if (photoItem) {
            photoItem.remove();
        }
        
        showNotification('Фото успешно удалено', 'success');
    })
    .catch(error => {
        console.error('Ошибка при удалении фото:', error);
        showNotification('Ошибка при удалении фото', 'error');
    });
}

// Инициализация загрузки меню
function initMenuUpload() {
    const uploadMenuBtn = document.getElementById('upload-menu');
    
    if (uploadMenuBtn) {
        uploadMenuBtn.addEventListener('click', function() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.pdf';
            fileInput.style.display = 'none';
            
            fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    uploadMenu(this.files[0]);
                }
            });
            
            document.body.appendChild(fileInput);
            fileInput.click();
            
            // Удаляем элемент после выбора файла
            fileInput.addEventListener('change', function() {
                document.body.removeChild(fileInput);
            });
        });
    }
}

// Загрузка меню
function uploadMenu(file) {
    const authToken = localStorage.getItem('authToken');
    
    // Создаем объект FormData для отправки файла
    const formData = new FormData();
    formData.append('menu_pdf', file);
    
    // Отправляем запрос на загрузку меню
    fetch(`http://127.0.0.1:8000/api/branch/${window.currentBranchId}/upload-menu/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка при загрузке меню');
        }
        return response.json();
    })
    .then(data => {
        // После успешной загрузки обновляем данные филиала
        loadBranchDetails(window.currentBranchId);
        showNotification('Меню успешно загружено', 'success');
    })
    .catch(error => {
        console.error('Ошибка при загрузке меню:', error);
        showNotification('Ошибка при загрузке меню', 'error');
    });
}

// Функция для отображения уведомлений
function showNotification(message, type = 'success') {
    // Удаляем предыдущие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Показываем уведомление с анимацией
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Скрываем уведомление через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        
        // Удаляем элемент после завершения анимации
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
} 