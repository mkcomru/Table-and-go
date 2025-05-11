# TableAndGo API - Руководство для фронтенд-разработчика

## Настройка проекта

### Установка и запуск бэкенда

1. **Клонируйте репозиторий и создайте виртуальное окружение**
   ```bash
   git clone [URL_репозитория]
   cd tableandgo
   python -m venv venv
   ```

2. **Активация виртуального окружения**
   - Windows:
   ```bash
   venv\Scripts\activate
   ```
   - Linux/Mac:
   ```bash
   source venv/bin/activate
   ```

3. **Установка зависимостей**
   ```bash
   pip install -r requirements.txt
   ```

5. **Настройка базы данных и миграции**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Создание тестовых данных**
   ```bash
   mkdir -p tableandgo/test_data
   ```
   
   Скопируйте скрипты для создания тестовых данных в директорию test_data, затем запустите:
   ```bash
   python tableandgo/test_data/create_tables.py
   python tableandgo/test_data/fill_data.py
   ```

7. **Запуск сервера разработки**
   ```bash
   python manage.py runserver
   ```
   
   Сервер будет доступен по адресу: http://127.0.0.1:8000/

## Аутентификация с JWT

Проект использует JWT (JSON Web Token) для аутентификации пользователей.

### Как работает JWT аутентификация

1. **Регистрация пользователя**
   - Endpoint: `/api/auth/register/`
   - Метод: `POST`
   - Данные:
     ```json
     {
       "first_name": "Имя",
       "last_name": "Фамилия",
       "email": "example@email.com",
       "phone": "9001234567",
       "password": "secure_password"
     }
     ```
   - Ответ:
     ```json
     {
       "user": {
         "id": 1,
         "first_name": "Имя",
         "last_name": "Фамилия",
         "email": "example@email.com",
         "phone": "9001234567",
         "photo": null
       },
       "access": "eyJhbGciOiJI...",  // JWT access токен
       "refresh": "eyJ0eXAiOiJK..."   // JWT refresh токен
     }
     ```

2. **Вход пользователя**
   - Endpoint: `/api/auth/login/`
   - Метод: `POST`
   - Данные:
     ```json
     {
       "phone": "9001234567",  // В текущей реализации используется только телефон
       "password": "secure_password"
     }
     ```
   - Ответ:
     ```json
     {
       "access": "eyJhbGciOiJI...",
       "refresh": "eyJ0eXAiOiJK..."
     }
     ```

3. **Обновление токена**
   - Endpoint: `/api/auth/token/refresh`
   - Метод: `POST`
   - Данные:
     ```json
     {
       "refresh": "eyJ0eXAiOiJK..."
     }
     ```
   - Ответ:
     ```json
     {
       "access": "eyJhbGciOiJI..."
     }
     ```

4. **Аутентификация запросов**
   Для защищенных маршрутов необходимо добавлять заголовок:
   ```
   Authorization: Bearer eyJhbGciOiJI...
   ```

5. **Получение профиля**
   - Endpoint: `/api/auth/profile`
   - Метод: `GET`
   - Необходим Bearer токен в заголовке
   - Ответ: Данные профиля пользователя

### Обработка токенов на фронтенде

1. **Сохранение токенов**:
   После авторизации или регистрации сохраняйте токены:
   ```javascript
   localStorage.setItem('access_token', response.access);
   localStorage.setItem('refresh_token', response.refresh);
   ```

2. **Настройка Axios или Fetch**:
   ```javascript
   // Для Axios
   axios.interceptors.request.use(config => {
     const token = localStorage.getItem('access_token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });

   // Обработка 401 ошибки и обновление токена
   axios.interceptors.response.use(
     response => response,
     async error => {
       if (error.response?.status === 401) {
         const refresh = localStorage.getItem('refresh_token');
         if (refresh) {
           try {
             const {data} = await axios.post('/api/auth/token/refresh', {refresh});
             localStorage.setItem('access_token', data.access);
             // Повторяем оригинальный запрос с новым токеном
             error.config.headers.Authorization = `Bearer ${data.access}`;
             return axios(error.config);
           } catch (e) {
             // Перенаправление на логин
             localStorage.removeItem('access_token');
             localStorage.removeItem('refresh_token');
             window.location.href = '/login';
           }
         } else {
           // Нет refresh токена - перенаправление на логин
           window.location.href = '/login';
         }
       }
       return Promise.reject(error);
     }
   );
   ```

## Основные API эндпоинты

### Пользователи и аутентификация
- `POST /api/auth/register/` - Регистрация
- `POST /api/auth/login/` - Вход
- `POST /api/auth/token/refresh` - Обновление токена
- `GET /api/auth/profile` - Получение профиля

### Заведения и филиалы
- `GET /api/establishments/` - Список заведений
- `GET /api/establishments/{id}/` - Детали заведения
- `GET /api/branches/` - Список филиалов
- `GET /api/branches/{id}/` - Детали филиала

### Бронирования
- `POST /api/bookings/` - Создание бронирования
- `GET /api/bookings/` - Список бронирований пользователя
- `GET /api/bookings/{id}/` - Детали бронирования

### Отзывы
- `POST /api/reviews/` - Создание отзыва
- `GET /api/reviews/` - Список отзывов
- `GET /api/reviews/{id}/` - Детали отзыва

## Особенности и ограничения текущей реализации

1. **Вход только по телефону**:
   - Текущая реализация позволяет входить только по номеру телефона
   - Для входа по email потребуется доработка бэкенда

2. **Время жизни токенов**:
   - Access токен: 120 минут
   - Refresh токен: 7 дней

3. **Формат телефона**:
   - Телефон должен содержать только 10 цифр (без кода страны)
   - Пример: "9001234567"

## Запуск проекта в продакшене

Для продакшен-запуска рекомендуется:

1. **Настроить CORS**
   Проект включает `django-cors-headers`, но вам нужно будет настроить доменные имена в `CORS_ALLOWED_ORIGINS`.

2. **Настроить HTTPS**
   Обязательно используйте HTTPS для защиты токенов и данных пользователей.

3. **Использовать Gunicorn и Nginx**
   ```bash
   gunicorn tableandgo.wsgi:application --bind 0.0.0.0:8000
   ```

4. **Обновить настройки безопасности**
   - Установите `DEBUG=False` в production
   - Обновите `SECRET_KEY`
   - Настройте `ALLOWED_HOSTS`

## Скрипты для тестовых данных

В проекте предусмотрены скрипты для создания и заполнения базы данных тестовыми данными:

1. **create_tables.py** - создает необходимые таблицы в SQLite
2. **fill_data.py** - заполняет таблицы данными из файлов `data_restaurants.txt` и `deta_bars.txt`

Скрипты находятся в директории `tableandgo/test_data/`.
