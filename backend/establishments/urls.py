from django.urls import path
from .views import EstablishmentListView, BranchListView


app_name = 'restaurants'

urlpatterns = [
    path('establishments/', EstablishmentListView.as_view(), name='establishment_list'),
    path('branch/', BranchListView.as_view(), name='branch_list')
]






