from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
import uuid


class CustomUserManager(UserManager):
    def create_superuser(self, email=None, phone=None, password=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not extra_fields.get('username'):
            username = email.split('@')[0] + str(uuid.uuid4())[:8]
            extra_fields['username'] = username

        return self.create_user(email=email, password=password, phone=phone, **extra_fields)


class User(AbstractUser):
    first_name = models.CharField(max_length=100, blank=False, null=False, verbose_name="Имя")
    last_name = models.CharField(max_length=100, blank=False, null=False, verbose_name="Фамилия")
    email = models.EmailField(unique=True, blank=False, null=False, verbose_name="Email")
    phone = models.CharField(max_length=10, unique=True, blank=False, null=False, verbose_name="Номер телефона")
    photo = models.ImageField(upload_to='users/photos/', blank=True, null=True, verbose_name="Фото профиля")

    is_system_admin = models.BooleanField(default=False, verbose_name="Администратор системы")
    
    USERNAME_FIELD = 'phone'  
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']  

    objects = CustomUserManager()
    
    def save(self, *args, **kwargs):
        if not self.username:
            base = self.email.split('@')[0]
            random_string = str(uuid.uuid4())[:8]
            self.username = f"{base}_{random_string}"
        super().save(*args, **kwargs)

    def is_admin_of_restaurant(self, restaurant):
        from restaurants.models import RestaurantAdmin
        return RestaurantAdmin.objects.filter(user=self, restaurant=restaurant, is_active=True).exists()
    
    def get_administered_restaurants(self):
        from restaurants.models import Restaurant
        return Restaurant.objects.filter(administrators__user=self, administrators__is_active=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"


