from django.urls import path
from .views import BookingListBranchView, BookingCreateView, BookingCancelView, BookingUpdateView, BookingDetailsView


urlpatterns = [
    path('bookings/', BookingListBranchView.as_view(), name='booking_list'),
    path('bookings/create/', BookingCreateView.as_view(), name='booking_create'),
    path('bookings/cancel/<int:booking_id>/', BookingCancelView.as_view(), name='booking_cancel'),
    path('bookings/update/<int:booking_id>/', BookingUpdateView.as_view(), name='booking_update'),
    path('bookings/<int:booking_id>/', BookingDetailsView.as_view(), name='booking_detail'),
]










