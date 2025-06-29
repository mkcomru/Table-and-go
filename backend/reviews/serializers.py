from rest_framework import serializers
from .models import Review


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            'user',
            'branch',
            'rating',
            'comment',
            'visit_date',
        ]










