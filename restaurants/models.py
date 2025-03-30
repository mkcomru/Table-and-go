from django.db import models
from django.conf import settings


class Cuisine(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название")
    description = models.TextField(blank=True, null=True, verbose_name="Описание")

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Кухня"
        verbose_name_plural = "Кухни"
        ordering = ["name"]


class Restaurant(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название ресторана")
    description = models.TextField(blank=True, null=True, verbose_name="Описание ресторана")
    address = models.CharField(max_length=256, verbose_name="Адрес ресторана")
    phone = models.CharField(max_length=10, verbose_name="Контактный телефон")
    email = models.CharField(max_length=100, verbose_name="Почта")

    latitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        blank=True, null=True,
        verbose_name="Широта"
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        blank=True, null=True,
        verbose_name="Долгота"
    )

    website_url = models.URLField(blank=True, null=True, verbose_name="Сайт ресторана")

    cuisines = models.ManyToManyField(Cuisine, related_name="restourants", verbose_name="Типы кухни")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата обновления")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Ресторан"
        verbose_name_plural = "Рестораны"
        ordering = ['-created_at']


