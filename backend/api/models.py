from django.db import models
import uuid


class APIKey(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название ключа")
    key = models.CharField(max_length=54, unique=True, verbose_name="API ключ")
    is_active = models.BooleanField(default=True, verbose_name="Активный")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    last_used = models.DateTimeField(blank=True, null=True, verbose_name="Последнее использование")

    def __str__(self):
        return f"{self.name} - ({self.key[:8]}...)"

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = uuid.uuid4().hex
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "API ключ"
        verbose_name_plural = "API ключи "






