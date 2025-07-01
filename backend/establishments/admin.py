from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
import string
import random
from datetime import timedelta
from .models import Cuisine, Establishment, BranchAdmin, AdminInvitation, Table, WorkingHours, Menu, BranchImage, Branch


@admin.register(BranchAdmin)
class BranchAdminAdmin(admin.ModelAdmin):
    list_display = ('user', 'branch', 'establishment_name', 'is_active', 'date_added')
    list_filter = ('branch__establishment', 'is_active')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'branch__name')
    
    def establishment_name(self, obj):
        return obj.branch.establishment.name
    establishment_name.short_description = "Заведение"
    
    def save_model(self, request, obj, form, change):
        """
        При сохранении модели BranchAdmin показываем сообщение о том,
        что приглашение будет отправлено автоматически.
        """
        super().save_model(request, obj, form, change)
        if not change:  # Только при создании новой записи
            self.message_user(
                request, 
                f"Приглашение администратора будет автоматически отправлено на email: {obj.user.email}"
            )

@admin.register(AdminInvitation)
class AdminInvitationAdmin(admin.ModelAdmin):
    list_display = ('email', 'branch', 'establishment_name', 'created_at', 'expires_at', 'is_used', 'is_valid', 'invitation_link')
    list_filter = ('is_used', 'branch__establishment')
    search_fields = ('email', 'branch__name', 'branch__establishment__name')
    readonly_fields = ('invitation_code', 'created_at')
    
    def establishment_name(self, obj):
        return obj.branch.establishment.name
    establishment_name.short_description = "Заведение"
    
    def is_valid(self, obj):
        return obj.is_valid()
    is_valid.boolean = True
    is_valid.short_description = "Действительно"
    
    def invitation_link(self, obj):
        from django.conf import settings
        url = f"{settings.FRONTEND_URL}/admin/activate/{obj.invitation_code}/"
        return format_html('<a href="{}" target="_blank">Ссылка для активации</a>', url)
    invitation_link.short_description = "Ссылка"
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))
            obj.invitation_code = code
            
            if not obj.expires_at:
                obj.expires_at = timezone.now() + timedelta(days=7)
        
        super().save_model(request, obj, form, change)


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
    list_display = ('__str__', 'establishment', 'is_main', 'address', 'district', 'phone', 'average_check', 'allow_to_book')
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
    list_display = ('title', 'branch', 'uploaded_at')
    list_filter = ('branch',)
    search_fields = ('title', 'branch__name')


@admin.register(BranchImage)
class BranchImageAdmin(admin.ModelAdmin):
    list_display = ('branch', 'caption', 'is_main', 'order')
    list_filter = ('branch', 'is_main')
    search_fields = ('branch__name', 'caption')
    list_editable = ('is_main', 'order')




