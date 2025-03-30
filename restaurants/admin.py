from django.contrib import admin
from .models import Cuisine, Restaurant


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




