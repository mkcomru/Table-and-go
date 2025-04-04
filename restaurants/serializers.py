from rest_framework import serializers
from .models import Establishment, EstablishmentAdmin, RestaurantImage, Cuisine, Table, AdminInvitation, WorkingHours, Menu


class EstablishmentListSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()
    cuisine_types = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Establishment
        fields = [
            'id', 
            'name', 
            'establishment_type', 
            'photo', 
            'cuisine_types', 
            'average_check', 
            'address', 
            'average_rating'
        ]
    
    def get_photo(self, obj):
        return obj.get_main_image()
    
    def get_cuisine_types(self, obj):
        return [cuisine.name for cuisine in obj.cuisines.all()]
    
    def get_average_rating(self, obj):
        return obj.average_rating()













