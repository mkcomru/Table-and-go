from django.db import models
from django.conf import settings
from restaurants.models import Branch, Table


class Booking(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                                related_name="bookings", verbose_name="Пользователь")
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE,
                                    related_name='bookings', verbose_name="Филиал", null=True, blank=True)
    table = models.ForeignKey(Table, on_delete=models.CASCADE,
                                related_name='bookings', verbose_name='Столик')
    booking_datetime = models.DateTimeField(verbose_name="Дата и время бронирования")
    duration = models.IntegerField(default=2, verbose_name="Продолжительность (часы)")
    guests_count = models.IntegerField(verbose_name="Количество гостей")

    STATUS_CHOICES =[
        ('pending', 'Ожидает подтверждения'),
        ('confirmed', 'Подтверждено'),
        ('cancelled', 'Отменено'),
        ('completed', 'Завершено'),
    ]
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    
    special_requests = models.TextField(blank=True, null=True, verbose_name="Особые пожелания")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def confirm(self):
        self.status = 'confirmed'
        self.save()

    def cancel(self):
        self.status ='cancelled'
        self.save()

    def complete(self):
        self.status = 'completed'
        self.save()

    def is_available_for_booking(self, datetime_start, datetime_end):
        if self.status != 'available':
            return False
        
        conflicting_bookings = Booking.objects.filter(
            table=self.table,
            status__in=['pending', 'confirmed'],
            booking_datetime__lt=datetime_end,
            booking_datetime__gte=datetime_start
        ).exclude(id=self.id).exists()
    
        return not conflicting_bookings

    def clean(self):
        from django.core.exceptions import ValidationError
        
        if not self.branch.is_open_at(self.booking_datetime):
            raise ValidationError("Ресторан закрыт в указанное время")
            
        if self.table.branch != self.branch:
            raise ValidationError("Столик не принадлежит указанному ресторану")
            
        if self.guests_count > self.table.capacity:
            raise ValidationError("Количество гостей превышает вместимость столика")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Бронирование {self.branch.name} - {self.booking_datetime.strftime('%d.%m.%Y %H:%M')} ({self.user.get_full_name()})"

    class Meta:
        verbose_name = "Бронирование"
        verbose_name_plural = "Бронирования"
        ordering = ['-booking_datetime']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['booking_datetime']),
            models.Index(fields=['branch', 'booking_datetime']),
        ]








