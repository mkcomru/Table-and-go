from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.conf import settings
from .models import BranchAdmin
from users.tasks import send_admin_welcome_email

User = get_user_model()

@receiver(post_save, sender=BranchAdmin)
def send_admin_invitation(sender, instance, created, **kwargs):
    """
    Отправляет приглашение новому администратору филиала.
    Срабатывает при создании новой записи BranchAdmin.
    """
    if created:
        user = instance.user
        branch = instance.branch
        
        # Генерируем токен для сброса пароля
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Отправляем письмо с инструкциями
        send_admin_welcome_email.delay(
            user.email, 
            user.id,
            branch.id,
            uid,
            token
        )

















