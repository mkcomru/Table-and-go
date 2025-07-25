from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

# celery -A core worker -l info --pool=solo


logger = logging.getLogger(__name__)

@shared_task
def send_welcome_email(email, first_name):
    subject = "Добро пожаловать в Table and Go!"
    message = f"""
    Привет {first_name},

    Спасибо, что присоединились к нашей платформе! Мы рады, что вы с нами.
    Надеемся вам понравится и вы найдете свое любимое заведение.

    С уважением,
    Команда Table and Go
    """
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        logger.info(f"Welcome email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {str(e)}")
        raise

@shared_task
def send_password_reset_email(email, user_id):
    from django.contrib.auth import get_user_model
    from django.contrib.auth.tokens import default_token_generator
    from django.utils.http import urlsafe_base64_encode
    from django.utils.encoding import force_bytes

    User = get_user_model()

    logger.info(f"Starting password reset email task for {email}, user_id={user_id}")
    try:
        user = User.objects.get(pk=user_id)
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_url = f"{settings.PASSWORD_RESET_URL}?uid={uid}&token={token}"
        subject = "Восстановление пароля | Table&Go"
        message = f"""
        Здравствуйте, {user.first_name or user.email}!

        Вы получили это письмо, потому что запросили восстановление пароля на сайте Table&Go.
        
        Для установки нового пароля перейдите по ссылке:
        {reset_url}

        Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
        
        Ссылка действительна в течение 24 часов.

        С уважением,
        Команда Table&Go
        """
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        logger.info(f"Password reset email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {str(e)}")
        raise


@shared_task
def send_admin_invitation_email(invitation_id):
    from establishments.models import AdminInvitation

    logger.info(f"Starting admin invitation email task for invitation_id={invitation_id}")

    try:
        invitation = AdminInvitation.objects.get(id=invitation_id)
        branch_name = invitation.branch.name
        establishment_name = invitation.branch.establishment.name

        subject = f"приглашение стать администратором ресторана {branch_name}"
        activation_url = f"{settings.FRONTEND_URL}/admin/invitation/{invitation.invitation_code}"
        message = f"""
        Здравствуйте!

        Вы были приглашены стать администратором филиала "{branch_name}" 
        заведения "{establishment_name}" на платформе Table and Go.
        
        Для подтверждения и настройки аккаунта перейдите по ссылке:
        {activation_url}

        Ссылка действительна до {invitation.expires_at.strftime('%d.%m.%Y %H:%M')}.

        С уважением,
        Команда Table and Go
        """
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [invitation.email],
            fail_silently=False,
        )
        logger.info(f"Admin invitation email sent to {invitation.email}")
        return True
    
    except AdminInvitation.DoesNotExist:
        logger.error(f"Admin invitation with id={invitation_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error sending admin invitation email: {str(e)}")
        raise
        

@shared_task
def send_admin_welcome_email(email, user_id, branch_id, uidb64, token):
    """
    Отправляет письмо новому администратору ресторана со ссылкой для установки пароля.
    """
    from django.contrib.auth import get_user_model
    from establishments.models import Branch

    User = get_user_model()

    logger.info(f"Starting admin welcome email task for {email}, user_id={user_id}, branch_id={branch_id}")
    try:
        user = User.objects.get(pk=user_id)
        branch = Branch.objects.get(pk=branch_id)
        
        reset_url = f"{settings.PASSWORD_RESET_URL}?uid={uidb64}&token={token}"
        
        branch_name = branch.name or branch.address
        establishment_name = branch.establishment.name
        
        subject = f"Вы назначены администратором ресторана {establishment_name}"
        message = f"""
        Здравствуйте, {user.first_name} {user.last_name}!

        Вы были назначены администратором филиала "{branch_name}" 
        заведения "{establishment_name}" на платформе Table and Go.
        
        Для установки пароля и входа в систему перейдите по ссылке:
        {reset_url}
        
        После установки пароля вы сможете войти в систему, используя:
        Email: {email}
        
        С уважением,
        Команда Table and Go
        """
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        logger.info(f"Admin welcome email sent to {email}")
        return True
    
    except (User.DoesNotExist, Branch.DoesNotExist) as e:
        logger.error(f"Error in send_admin_welcome_email: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error sending admin welcome email: {str(e)}")
        raise















