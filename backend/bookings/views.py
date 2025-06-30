from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Booking
from .serializers import BookingSerializer, BookingCreateSerializer


class BookingListView(ListAPIView):
    queryset = Booking.objects.all()
    serializer_class =  BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.filter(user=self.request.user)
        status = self.request.query_params.get('status')

        if status == 'pending' or status == 'confirmed':
            queryset = queryset.filter(status__in=['pending', 'confirmed'])
        elif status == 'cancelled':
            queryset = queryset.filter(status='cancelled')
        elif status == 'completed':
            queryset = queryset.filter(status='completed')

        return queryset


class BookingCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)

        if serializer.is_valid():
            validated_data = serializer.validated_data

            booking = Booking.objects.create(
                user=request.user,
                branch=validated_data['branch'],
                booking_datetime=validated_data['booking_datetime'],
                guests_count=validated_data['guests_count'],
                special_requests=validated_data.get('special_requests', ''),
                status='pending'
            )

            return Response({
                "success": True,
                "message": "Заявка на бронирование успешно создана",
                "booking_id": booking.id,
                "booking_number": booking.book_number,
                "booking_datetime": booking.booking_datetime,
                "status": booking.status,
                "branch_name": booking.branch.name
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors)


















