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
    HotelListView,
    ProviderHotelListView,
    HotelDetailView,
    RoomListView,
    RoomDetailView,
    PackageListView,
    ProviderPackageListView,
    PackageDetailView,
    BookingListView,
    BookingDetailView,
    KhaltiVerifyView,
    KhaltiPaymentInitiateView,
    KhaltiPaymentVerifyView,
    KhaltiPaymentCallbackView,
    KhaltiPaymentStatusView,
    EsewaPaymentInitiateView,
    EsewaPaymentVerifyView,
    EsewaPaymentCallbackView,
    AdminDashboardStatsView,
    AdminUserListView,
    AdminUserDetailView,
    AdminProviderListView,
    AdminProviderDetailView,
    AdminHotelListView,
    AdminPackageListView,
    TourGuideListView,
    TourGuideDetailView,
    TourGuideMeProfileView,
    GuideBookingListView,
    GuideBookingDetailView,
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
    path('provider/packages/', ProviderPackageListView.as_view(), name='provider-package-list'),
    path('packages/<int:pk>/', PackageDetailView.as_view(), name='package-detail'),
    
    # Tour guides
    path('guides/', TourGuideListView.as_view(), name='guide-list'),
    path('guides/me/profile/', TourGuideMeProfileView.as_view(), name='guide-me-profile'),
    path('guides/<int:pk>/', TourGuideDetailView.as_view(), name='guide-detail'),

    path('guide-bookings/', GuideBookingListView.as_view(), name='guide-booking-list'),
    path('guide-bookings/<int:pk>/', GuideBookingDetailView.as_view(), name='guide-booking-detail'),

    # Booking URLs
    path('bookings/', BookingListView.as_view(), name='booking-list'),
    path('bookings/<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('bookings/<int:pk>/verify-khalti/', KhaltiVerifyView.as_view(), name='booking-verify-khalti'),
    
    # Khalti Payment URLs
    path('payment/khalti/initiate/', KhaltiPaymentInitiateView.as_view(), name='khalti-payment-initiate'),
    path('payment/khalti/verify/', KhaltiPaymentVerifyView.as_view(), name='khalti-payment-verify'),
    path('payment/khalti/callback/', KhaltiPaymentCallbackView.as_view(), name='khalti-payment-callback'),
    path('payment/khalti/status/<str:pidx>/', KhaltiPaymentStatusView.as_view(), name='khalti-payment-status'),
    
    # eSewa Payment URLs
    path('payment/esewa/initiate/', EsewaPaymentInitiateView.as_view(), name='esewa-payment-initiate'),
    path('payment/esewa/verify/', EsewaPaymentVerifyView.as_view(), name='esewa-payment-verify'),
    path('payment/esewa/callback/', EsewaPaymentCallbackView.as_view(), name='esewa-payment-callback'),
    
    # Admin URLs
    path('admin/stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/providers/', AdminProviderListView.as_view(), name='admin-providers'),
    path('admin/providers/<int:pk>/', AdminProviderDetailView.as_view(), name='admin-provider-detail'),
    path('admin/hotels/', AdminHotelListView.as_view(), name='admin-hotels'),
    path('admin/packages/', AdminPackageListView.as_view(), name='admin-packages'),
]
