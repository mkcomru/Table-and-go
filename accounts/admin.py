from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'phone', 'first_name', 'last_name', 'is_staff', 'is_system_admin')
    list_filter = ('is_active', 'is_staff', 'is_system_admin')
    fieldsets = (
        (None, {'fields': ('phone', 'email', 'password')}),
        ('Персональная информация', {'fields': ('first_name', 'last_name', 'photo')}),
        ('Права', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_system_admin')}),
        ('Важные даты', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone', 'email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
    search_fields = ('email', 'phone', 'first_name', 'last_name')
    ordering = ('email',)
