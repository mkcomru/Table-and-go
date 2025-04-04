from rest_framework import serializers
from .models import Restaurant, RestaurantAdmin, RestaurantImage, Cuisine, Table, RestaurantInvitation, WorkingHours, Menu


class EstablishmentListSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()
    cuisine_types = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Restaurant
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













