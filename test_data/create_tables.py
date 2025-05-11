import os
import django
import sys
from pathlib import Path

# Добавляем родительскую директорию в sys.path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tableandgo.settings')
django.setup()

# Импортируем необходимые модели
from django.db import connection
from django.contrib.auth import get_user_model
from tableandgo.restaurants.models import Cuisine, District, Establishment, Branch, WorkingHours
from tableandgo.reviews.models import Review
from tableandgo.bookings.models import Booking

User = get_user_model()

def create_tables():
    """
    Функция для создания всех необходимых таблиц в БД SQLite
    """
    with connection.cursor() as cursor:
        # Убеждаемся, что БД существует и настроена
        cursor.execute("PRAGMA foreign_keys = ON;")
        
        print("Создаем таблицы...")
        
        # Создаем таблицу для районов
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS restaurants_district (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) UNIQUE NOT NULL
        );
        """)
        
        # Создаем таблицу для типов кухни
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS restaurants_cuisine (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT NULL
        );
        """)
        
        # Создаем таблицу для заведений
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS restaurants_establishment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            establishment_type VARCHAR(20) NOT NULL,
            name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT NULL,
            email VARCHAR(254) UNIQUE NULL,
            website_url VARCHAR(200) NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        );
        """)
        
        # Связь многие-ко-многим между заведениями и типами кухни
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS restaurants_establishment_cuisines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            establishment_id INTEGER NOT NULL,
            cuisine_id INTEGER NOT NULL,
            FOREIGN KEY (establishment_id) REFERENCES restaurants_establishment (id),
            FOREIGN KEY (cuisine_id) REFERENCES restaurants_cuisine (id),
            UNIQUE (establishment_id, cuisine_id)
        );
        """)
        
        # Создаем таблицу для филиалов
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS restaurants_branch (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            establishment_id INTEGER NOT NULL,
            name VARCHAR(100) NULL,
            is_main BOOLEAN NOT NULL,
            address VARCHAR(256) NOT NULL,
            district_id INTEGER NOT NULL,
            phone VARCHAR(10) NOT NULL,
            average_check DECIMAL(10, 2) NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            FOREIGN KEY (establishment_id) REFERENCES restaurants_establishment (id),
            FOREIGN KEY (district_id) REFERENCES restaurants_district (id)
        );
        """)
        
        # Создаем таблицу для часов работы
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS restaurants_workinghours (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            branch_id INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL,
            opening_time TIME NULL,
            closing_time TIME NULL,
            is_closed BOOLEAN NOT NULL,
            FOREIGN KEY (branch_id) REFERENCES restaurants_branch (id),
            UNIQUE (branch_id, day_of_week)
        );
        """)
        
        print("Таблицы успешно созданы.")

if __name__ == "__main__":
    create_tables() 