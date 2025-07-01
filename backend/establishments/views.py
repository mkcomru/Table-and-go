from django.db.models import Avg
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Establishment, Branch, BranchAdmin
from .serializers import (EstablishmentListSerializer, BranchListSerializer, 
                        BranchDetailSerializer, BranchAdminSerializer)


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
        district_ids = self.request.query_params.get('district')
        rating_sort = self.request.query_params.get('rating')
        check_range = self.request.query_params.get('check')
        cuisine_ids = self.request.query_params.get('cuisine')

        if establishment_type:
            queryset = queryset.filter(establishment__establishment_type=establishment_type)

        if district_ids:
            district_ids = [int(id) for id in district_ids.split(',')]
            queryset = queryset.filter(district__id__in=district_ids)

        if rating_sort:
            if rating_sort == "asc":
                queryset = queryset.annotate(avg_rating=Avg('reviews__rating')).order_by('avg_rating')
            elif rating_sort == 'desc':
                queryset = queryset.annotate(avg_rating=Avg('reviews__rating')).order_by('-avg_rating')

        if check_range:
            check_range = [int(price_id) for price_id in check_range.split(',') if price_id.isdigit()]

            from django.db.models import Q
            check_filter = Q()

            for price_id in check_range:
                if price_id == 1: check_filter |= Q(average_check__lte=500)
                elif price_id == 2: check_filter |= Q(average_check__gte=500, average_check__lte=1500)
                elif price_id == 3: check_filter |= Q(average_check__gte=1500, average_check__lte=2500)
                elif price_id == 4: check_filter |= Q(average_check__gte=2500)

            if check_filter:
                queryset = queryset.filter(check_filter)

        if cuisine_ids:
            cuisine_ids = [int(id) for id in cuisine_ids.split(',')]
            queryset = queryset.filter(establishment__cuisines__id__in=cuisine_ids)

        return queryset


class BranchDetailView(RetrieveAPIView):
    queryset = Branch.objects.all()
    serializer_class = BranchDetailSerializer
    permission_classes = [AllowAny]


class BranchAdminView(ListAPIView):
    queryset = BranchAdmin.objects.all()
    serializer_class = BranchAdminSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BranchAdmin.objects.filter(user=self.request.user)















