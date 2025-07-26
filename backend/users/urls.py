from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import (
    RegisterView, CustomTokenObtainPairView, ProfileView, 
    CheckInvitationView, CompleteInvitationView, ResendInvitationView, 
    CancelInvitationView, ChangePasswordView, PasswordResetRequestView,
    PasswordResetConfirmView, PasswordResetCompleteView
)


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('me/', ProfileView.as_view(), name='user-profile'),
    path('update/', ProfileView.as_view(), name='update-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset-confirm/<str:uidb64>/<str:token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-reset-complete/', PasswordResetCompleteView.as_view(), name='password_reset_complete'),
    path('invitations/check/<str:invitation_code>/', CheckInvitationView.as_view(), name='check-invitation'),
    path('invitations/complete/<str:invitation_code>/', CompleteInvitationView.as_view(), name='complete-invitation'),
    path('invitations/<int:invitation_id>/resend/', ResendInvitationView.as_view(), name='resend-invitation'),
    path('invitations/<int:invitation_id>/cancel/', CancelInvitationView.as_view(), name='cancel-invitation'),
]




