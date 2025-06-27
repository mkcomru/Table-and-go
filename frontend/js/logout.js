document.addEventListener('DOMContentLoaded', function() {
    // Находим кнопку выхода
    const logoutBtn = document.getElementById('logout-btn');
    
    // Добавляем обработчик события клика на кнопку выхода
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Выполняем выход из системы
            logout();
        });
    }
});

// Функция для выхода из системы
function logout() {
    console.log('Выполняется выход из системы...');
    
    // Удаляем данные пользователя и токены из localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    
    // Выводим сообщение об успешном выходе
    console.log('Выход выполнен успешно');
    
    // Перенаправляем на главную страницу
    window.location.href = 'index.html';
} 