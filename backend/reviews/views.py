from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Review
from .serializers import ReviewCreateSerializer
from django.db import IntegrityError


class ReviewCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReviewCreateSerializer(data=request.data)

        if serializer.is_valid():
            validated_data = serializer.validated_data

            try:
                # Пытаемся создать отзыв
                review = Review.objects.create(
                    user=request.user,
                    branch=validated_data['branch'],
                    rating=validated_data['rating'],
                    comment=validated_data['comment'],
                    visit_date=validated_data['visit_date']
                )

                return Response({
                    "success": True,
                    "message": "Отзыв успешно создан",
                    "review_id": review.id
                }, status=status.HTTP_201_CREATED)
            
            except IntegrityError:
                existing_review = Review.objects.get(
                    user=request.user,
                    branch=validated_data['branch']
                )
                
                existing_review.rating = validated_data['rating']
                existing_review.comment = validated_data['comment']
                existing_review.visit_date = validated_data['visit_date']
                existing_review.is_approved = False  
                existing_review.save()
                
                return Response({
                    "success": True,
                    "message": "Ваш предыдущий отзыв был обновлен",
                    "review_id": existing_review.id
                }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)











