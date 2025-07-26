from django.urls import path
from .views import ReviewCreateView, UserReviewsView, ReviewDetailView


urlpatterns = [
    path('review/create/', ReviewCreateView.as_view(), name='review_create'),
    path('reviews/user/', UserReviewsView.as_view(), name='user_reviews'),
    path('reviews/<int:review_id>/', ReviewDetailView.as_view(), name='review_detail'),
]










