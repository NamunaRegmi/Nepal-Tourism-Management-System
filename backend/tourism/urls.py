from django.urls import path
from .views import (
    GoogleLoginView, 
    UserProfileView, 
    RegisterView, 
    LoginView,
    ForgotPasswordView,
    ResetPasswordView
)

urlpatterns = [
    path('auth/google/', GoogleLoginView.as_view(), name='google-login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),
]