from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'restaurant', 'table', 'booking_datetime', 'guests_count', 'status')
    list_filter = ('status', 'restaurant', 'booking_datetime')
    search_fields = ('user__first_name', 'user__last_name', 'user__email', 'restaurant__name')
    date_hierarchy = 'booking_datetime'
    list_editable = ('status',)
    readonly_fields = ('created_at', 'updated_at')
    








