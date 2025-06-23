from django.urls import path
from .views import BookingListView


urlpatterns = [
    path('bookings/', BookingListView.as_view(), name='booking_list'),
]










