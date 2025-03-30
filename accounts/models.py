from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    first_name = models.CharField(max_length=100, blank=False, null=False, verbose_name="Имя")
    last_name = models.CharField(max_length=100, blank=False, null=False, verbose_name="Фамилия")
    email = models.EmailField(unique=True, blank=False, null=False, verbose_name="Email")
    
    phone = models.CharField(max_length=10, unique=True, blank=False, null=False, verbose_name="Номер телефона")
    photo = models.ImageField(upload_to='users/photos/', blank=True, null=True, verbose_name="Фото профиля")
    
    USERNAME_FIELD = 'username'  
    REQUIRED_FIELDS = ['email', 'phone', 'first_name', 'last_name']  
    
    def save(self, *args, **kwargs):
        if not self.username:
            base = self.email.split('@')[0]
            random_string = str(uuid.uuid4())[:8]
            self.username = f"{base}_{random_string}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"


