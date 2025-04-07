from django.shortcuts import render
from django.db.models import Avg
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from .models import Establishment, Branch
from .serializers import EstablishmentListSerializer, BranchListSerializer


class EstablishmentListView(ListAPIView):
    queryset = Establishment.objects.all()
    serializer_class = EstablishmentListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()

        establishment_type = self.request.query_params.get('type')
        if establishment_type: 
            return queryset.filter(establishment_type=establishment_type)


class BranchListView(ListAPIView):
    queryset = Branch.objects.all()
    serializer_class = BranchListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Branch.objects.select_related(
            'establishment',
            'district'
        ).prefetch_related(
            'working_hours',
            'tables'
        )

        establishment_type = self.request.query_params.get('type')
        district_id = self.request.query_params.get('district')
        min_rating = self.request.query_params.get('rating')
        min_check = self.request.query_params.get('check')
        cuisine_id = self.request.query_params.get('cuisine_id')

        if establishment_type:
            queryset = queryset.filter(establishment__establishment_type=establishment_type)

        if district_id:
            queryset = queryset.filter(district_id=district_id)

        if min_rating:
            queryset = queryset.annotate(
                avg_rating=Avg('reviews__rating')
            ).filter(avg_rating__gte=float(min_rating))

        if min_check:
            queryset = queryset.filter(average_check__gte=float(min_check))

        if cuisine_id:
            queryset = queryset.filter(establishment__cuisine_id=cuisine_id)

        return queryset








