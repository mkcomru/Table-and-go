from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                            related_name='reviews', verbose_name='Пользователь')
    restaurant = models.ForeignKey('restaurants.Restaurant', on_delete=models.CASCADE,
                                    related_name='reviews', verbose_name="Ресторан")
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], 
                                verbose_name="Оценка")
    comment = models.TextField(blank=True, null=True, verbose_name="Комментарий")
    visit_date = models.DateField(verbose_name="Дата посещения")
    is_approved = models.BooleanField(default=False, verbose_name="Одобрен")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"
        ordering = ['-created_at']
        unique_together = ['user', 'restaurant']

    def __str__(self):
        return f"Отзыв на {self.restaurant.name} от {self.user.get_full_name()} - {self.rating}"






