import os
import django
import sys
import re
from pathlib import Path
from datetime import datetime, time

# Добавляем родительскую директорию в sys.path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tableandgo.settings')
django.setup()

# Импортируем необходимые модели
from django.db import connection
from django.utils import timezone
from django.contrib.auth import get_user_model
from tableandgo.restaurants.models import Cuisine, District, Establishment, Branch, WorkingHours
from tableandgo.reviews.models import Review
from tableandgo.bookings.models import Booking

User = get_user_model()

def parse_working_hours(hours_str):
    """
    Парсит строку часов работы в формате 'day(hh.mm-hh.mm)' и возвращает словарь
    """
    days_map = {
        'понедельник': 0,
        'вторник': 1,
        'среда': 2,
        'четверг': 3,
        'пятница': 4,
        'суббота': 5,
        'воскресенье': 6
    }
    
    hours_data = {}
    
    # Разбиваем строку на отдельные дни
    days_parts = hours_str.split(',')
    
    for day_part in days_parts:
        day_part = day_part.strip()
        
        # Извлекаем день недели и время
        match = re.match(r'(\S+)\(([^)]+)\)', day_part)
        if match:
            day_name, time_range = match.groups()
            day_index = days_map.get(day_name.lower())
            
            if day_index is not None:
                if time_range.lower() == 'выходной':
                    hours_data[day_index] = {
                        'is_closed': True
                    }
                elif time_range.lower() == 'круглосуточно':
                    hours_data[day_index] = {
                        'is_closed': False,
                        'opening_time': '00:00',
                        'closing_time': '23:59'
                    }
                else:
                    # Парсим время работы
                    try:
                        time_parts = time_range.split('-')
                        if len(time_parts) == 2:
                            opening_time = time_parts[0].strip().replace('.', ':')
                            closing_time = time_parts[1].strip().replace('.', ':')
                            
                            # Преобразуем время вида "1.00" в "01:00"
                            if len(opening_time) == 4:
                                opening_time = f"0{opening_time}"
                            if len(closing_time) == 4:
                                closing_time = f"0{closing_time}"
                            
                            hours_data[day_index] = {
                                'is_closed': False,
                                'opening_time': opening_time,
                                'closing_time': closing_time
                            }
                    except Exception as e:
                        print(f"Ошибка при парсинге времени работы: {e}")
    
    return hours_data

