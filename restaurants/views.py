from django.shortcuts import render
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from .models import Establishment
from .serializers import EstablishmentListSerializer


class EstablishmentListView(ListAPIView):
    queryset = Establishment.objects.all()
    serializer_class = EstablishmentListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()

        establishment_type = self.request.query_params.get('type')
        if establishment_type: 
            return queryset.filter(establishment_type=establishment_type)
        








