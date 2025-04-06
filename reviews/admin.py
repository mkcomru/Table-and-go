from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'branch', 'rating', 'visit_date', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'rating', 'branch', 'visit_date')
    search_fields = ('user__first_name', 'user__last_name', 'user__email', 'branch__name', 'comment')
    date_hierarchy = 'created_at'
    list_editable = ('is_approved',)
    readonly_fields = ('created_at',)
