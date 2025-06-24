from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AdminInvitation
from users.tasks import send_admin_invitation_email


@receiver(post_save, sender=AdminInvitation)
def send_invitation_email(sender, instance, created, **kwargs):
    if created:
        send_admin_invitation_email.delay(instance.id)

















