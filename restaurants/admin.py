from django.contrib import admin
from .models import Cuisine, Establishment, EstablishmentAdmin, AdminInvitation, Table, WorkingHours, Menu, RestaurantImage


@admin.register(EstablishmentAdmin)
class EstablishmentAdminAdmin(admin.ModelAdmin):
    list_display = ('user', 'restaurant', 'is_active', 'date_added')
    list_filter = ('is_active', 'restaurant')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'restaurant__name')
    date_hierarchy = 'date_added'

@admin.register(AdminInvitation)
class AdminInvitationAdmin(admin.ModelAdmin):
    list_display = ('email', 'restaurant', 'is_used', 'created_at', 'expires_at')
    list_filter = ('is_used', 'restaurant')
    search_fields = ('email', 'restaurant__name')
    date_hierarchy = 'created_at'
    readonly_fields = ('invitation_code',)


@admin.register(Cuisine)
class CuisineAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Establishment)
class EstablishmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'phone', 'email')
    list_filter = ['cuisines']
    search_fields = ('name', 'address', 'description')
    filter_horizontal = ['cuisines']


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('number', 'restaurant', 'capacity', 'status', 'location')
    list_filter = ('restaurant', 'status', 'capacity')
    search_fields = ('number', 'restaurant__name', 'location')
    list_editable = ('status',)
    

@admin.register(WorkingHours)
class WorkingHoursAdmin(admin.ModelAdmin):
    list_display = ('restaurant', 'get_day_of_week_display', 'opening_time', 'closing_time', 'is_closed')
    list_filter = ('restaurant', 'day_of_week', 'is_closed')
    search_fields = ('restaurant__name',)
    list_editable = ('opening_time', 'closing_time', 'is_closed')


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'category', 'price', 'is_available')
    list_filter = ('restaurant', 'category', 'is_available')
    search_fields = ('name', 'restaurant__name', 'description')
    list_editable = ('price', 'is_available')


@admin.register(RestaurantImage)
class RestaurantImageAdmin(admin.ModelAdmin):
    list_display = ('restaurant', 'caption', 'is_main', 'order')
    list_filter = ('restaurant', 'is_main')
    search_fields = ('restaurant__name', 'caption')
    list_editable = ('is_main', 'order')




