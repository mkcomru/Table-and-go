from django.db.models import Avg
from rest_framework.generics import ListAPIView, RetrieveAPIView, UpdateAPIView, CreateAPIView, DestroyAPIView
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from .models import Establishment, Branch, BranchAdmin, BranchImage, Menu
from .serializers import (EstablishmentListSerializer, BranchListSerializer, 
                        BranchDetailSerializer, BranchAdminSerializer,
                        BranchUpdateSerializer, BranchImageSerializer,
                        BranchMainPhotoSerializer, MenuUploadSerializer)


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


class BranchUpdateView(UpdateAPIView):
    """
    Представление для обновления информации о филиале.
    Доступно только для администраторов филиала.
    """
    queryset = Branch.objects.all()
    serializer_class = BranchUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Получаем только те филиалы, где пользователь является администратором
        user = self.request.user
        if user.is_staff:
            admin_branches = BranchAdmin.objects.filter(user=user, is_active=True).values_list('branch_id', flat=True)
            return Branch.objects.filter(id__in=admin_branches)
        return Branch.objects.none()
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Возвращаем обновленные данные с использованием BranchDetailSerializer
        detail_serializer = BranchDetailSerializer(instance, context={'request': request})
        return Response(detail_serializer.data)


class BranchMainPhotoUploadView(UpdateAPIView):
    """
    Представление для загрузки главного фото филиала.
    Доступно только для администраторов филиала.
    """
    queryset = Branch.objects.all()
    serializer_class = BranchMainPhotoSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        # Получаем только те филиалы, где пользователь является администратором
        user = self.request.user
        if user.is_staff:
            admin_branches = BranchAdmin.objects.filter(user=user, is_active=True).values_list('branch_id', flat=True)
            return Branch.objects.filter(id__in=admin_branches)
        return Branch.objects.none()
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Возвращаем URL главного фото
        main_image = BranchImage.objects.filter(branch=instance, is_main=True).first()
        if main_image:
            return Response({
                'main_photo': request.build_absolute_uri(main_image.image.url)
            })
        return Response({'error': 'Ошибка при загрузке фото'}, status=status.HTTP_400_BAD_REQUEST)


class BranchPhotoListCreateView(APIView):
    """
    Представление для получения списка и создания фотографий филиала.
    Доступно только для администраторов филиала.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_branch(self, pk):
        # Получаем филиал и проверяем права доступа
        user = self.request.user
        if user.is_staff:
            admin_branches = BranchAdmin.objects.filter(user=user, is_active=True).values_list('branch_id', flat=True)
            try:
                return Branch.objects.get(id=pk, id__in=admin_branches)
            except Branch.DoesNotExist:
                return None
        return None
    
    def get(self, request, pk):
        branch = self.get_branch(pk)
        if not branch:
            return Response({'error': 'Филиал не найден или у вас нет прав доступа'}, 
                            status=status.HTTP_404_NOT_FOUND)
        
        photos = BranchImage.objects.filter(branch=branch)
        serializer = BranchImageSerializer(photos, many=True, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request, pk):
        branch = self.get_branch(pk)
        if not branch:
            return Response({'error': 'Филиал не найден или у вас нет прав доступа'}, 
                            status=status.HTTP_404_NOT_FOUND)
        
        # Добавляем branch_id в данные запроса
        data = request.data.copy()
        data['branch'] = branch.id
        
        serializer = BranchImageSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BranchPhotoDetailView(DestroyAPIView):
    """
    Представление для удаления фотографии филиала.
    Доступно только для администраторов филиала.
    """
    queryset = BranchImage.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Получаем только те фотографии, которые принадлежат филиалам, 
        # где пользователь является администратором
        user = self.request.user
        branch_pk = self.kwargs.get('branch_pk')
        
        if user.is_staff:
            admin_branches = BranchAdmin.objects.filter(user=user, is_active=True).values_list('branch_id', flat=True)
            queryset = BranchImage.objects.filter(branch_id__in=admin_branches)
            
            # Дополнительно фильтруем по branch_pk, если он указан
            if branch_pk:
                queryset = queryset.filter(branch_id=branch_pk)
                
            return queryset
        return BranchImage.objects.none()


class MenuUploadView(UpdateAPIView):
    """
    Представление для загрузки меню ресторана.
    Доступно только для администраторов филиала.
    """
    queryset = Branch.objects.all()
    serializer_class = MenuUploadSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        # Получаем только те филиалы, где пользователь является администратором
        user = self.request.user
        if user.is_staff:
            admin_branches = BranchAdmin.objects.filter(user=user, is_active=True).values_list('branch_id', flat=True)
            return Branch.objects.filter(id__in=admin_branches)
        return Branch.objects.none()
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Возвращаем URL меню
        menu = Menu.objects.filter(branch=instance).first()
        if menu:
            return Response({
                'menu_pdf': request.build_absolute_uri(menu.pdf_menu.url)
            })
        return Response({'error': 'Ошибка при загрузке меню'}, status=status.HTTP_400_BAD_REQUEST)


class BranchAdminView(ListAPIView):
    queryset = BranchAdmin.objects.all()
    serializer_class = BranchAdminSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BranchAdmin.objects.filter(user=self.request.user)















