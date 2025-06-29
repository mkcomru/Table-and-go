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










