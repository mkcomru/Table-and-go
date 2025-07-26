from django.urls import path
from .views import (
    EstablishmentListView, 
    BranchListView, 
    BranchDetailView, 
    BranchAdminView,
    BranchUpdateView,
    BranchMainPhotoUploadView,
    BranchPhotoListCreateView,
    BranchPhotoDetailView,
    MenuUploadView
)


urlpatterns = [
    path('establishments/', EstablishmentListView.as_view(), name='establishment_list'),
    path('branch/', BranchListView.as_view(), name='branch_list'),
    path('branch/<int:pk>/', BranchDetailView.as_view(), name='branch_detail'),
    path('branch/<int:pk>/update/', BranchUpdateView.as_view(), name='branch_update'),
    path('branch/<int:pk>/upload-main-photo/', BranchMainPhotoUploadView.as_view(), name='branch_upload_main_photo'),
    path('branch/<int:pk>/photos/', BranchPhotoListCreateView.as_view(), name='branch_photos'),
    path('branch/<int:branch_pk>/photos/<int:photo_pk>/', BranchPhotoDetailView.as_view(), name='branch_photo_detail'),
    path('branch/<int:pk>/upload-menu/', MenuUploadView.as_view(), name='branch_upload_menu'),
    path('branch-admin/', BranchAdminView.as_view(), name='branch_admin'),
]






