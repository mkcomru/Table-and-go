from django.contrib import admin
from .models import APIKey


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ('name', 'key_preview', 'is_active', 'created_at', 'last_used')
    list_filter = ('is_active',)
    search_fields = ('name',)
    readonly_fields = ('key', 'created_at', 'last_used')

    def key_preview(self, obj):
        return f"{obj.key[:8]}...{obj.key[-8:]}"
    
    key_preview.short_description = "API ключ"











