from rest_framework import serializers
from .models import Establishment, Branch


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


class BranchListSerializer(serializers.ModelSerializer):
    establishment_name = serializers.SerializerMethodField()
    establishment_type = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    working_hours = serializers.SerializerMethodField()
    tables_count = serializers.SerializerMethodField()
    available_tables_count = serializers.SerializerMethodField()
    cuisine_types = serializers.SerializerMethodField()
    district = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            'id',
            'name',
            'address',
            'district',
            'phone',
            'average_check',
            'is_main',
            'establishment_name',
            'establishment_type',
            'photo',
            'rating',
            'working_hours',
            'tables_count',
            'available_tables_count',
            'cuisine_types'
        ]

    def get_rating(self, obj):
        return obj.average_rating()

    def get_establishment_name(self, obj):
        return obj.establishment.name

    def get_establishment_type(self, obj):
        return obj.establishment.establishment_type
    
    def get_photo(self, obj):
        return obj.get_main_image()
    
    def get_working_hours(self, obj):
        hours = obj.working_hours.all().order_by('day_of_week')
        result = []

        for hour in hours:
            if hour.is_closed:
                status = "Выходной"
            else:
                status = f"{hour.opening_time.strftime('%H:%M')} - {hour.closing_time.strftime('%H:%M')}"
        
            result.append({
                'day_of_week': hour.day_of_week,
                'day_name': hour.get_day_of_week_display(),
                'status': status,
                'is_closed': hour.is_closed
            })

        return result
    
    def get_tables_count(self, obj):
        return obj.table_count()
    
    def get_available_tables_count(self, obj):
        return obj.get_available_tables().count()
    
    def get_cuisine_types(self, obj):
        return [cuisine.name for cuisine in obj.establishment.cuisines.all()]
    
    def get_district(self, obj):
        return obj.district.name












