from rest_framework import serializers
from .models import Booking
from establishments.models import Branch
from django.utils import timezone
import datetime
from users.serializers import UserSerializer


class BookingListSerializer(serializers.ModelSerializer):
    branch_name = serializers.SerializerMethodField()
    branch_image = serializers.SerializerMethodField()
    booking_date = serializers.SerializerMethodField()
    booking_time = serializers.SerializerMethodField()
    branch_address = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id',
            'branch_name',
            'branch_image',
            'booking_date',
            'booking_time',
            'guests_count',
            'branch_address',
            'status',
            'book_number'
        ]

    def get_branch_name(self, obj):
        return obj.branch.name if obj.branch else None

    def get_branch_image(self, obj):
        if obj.branch:
            return obj.branch.get_main_image()
        return None

    def get_booking_date(self, obj):
        return obj.booking_datetime.date().strftime('%Y-%m-%d')

    def get_booking_time(self, obj):
        return obj.booking_datetime.time().strftime('%H:%M')

    def get_branch_address(self, obj):
        return obj.branch.address if obj.branch else None


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'branch',
            'booking_datetime',
            'guests_count',
            'special_requests'
        ]

    def validate_guests_count(self, gests_count: int) -> int:
        if gests_count < 1:
            raise serializers.ValidationError("Количество гостей должно быть больше 0")
        return gests_count
    
    def validate_booking_datetime(self, booking_datetime: datetime) -> datetime:
        if booking_datetime < timezone.now():
            raise serializers.ValidationError("Дата и время бронирования не могут быть в прошлом")
        return booking_datetime
    
    def validate_branch_id(self, branch_id:int) -> int:
        try: 
            branch = Branch.objects.get(id=branch_id)
            return branch_id
        except Branch.DoesNotExist:
            raise serializers.ValidationError("Филиал не найден")
        
    def validate_branch_open_time(self, data: dict) -> dict:
        branch = data['branch']
        booking_datetime = data['booking_datetime']

        if not branch.is_open_at(booking_datetime):
            raise serializers.ValidationError("Филиал не работает в это время")
        
        if booking_datetime < timezone.now():
            raise serializers.ValidationError("Дата и время бронирования не могут быть в прошлом")
        
        return data


class BookingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'booking_datetime',
            'guests_count',
            'special_requests'
        ]


class BookingDetailsSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name')
    branch_address = serializers.CharField(source='branch.address')
    branch_image = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    booking_date = serializers.SerializerMethodField()
    booking_time = serializers.SerializerMethodField()
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id',
            'user',
            'branch',
            'branch_name',
            'branch_address',
            'branch_image',
            'booking_datetime',
            'booking_date',
            'booking_time',
            'guests_count',
            'special_requests',
            'status',
            'book_number',
            'table',
            'created_at'
        ]
    
    def get_branch_image(self, obj):
        if hasattr(obj.branch, 'photo') and obj.branch.photo:
            return obj.branch.photo.url
        return None
    
    def get_booking_date(self, obj):
        return obj.booking_datetime.date().isoformat()
    
    def get_booking_time(self, obj):
        return obj.booking_datetime.time().strftime("%H:%M")


class AdminBookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'user', 'booking_datetime', 'guests_count', 'status', 'special_requests', 'created_at', 'book_number', 'table']





















