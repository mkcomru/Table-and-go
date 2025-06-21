from django.contrib import admin
from .models import Cuisine, Establishment, EstablishmentAdmin, AdminInvitation, Table, WorkingHours, Menu, BranchImage, Branch


@admin.register(EstablishmentAdmin)
class EstablishmentAdminAdmin(admin.ModelAdmin):
    list_display = ('user', 'establishment', 'is_active', 'date_added')
    list_filter = ('is_active', 'establishment')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'establishment__name')
    date_hierarchy = 'date_added'

@admin.register(AdminInvitation)
class AdminInvitationAdmin(admin.ModelAdmin):
    list_display = ('email', 'establishment', 'is_used', 'created_at', 'expires_at')
    list_filter = ('is_used', 'establishment')
    search_fields = ('email', 'establishment__name')
    date_hierarchy = 'created_at'
    readonly_fields = ('invitation_code',)


@admin.register(Cuisine)
class CuisineAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Establishment)
class EstablishmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'establishment_type', 'get_branches_count', 'created_at')
    list_filter = ['cuisines', 'establishment_type']
    search_fields = ('name', 'description')
    filter_horizontal = ['cuisines']
    
    def get_branches_count(self, obj):
        return obj.get_branches_count()
    get_branches_count.short_description = 'Количество филиалов'


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'establishment', 'is_main', 'address', 'district', 'phone', 'average_check')
    list_filter = ('establishment', 'is_main', 'district')
    search_fields = ('name', 'address', 'establishment__name')
    list_editable = ('is_main',)
    

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('number', 'branch', 'capacity', 'status', 'location')
    list_filter = ('branch', 'status', 'capacity')
    search_fields = ('number', 'branch__name', 'location')
    list_editable = ('status',)
    

@admin.register(WorkingHours)
class WorkingHoursAdmin(admin.ModelAdmin):
    list_display = ('branch', 'get_day_of_week_display', 'opening_time', 'closing_time', 'is_closed')
    list_filter = ('branch', 'day_of_week', 'is_closed')
    search_fields = ('branch__name',)
    list_editable = ('opening_time', 'closing_time', 'is_closed')


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    list_display = ('name', 'branch', 'category', 'price', 'is_available')
    list_filter = ('branch', 'category', 'is_available')
    search_fields = ('name', 'branch__name', 'description')
    list_editable = ('price', 'is_available')


@admin.register(BranchImage)
class BranchImageAdmin(admin.ModelAdmin):
    list_display = ('branch', 'caption', 'is_main', 'order')
    list_filter = ('branch', 'is_main')
    search_fields = ('branch__name', 'caption')
    list_editable = ('is_main', 'order')




