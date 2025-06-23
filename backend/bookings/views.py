from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from .models import Booking
from .serializers import BookingSerializer


class BookingListView(ListAPIView):
    queryset = Booking.objects.all()
    serializer_class =  BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')

        if status == 'pending' or status == 'confirmed':
            queryset = queryset.filter(status__in=['pending', 'confirmed'])
        elif status == 'cancelled':
            queryset = queryset.filter(status='cancelled')
        elif status == 'completed':
            queryset = queryset.filter(status='completed')

        return queryset

















