# Generated by Django 5.2.3 on 2025-06-29 10:49

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Branch',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=100, null=True, verbose_name='Название филиала')),
                ('is_main', models.BooleanField(default=False, verbose_name='Основной филиал')),
                ('address', models.CharField(max_length=256, verbose_name='Адрес филиала')),
                ('phone', models.CharField(max_length=10, verbose_name='Номер телефона')),
                ('average_check', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='Средний чек')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
                ('allow_to_book', models.BooleanField(default=True, verbose_name='Разрешено бронировать')),
            ],
            options={
                'verbose_name': 'Филиал',
                'verbose_name_plural': 'Филиалы',
                'ordering': ['establishment', '-is_main', 'name'],
            },
        ),
        migrations.CreateModel(
            name='BranchImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='branch_images', verbose_name='Фото филиала')),
                ('caption', models.CharField(blank=True, max_length=150, null=True, verbose_name='Описание фото')),
                ('is_main', models.BooleanField(default=False, verbose_name='Главное изображение')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='Порядок отображения')),
            ],
            options={
                'verbose_name': 'Фото филиала',
                'verbose_name_plural': 'Фото филиалов',
                'ordering': ['-is_main', 'order'],
            },
        ),
        migrations.CreateModel(
            name='Cuisine',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='Название')),
                ('description', models.TextField(blank=True, null=True, verbose_name='Описание')),
            ],
            options={
                'verbose_name': 'Кухня',
                'verbose_name_plural': 'Кухни',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='District',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='Название района')),
            ],
            options={
                'verbose_name': 'Район',
                'verbose_name_plural': 'Районы',
            },
        ),
        migrations.CreateModel(
            name='Establishment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('establishment_type', models.CharField(choices=[('bar', 'Бар'), ('restaurant', 'Ресторан')], default='restaurant', max_length=20, verbose_name='Тип заведения')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='Название заведения')),
                ('description', models.TextField(blank=True, null=True, verbose_name='Описание заведения')),
                ('email', models.EmailField(blank=True, max_length=254, null=True, unique=True, verbose_name='Email')),
                ('website_url', models.URLField(blank=True, null=True, verbose_name='Сайт ресторана')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
            ],
            options={
                'verbose_name': 'Заведение',
                'verbose_name_plural': 'Заведения',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Menu',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=100, verbose_name='Название меню')),
                ('pdf_menu', models.FileField(upload_to='branch_menu/', verbose_name='PDF меню')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата загрузки')),
            ],
            options={
                'verbose_name': 'PDF меню',
                'verbose_name_plural': 'PDF меню',
                'ordering': ['uploaded_at'],
            },
        ),
        migrations.CreateModel(
            name='Table',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('number', models.IntegerField(verbose_name='Номер столика')),
                ('capacity', models.IntegerField(verbose_name='Вместимость')),
                ('status', models.CharField(choices=[('available', 'Доступен'), ('reserved', 'Забронирован'), ('maintenance', 'На обслуживании')], default='available', max_length=50, verbose_name='Статус')),
                ('location', models.CharField(blank=True, max_length=100, null=True, verbose_name='Расположение')),
            ],
            options={
                'verbose_name': 'Столик',
                'verbose_name_plural': 'Столики',
                'ordering': ['branch', 'number'],
            },
        ),
        migrations.CreateModel(
            name='WorkingHours',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day_of_week', models.IntegerField(choices=[(0, 'Понедельник'), (1, 'Вторник'), (2, 'Среда'), (3, 'Четверг'), (4, 'Пятница'), (5, 'Суббота'), (6, 'Воскресенье')], verbose_name='День недели')),
                ('opening_time', models.TimeField(blank=True, null=True, verbose_name='Время открытия')),
                ('closing_time', models.TimeField(blank=True, null=True, verbose_name='Время закрытия')),
                ('is_closed', models.BooleanField(default=False, verbose_name='Выходной')),
            ],
            options={
                'verbose_name': 'Часы работы',
                'verbose_name_plural': 'Часы работы',
                'ordering': ['branch', 'day_of_week'],
            },
        ),
        migrations.CreateModel(
            name='AdminInvitation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254, verbose_name='Email приглашаемого')),
                ('phone', models.CharField(blank=True, max_length=15, null=True, verbose_name='Телефон приглашаемого')),
                ('invitation_code', models.CharField(max_length=20, unique=True, verbose_name='Код приглашения')),
                ('is_used', models.BooleanField(default=False, verbose_name='Использовано')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('expires_at', models.DateTimeField(verbose_name='Действительно до')),
                ('branch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invitations', to='establishments.branch', verbose_name='Ресторан')),
            ],
            options={
                'verbose_name': 'Приглашение администратора',
                'verbose_name_plural': 'Приглашения администраторов',
            },
        ),
        migrations.CreateModel(
            name='BranchAdmin',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активен')),
                ('date_added', models.DateTimeField(auto_now_add=True, verbose_name='Дата добавления')),
                ('branch', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='administrators', to='establishments.branch', verbose_name='Филиал')),
            ],
            options={
                'verbose_name': 'Администратор ресторана',
                'verbose_name_plural': 'Администраторы ресторанов',
            },
        ),
    ]
