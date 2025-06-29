from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Review
from .serializers import ReviewCreateSerializer


class ReviewCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReviewCreateSerializer(data=request.data)

        if serializer.is_valid():
            validated_data = serializer.validated_data

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
        
        return Response(serializer.errors)











