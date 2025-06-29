from rest_framework import serializers
from .models import Establishment, Branch, AdminInvitation, BranchAdmin


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
                work_time = "Выходной"
            else:
                work_time = f"{hour.opening_time.strftime('%H:%M')} - {hour.closing_time.strftime('%H:%M')}"
        
            result.append({
                'day_of_week': hour.day_of_week,
                'day_name': hour.get_day_of_week_display(),
                'work_time': work_time,
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


class BranchDetailSerializer(serializers.ModelSerializer):
    cuisine_types = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    working_hours = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    menu_pdf = serializers.SerializerMethodField()
    gallery = serializers.SerializerMethodField()
    district_name = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            'id',
            'name',
            'address',
            'district_name',
            'cuisine_types',
            'average_check',
            'average_rating',
            'working_hours',
            'phone',
            'email',
            'reviews',
            'allow_to_book',
            'menu_pdf',
            'gallery'
        ]

    def get_cuisine_types(self, obj):
        return [cuisine.name for cuisine in obj.establishment.cuisines.all()]

    def get_average_rating(self, obj):
        return obj.average_rating()

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

    def get_email(self, obj):
        return obj.establishment.email
    
    def get_district_name(self, obj):
        return obj.district.name

    def get_reviews(self, obj):
        reviews = obj.reviews.all()
        return [
            {
                'user_full_name': review.user.get_full_name(),
                'rating': review.rating,
                'comment': review.comment,
                'created_at': review.created_at.strftime('%Y-%m-%d')
            }
        for review in reviews]
    
    def get_menu_pdf(self, obj):
        menu = obj.menu.first()
        if menu and menu.pdf_menu:
            request = self.context.get('request')
            return request.build_absolute_uri(menu.pdf_menu.url) if request else menu.pdf_menu.url
        return None

    def get_gallery(self, obj):
        images = obj.images.all()
        request = self.context.get('request')
        return [
            {
                'id': img.id,
                'url': request.build_absolute_uri(img.image.url) if request else img.image.url,
                'caption': img.caption,
                'is_main': img.is_main
            } for img in images
        ]


class AdminInvitationSerializer(serializers.ModelSerializer):
    establishment_name = serializers.ReadOnlyField(source='branch.establishment.name')
    branch_name = serializers.SerializerMethodField()

    class Meta:
        model = AdminInvitation
        fields = [
            'id',
            'branch',
            'establishment_name',
            'branch_name',
            'email',
            'phone',
            'invitation_code',
            'is_used',
            'created_at',
            'expires_at',
            'is_valid'
        ]

    def get_branch_name(self, obj):
        return obj.branch.name
    
    def validate_email(self, email):
        branch_id = self.initial_data.get('branch')
        if branch_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(email=email)
                admin_exists = BranchAdmin.objects.filter(
                    user=user,
                    branch_id=branch_id,
                    is_active=True
                ).exists()
                if admin_exists:
                    raise serializers.ValidationError(
                        "Пользователь с таким email уже является администратором данного филиала"
                    )
            except User.DoesNotExist:
                pass
        return email















