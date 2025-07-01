from rest_framework import serializers
from .models import Review
from establishments.models import Branch


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            'branch',
            'rating',
            'comment',
            'visit_date',
        ]
        
    def validate_branch(self, value):
        try:
            Branch.objects.get(pk=value.id)
        except Branch.DoesNotExist:
            raise serializers.ValidationError("Указанный филиал не существует")
        return value


class ReviewSerializer(serializers.ModelSerializer):
    branch_name = serializers.SerializerMethodField()
    branch_address = serializers.SerializerMethodField()
    branch_image = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    text = serializers.CharField(source='comment')
    
    class Meta:
        model = Review
        fields = [
            'id',
            'rating',
            'text',
            'created_at',
            'branch_name',
            'branch_address',
            'branch_image',
            'user_name',
            'is_approved',
        ]
    
    def get_branch_name(self, obj):
        return obj.branch.name if obj.branch else 'Неизвестное заведение'
    
    def get_branch_address(self, obj):
        return obj.branch.address if obj.branch else ''
    
    def get_branch_image(self, obj):
        return obj.branch.get_main_image()
    
    def get_user_name(self, obj):
        if obj.user:
            if obj.user.first_name and obj.user.last_name:
                return f"{obj.user.first_name} {obj.user.last_name}"
            elif obj.user.first_name:
                return obj.user.first_name
            else:
                return obj.user.username
        return 'Анонимный пользователь'










