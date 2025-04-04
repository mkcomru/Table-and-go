from django.urls import path
from .views import EstablishmentListView


app_name = 'restaurants'

urlpatterns = [
    path('establishments/', EstablishmentListView.as_view(), name='establishment_list')
]






