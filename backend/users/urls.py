from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, CustomTokenObtainPairView, ProfileView, CheckInvitationView, CompleteInvitationView, ResendInvitationView, CancelInvitationView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile', ProfileView.as_view(), name='profile'),
    path('invitations/check/<str:invitation_code>/', CheckInvitationView.as_view(), name='check-invitation'),
    path('invitations/complete/<str:invitation_code>/', CompleteInvitationView.as_view(), name='complete-invitation'),
    path('invitations/<int:invitation_id>/resend/', ResendInvitationView.as_view(), name='resend-invitation'),
    path('invitations/<int:invitation_id>/cancel/', CancelInvitationView.as_view(), name='cancel-invitation'),
]




