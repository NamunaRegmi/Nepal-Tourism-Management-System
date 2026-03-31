from django.contrib import admin
from .models import User, Destination, Hotel


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'first_name', 'last_name', 'is_active']
    list_filter = ['role', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ['name', 'province', 'is_active', 'created_at', 'created_by']
    list_filter = ['province', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ['name', 'destination', 'rating', 'price_per_night', 'currency', 'is_active', 'created_at']
    list_filter = ['destination', 'is_active', 'rating', 'created_at']
    search_fields = ['name', 'description', 'destination__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
