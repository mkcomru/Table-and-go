from django.db import models
from django.conf import settings
from establishments.models import Branch, Table
import uuid


def generate_book_number():
    return str(uuid.uuid4().hex)[:8].upper()


class Booking(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                                related_name="bookings", verbose_name="Пользователь")
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE,
                                    related_name='bookings', verbose_name="Филиал", null=True, blank=True)
    table = models.ForeignKey(Table, on_delete=models.CASCADE, blank=True, null=True,
                                related_name='bookings', verbose_name='Столик')
    booking_datetime = models.DateTimeField(verbose_name="Дата и время бронирования")
    duration = models.IntegerField(default=2, verbose_name="Продолжительность (часы)")
    guests_count = models.IntegerField(verbose_name="Количество гостей")
    book_number = models.CharField(max_length=20, unique=True, default=generate_book_number())

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
    objects = models.Manager()

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

    # def clean(self):
    #     from django.core.exceptions import ValidationError
        
    #     if not self.branch.is_open_at(self.booking_datetime):
    #         raise ValidationError("Ресторан закрыт в указанное время")
            
    #     if self.table.branch != self.branch:
    #         raise ValidationError("Столик не принадлежит указанному ресторану")
    
    def save(self, *args, **kwargs):
        if not self.book_number:
            self.book_number = generate_book_number()
            while Booking.objects.filter(book_number=self.book_number).exists():
                self.book_number = generate_book_number()
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