def import_data():
    """
    Импортирует данные о ресторанах и барах из текстовых файлов
    """
    # Пути к файлам с данными
    restaurants_file = os.path.join(parent_dir, 'data_restaurants.txt')
    bars_file = os.path.join(parent_dir, 'deta_bars.txt')
    
    # Создаем необходимые районы
    districts = {
        'Центральный': District.objects.get_or_create(name='Центральный')[0],
        'Чуркин': District.objects.get_or_create(name='Чуркин')[0],
        'Вторая речка': District.objects.get_or_create(name='Вторая речка')[0],
        'БАМ': District.objects.get_or_create(name='БАМ')[0],
        'Баляева': District.objects.get_or_create(name='Баляева')[0],
        'Эгершельд': District.objects.get_or_create(name='Эгершельд')[0],
        'фадеева': District.objects.get_or_create(name='Фадеева')[0]
    }
    
    # Функция для обработки файла (как для ресторанов, так и для баров)
    def process_file(file_path, establishment_type):
        if not os.path.exists(file_path):
            print(f"Файл {file_path} не найден")
            return
        
        print(f"Импортируем данные из {file_path}...")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Разделяем файл на блоки для каждого заведения
        establishments_blocks = content.strip().split('\n\n')
        
        for block in establishments_blocks:
            if not block.strip():
                continue
            
            # Словарь для хранения данных о текущем заведении
            establishment_data = {}
            branch_data_list = []
            
            # Разделяем блок на строки
            lines = block.strip().split('\n')
            
            # Парсим основную информацию о заведении
            current_branch_data = None
            
            for line in lines:
                if not line.strip():
                    continue
                
                # Разделяем ключ и значение
                parts = line.split(':', 1)
                if len(parts) != 2:
                    continue
                
                key, value = parts[0].strip(), parts[1].strip()
                
                # Обрабатываем ключи и значения
                if key == 'название' and not current_branch_data:
                    establishment_data['name'] = value
                elif key == 'тип заведения':
                    establishment_data['establishment_type'] = 'restaurant' if value.lower() == 'ресторан' else 'bar'
                elif key == 'описание':
                    establishment_data['description'] = value
                elif key == 'email':
                    establishment_data['email'] = value if value else None
                elif key == 'сайт':
                    establishment_data['website_url'] = value if value else None
                elif key == 'тип кухни':
                    establishment_data['cuisines'] = [cuisine.strip() for cuisine in value.split(',')]
                elif key.startswith('филиал'):
                    # Начинаем новый филиал
                    if current_branch_data:
                        branch_data_list.append(current_branch_data)
                    current_branch_data = {'is_main': False}
                elif key == 'название' and current_branch_data is not None:
                    current_branch_data['name'] = value
                elif key == 'основной':
                    current_branch_data['is_main'] = value.lower() == 'да'
                elif key == 'адрес' and current_branch_data:
                    current_branch_data['address'] = value
                elif key == 'район' and current_branch_data:
                    current_branch_data['district'] = value
                elif key == 'телефон' and current_branch_data:
                    # Извлекаем только цифры из номера телефона
                    current_branch_data['phone'] = ''.join(filter(str.isdigit, value))[-10:]
                elif key == 'средний чек' and current_branch_data:
                    current_branch_data['average_check'] = value
                elif key == 'часы работы' and current_branch_data:
                    current_branch_data['working_hours'] = value
            
            # Добавляем последний филиал
            if current_branch_data:
                branch_data_list.append(current_branch_data)
            
            # Создаем заведение в БД
            if 'name' in establishment_data:
                try:
                    # Проверяем, существует ли уже такое заведение
                    establishment = Establishment.objects.filter(name=establishment_data['name']).first()
                    
                    if not establishment:
                        establishment = Establishment(
                            name=establishment_data['name'],
                            establishment_type=establishment_data.get('establishment_type', establishment_type),
                            description=establishment_data.get('description', ''),
                            email=establishment_data.get('email'),
                            website_url=establishment_data.get('website_url')
                        )
                        establishment.save()
                        
                        # Добавляем типы кухни
                        if 'cuisines' in establishment_data:
                            for cuisine_name in establishment_data['cuisines']:
                                cuisine, created = Cuisine.objects.get_or_create(name=cuisine_name.strip())
                                establishment.cuisines.add(cuisine)
                    
                    # Создаем филиалы
                    for branch_data in branch_data_list:
                        district_name = branch_data.get('district')
                        if district_name and district_name in districts:
                            district = districts[district_name]
                            
                            # Создаем филиал
                            branch = Branch(
                                establishment=establishment,
                                name=branch_data.get('name', ''),
                                is_main=branch_data.get('is_main', False),
                                address=branch_data.get('address', ''),
                                district=district,
                                phone=branch_data.get('phone', ''),
                                average_check=branch_data.get('average_check', '0')
                            )
                            branch.save()
                            
                            # Добавляем часы работы
                            if 'working_hours' in branch_data:
                                working_hours_data = parse_working_hours(branch_data['working_hours'])
                                
                                for day_index, hours in working_hours_data.items():
                                    WorkingHours.objects.create(
                                        branch=branch,
                                        day_of_week=day_index,
                                        opening_time=hours.get('opening_time'),
                                        closing_time=hours.get('closing_time'),
                                        is_closed=hours.get('is_closed', False)
                                    )
                    
                    print(f"Импортировано заведение: {establishment_data['name']}")
                
                except Exception as e:
                    print(f"Ошибка при импорте заведения {establishment_data.get('name', '')}: {e}")
    
    # Обрабатываем файлы
    process_file(restaurants_file, 'restaurant')
    process_file(bars_file, 'bar')
    
    print("Импорт данных завершен успешно!")

if __name__ == "__main__":
    import_data() 