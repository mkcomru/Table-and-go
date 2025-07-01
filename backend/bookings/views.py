from rest_framework.generics import ListAPIView, UpdateAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Booking
from .serializers import (BookingListSerializer, BookingCreateSerializer, 
                        BookingUpdateSerializer, BookingDetailsSerializer, AdminBookingSerializer)
import datetime
from rest_framework.exceptions import PermissionDenied
from establishments.models import BranchAdmin, Branch


class BookingListUserView(ListAPIView):
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


class BookingListBranchView(ListAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if not user.is_staff:
            return queryset.none()  
            
        branch_id = self.request.query_params.get('branch_id')
        
        if user.is_superuser:
            if branch_id:
                queryset = queryset.filter(branch_id=branch_id)
            else:
                return queryset.none()
        elif user.is_staff:
            if hasattr(user, 'administered_branch') and user.administered_branch:
                queryset = queryset.filter(branch_id=user.administered_branch.id)
            else:
                return queryset.none()
        
        status = self.request.query_params.get('status')
        if status == 'pending':
            queryset = queryset.filter(status='pending')
        elif status == 'confirmed':
            queryset = queryset.filter(status='confirmed')
        elif status == 'cancelled':
            queryset = queryset.filter(status='cancelled')
        elif status == 'completed':
            queryset = queryset.filter(status='completed')
        elif status == 'all':
            pass  
        
        date_filter = self.request.query_params.get('date')
        if date_filter:
            try:
                day, month, year = date_filter.split('.')
                filter_date = datetime.date(int(year), int(month), int(day))
                queryset = queryset.filter(datetime__date=filter_date)
            except (ValueError, IndexError):
                pass
                
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
    lookup_field = 'id'
    lookup_url_kwarg = 'booking_id'

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)


class BookingDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id, user=request.user)
            serializer = BookingDetailsSerializer(booking)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Booking.DoesNotExist:
            return Response({
                "success": False,
                "message": "Бронирование не найдено или у вас нет прав на его просмотр"
            }, status=status.HTTP_404_NOT_FOUND)


class BranchBookingsView(ListAPIView):
    serializer_class = AdminBookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        branch_id = self.kwargs.get('branch_id')
        
        # Проверяем, является ли пользователь администратором этого филиала
        is_admin = BranchAdmin.objects.filter(
            user=self.request.user,
            branch_id=branch_id,
            is_active=True
        ).exists()
        
        if not is_admin:
            raise PermissionDenied("Вы не являетесь администратором данного филиала")
        
        # Получаем базовый QuerySet для броней филиала
        queryset = Booking.objects.filter(branch_id=branch_id)
        
        # Фильтрация по статусу
        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        
        # Сортировка по дате бронирования (от новых к старым)
        return queryset.order_by('-booking_datetime')

















