from django.urls import path
from .views import (
    GoogleLoginView, 
    UserProfileView, 
    RegisterView, 
    LoginView,
    ForgotPasswordView,
    ResetPasswordView,
    DestinationListView,
    DestinationDetailView,
    DestinationDetailView,
    HotelListView,
    ProviderHotelListView,
    HotelDetailView,
    RoomListView,
    RoomDetailView,
    PackageListView,
    PackageDetailView,
    BookingListView,
    BookingDetailView,
    AdminDashboardStatsView,
)

urlpatterns = [
    # Authentication URLs
    path('auth/google/', GoogleLoginView.as_view(), name='google-login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),
    
    # Destination URLs
    path('destinations/', DestinationListView.as_view(), name='destination-list'),
    path('destinations/<int:pk>/', DestinationDetailView.as_view(), name='destination-detail'),
    
    # Hotel URLs
    path('destinations/<int:destination_id>/hotels/', HotelListView.as_view(), name='hotel-list'),
    path('provider/hotels/', ProviderHotelListView.as_view(), name='provider-hotel-list'),
    path('hotels/<int:pk>/', HotelDetailView.as_view(), name='hotel-detail'),
    
    # Room URLs
    path('hotels/<int:hotel_id>/rooms/', RoomListView.as_view(), name='room-list'),
    path('rooms/<int:pk>/', RoomDetailView.as_view(), name='room-detail'),
    
    # Package URLs
    path('packages/', PackageListView.as_view(), name='package-list'),
    path('packages/<int:pk>/', PackageDetailView.as_view(), name='package-detail'),
    
    # Booking URLs
    path('bookings/', BookingListView.as_view(), name='booking-list'),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    
    # Admin URLs
    path('admin/stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
]
