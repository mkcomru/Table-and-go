from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    date_joined = serializers.DateTimeField(read_only=True, format="%Y-%m-%dT%H:%M:%S")
    last_login = serializers.DateTimeField(read_only=True, format="%Y-%m-%dT%H:%M:%S")
    email_notifications = serializers.BooleanField(default=True, required=False)
    sms_notifications = serializers.BooleanField(default=True, required=False)
    promo_notifications = serializers.BooleanField(default=False, required=False)
    last_password_change = serializers.DateTimeField(source='date_joined', read_only=True, format="%Y-%m-%dT%H:%M:%S")
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone', 'photo',
            'date_joined', 'last_login', 'email_notifications', 'sms_notifications',
            'promo_notifications', 'last_password_change', 'is_staff', 'is_superuser', 'is_system_admin'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'last_password_change', 'is_staff', 'is_superuser', 'is_system_admin']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone', 'password']

    def create(self, validated_data):
        validated_data['username'] = validated_data['email']  # Автоматически генерируем username из email
        user = User.objects.create_user(**validated_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['email'] = user.email
        token['phone'] = user.phone
        token['is_system_admin'] = user.is_system_admin
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        
        administered_branches = user.get_administered_branches()
        token['is_branch_admin'] = administered_branches.exists()
        
        if token['is_branch_admin']:
            token['administered_branch_ids'] = list(administered_branches.values_list('id', flat=True))

        return token







