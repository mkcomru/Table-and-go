from django.urls import path
from .views import EstablishmentListView, BranchListView, BranchDetailView


app_name = 'restaurants'

urlpatterns = [
    path('establishments/', EstablishmentListView.as_view(), name='establishment_list'),
    path('branch/', BranchListView.as_view(), name='branch_list'),
    path('branch/<int:pk>/', BranchDetailView.as_view(), name='branch_detail'),
]






