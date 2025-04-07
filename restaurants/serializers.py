from rest_framework import serializers
from .models import Establishment, EstablishmentAdmin, BranchImage, Cuisine, Table, AdminInvitation, WorkingHours, Menu


class EstablishmentListSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()
    cuisine_types = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    average_check = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    branches_count = serializers.SerializerMethodField()
    
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
            'average_rating',
            'branches_count'
        ]
    
    def get_photo(self, obj):
        main_branch = obj.get_main_branch()
        if main_branch:
            return main_branch.get_main_image()
        return None
    
    def get_cuisine_types(self, obj):
        return [cuisine.name for cuisine in obj.cuisines.all()]
    
    def get_average_rating(self, obj):
        main_branch = obj.get_main_branch()
        if main_branch:
            return main_branch.average_rating()
        return 0
    
    def get_average_check(self, obj):
        main_branch = obj.get_main_branch()
        if main_branch:
            return main_branch.average_check
        return 0
    
    def get_address(self, obj):
        main_branch = obj.get_main_branch()
        if main_branch:
            return main_branch.address
        return None
        
    def get_branches_count(self, obj):
        return obj.get_branches_count()













