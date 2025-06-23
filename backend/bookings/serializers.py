from pydoc import ModuleScanner

from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    branch_name = serializers.ModelSerializer()
    branch_image = serializers.ModelSerializer()
    booking_date = serializers.ModelSerializer()
    booking_time = serializers.ModelSerializer()
    branch_address = serializers.ModelSerializer()

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
        return obj.branch.name

    def get_branch_image(self, obj):
        return obj.get_branch_image()

    def get_booking_date(self, obj):
        return obj.booking_datetime.date().strftime('%Y-%m-%d')

    def get_booking_time(self, obj):
        return obj.booking_datetime.time().strftime('%H:%M')

    def get_branch_address(self, obj):
        return obj.branch.address















