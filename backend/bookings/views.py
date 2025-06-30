from rest_framework.generics import ListAPIView, UpdateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Booking
from .serializers import BookingListSerializer, BookingCreateSerializer, BookingUpdateSerializer


class BookingListBranchView(ListAPIView):
    queryset = Booking.objects.all()
    serializer_class =  BookingListSerializer
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


class BookingListUserView(ListAPIView):
    queryset = Booking.objects.all()
    serializer_class =  BookingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.filter(branch=self.request.user)
        status = self.request.query_params.get('status')

        if status == 'pending' or status == 'confirmed':
            queryset = queryset.filter(status__in=['pending', 'confirmed'])
        elif status == 'cancelled':
            queryset = queryset.filter(status='cancelled')
        elif status == 'completed':
            queryset = queryset.filter(status='completed')

        return queryset


class BookingCancelView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
            
            if booking.status in ['cancelled', 'completed']:
                return Response({
                    "success": False,
                    "message": f"Невозможно отменить бронь в статусе '{booking.status}'"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            booking.status = 'cancelled'
            booking.save()
            
            return Response({
                "success": True,
                "message": "Бронирование успешно отменено",
                "booking_id": booking.id,
                "booking_number": booking.book_number
            }, status=status.HTTP_200_OK)
            
        except Booking.DoesNotExist:
            return Response({
                "success": False,
                "message": "Бронирование не найдено или у вас нет прав на его отмену"
            }, status=status.HTTP_404_NOT_FOUND)


class BookingUpdateView(UpdateAPIView):
    serializer_class = BookingUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

















