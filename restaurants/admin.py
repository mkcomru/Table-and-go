from django.contrib import admin
from .models import Cuisine, Restaurant, RestaurantAdmin, AdminInvitation


@admin.register(RestaurantAdmin)
class RestaurantAdminAdmin(admin.ModelAdmin):
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


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'phone', 'email')
    list_filter = ['cuisines']
    search_fields = ('name', 'address', 'description')
    filter_horizontal = ['cuisines']




