from django.shortcuts import render
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.utils import timezone
from establishments.models import AdminInvitation, BranchAdmin
from .serializers import UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer
from .tasks import send_welcome_email


User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token_serializer = CustomTokenObtainPairSerializer
        tokens = token_serializer.get_token(user)

        send_welcome_email.delay(user.email, user.username)

        return Response({
            'user': UserSerializer(user).data,
            'access': str(tokens.access_token),
            'refresh': str(tokens)
        }, status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class CheckInvitationView(views.APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, invitation_code):
        try:
            invitation = AdminInvitation.objects.get(invitation_code=invitation_code)
            
            if not invitation.is_valid():
                return Response({
                    "valid": False,
                    "message": "Приглашение недействительно или срок его действия истек."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_exists = User.objects.filter(email=invitation.email).exists()
            
            return Response({
                "valid": True,
                "email": invitation.email,
                "phone": invitation.phone,
                "branch_name": invitation.branch.name,
                "establishment_name": invitation.branch.establishment.name,
                "expires_at": invitation.expires_at,
                "user_exists": user_exists
            })
            
        except AdminInvitation.DoesNotExist:
            return Response({
                "valid": False,
                "message": "Приглашение не найдено."
            }, status=status.HTTP_404_NOT_FOUND)


class CompleteInvitationView(generics.GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, invitation_code):
        try:
            invitation = AdminInvitation.objects.get(invitation_code=invitation_code)
        except AdminInvitation.DoesNotExist:
            return Response(
                {"detail": "Приглашение не найдено."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        if not invitation.is_valid():
            return Response(
                {"detail": "Приглашение недействительно или срок его действия истек."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user_exists = User.objects.filter(email=invitation.email).exists()
        
        if user_exists:
            user = User.objects.get(email=invitation.email)
            
            admin_exists = BranchAdmin.objects.filter(user=user, branch=invitation.branch).exists()
            if admin_exists:
                return Response(
                    {"detail": "Вы уже являетесь администратором этого филиала."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            BranchAdmin.objects.create(
                user=user,
                branch=invitation.branch,
                is_active=True
            )
            
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            invitation.is_used = True
            invitation.save()
            
            branch_name = invitation.branch.name or invitation.branch.address
            return Response({
                "detail": f"Вы успешно стали администратором филиала {branch_name}.",
                "user_existed": True,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }, status=status.HTTP_200_OK)
        else:
            serializer = RegisterSerializer(data={
                "email": invitation.email,
                "phone": invitation.phone or "",
                "first_name": "Администратор", 
                "last_name": invitation.branch.establishment.name,  
                "password": request.data.get("password", "")
            })
            
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
            user = serializer.save()
            
            BranchAdmin.objects.create(
                user=user,
                branch=invitation.branch,
                is_active=True
            )
            
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            invitation.is_used = True
            invitation.save()
            
            send_welcome_email.delay(user.email, user.first_name)
            
            branch_name = invitation.branch.name or invitation.branch.address
            return Response({
                "detail": f"Вы успешно зарегистрировались и стали администратором филиала {branch_name}.",
                "user_existed": False,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }, status=status.HTTP_201_CREATED)


class ResendInvitationView(views.APIView):
    permission_classes = [permissions.IsAdminUser]  
    
    def post(self, request, invitation_id):
        try:
            invitation = AdminInvitation.objects.get(id=invitation_id)
        except AdminInvitation.DoesNotExist:
            return Response(
                {"detail": "Приглашение не найдено."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        if invitation.is_used:
            return Response(
                {"detail": "Это приглашение уже использовано."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if invitation.expires_at < timezone.now():
            invitation.expires_at = timezone.now() + timezone.timedelta(days=7)
            invitation.save()
        
        from establishments.tasks import send_admin_invitation_email
        
        send_admin_invitation_email.delay(invitation.id)
        
        return Response({
            "detail": f"Приглашение повторно отправлено на {invitation.email}.",
            "expires_at": invitation.expires_at
        })


class CancelInvitationView(views.APIView):
    permission_classes = [permissions.IsAdminUser]  
    
    def post(self, request, invitation_id):
        try:
            invitation = AdminInvitation.objects.get(id=invitation_id)
        except AdminInvitation.DoesNotExist:
            return Response(
                {"detail": "Приглашение не найдено."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        if invitation.is_used:
            return Response(
                {"detail": "Это приглашение уже использовано и не может быть отменено."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        invitation.is_used = True
        invitation.save()
        
        return Response({
            "detail": f"Приглашение для {invitation.email} успешно отменено."
        })












