from django.contrib import admin
from django.utils.html import format_html
from .models import (
    User, Destination, Hotel, Room,
    Package, Booking, TourGuideProfile, GuideBooking, Review,
)


def _image_preview(obj):
    if not obj or not obj.image_url:
        return 'No image'
    return format_html(
        '<img src="{}" style="width: 96px; height: 64px; object-fit: cover; border-radius: 6px;" />',
        obj.image_url,
    )


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'first_name', 'last_name', 'is_active']
    list_filter = ['role', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']


@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ['name', 'province', 'image_preview', 'is_active', 'created_at', 'created_by']
    list_filter = ['province', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    fieldsets = (
        ('Destination', {
            'fields': ('name', 'province', 'description', 'highlights', 'best_time_to_visit'),
        }),
        ('Image', {
            'fields': ('image', 'image_file', 'image_preview'),
            'description': 'Use either a Cloudinary/external image URL or upload an image file. Uploaded files are stored in Cloudinary.',
        }),
        ('Map', {
            'fields': ('latitude', 'longitude'),
        }),
        ('Status', {
            'fields': ('is_active', 'created_by', 'created_at', 'updated_at'),
        }),
    )

    def image_preview(self, obj):
        return _image_preview(obj)

    image_preview.short_description = 'Preview'


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ['name', 'destination', 'provider', 'rating', 'price_per_night', 'currency', 'is_active', 'image_preview', 'created_at']
    list_filter = ['destination', 'is_active', 'rating', 'created_at']
    search_fields = ['name', 'description', 'destination__name', 'provider__username']
    ordering = ['-created_at']
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    fieldsets = (
        ('Hotel', {
            'fields': ('name', 'destination', 'provider', 'description', 'rating', 'price_per_night', 'currency'),
        }),
        ('Details', {
            'fields': ('amenities', 'contact_number', 'email', 'address', 'total_rooms'),
        }),
        ('Image', {
            'fields': ('image', 'image_file', 'image_preview'),
            'description': 'Use either a Cloudinary/external image URL or upload an image file. Uploaded files are stored in Cloudinary.',
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at'),
        }),
    )

    def image_preview(self, obj):
        return _image_preview(obj)

    image_preview.short_description = 'Preview'


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['room_type', 'hotel', 'price', 'capacity', 'is_available', 'image_preview']
    list_filter = ['is_available', 'hotel__destination']
    search_fields = ['room_type', 'hotel__name', 'description']
    ordering = ['hotel', 'room_type']
    readonly_fields = ['image_preview']
    fieldsets = (
        ('Room', {
            'fields': ('hotel', 'room_type', 'price', 'capacity', 'description', 'is_available'),
        }),
        ('Image', {
            'fields': ('image', 'image_file', 'image_preview'),
            'description': 'Use either a Cloudinary/external image URL or upload an image file.',
        }),
    )

    def image_preview(self, obj):
        return _image_preview(obj)

    image_preview.short_description = 'Preview'


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ['name', 'provider', 'price', 'duration_days', 'max_people', 'is_active', 'image_preview', 'created_at']
    list_filter = ['is_active', 'created_at', 'provider']
    search_fields = ['name', 'description', 'provider__username']
    ordering = ['-created_at']
    filter_horizontal = ['destinations']
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    fieldsets = (
        ('Package', {
            'fields': ('name', 'provider', 'description', 'price', 'duration_days', 'max_people', 'destination'),
        }),
        ('Content', {
            'fields': ('itinerary', 'included_services', 'destinations'),
        }),
        ('Image', {
            'fields': ('image', 'image_file', 'image_preview'),
            'description': 'Use either a Cloudinary/external image URL or upload an image file.',
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at'),
        }),
    )

    def image_preview(self, obj):
        return _image_preview(obj)

    image_preview.short_description = 'Preview'


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'booking_for', 'start_date', 'end_date', 'total_price', 'status', 'payment_status', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_status', 'payment_method', 'created_at']
    search_fields = ['user__username', 'user__email', 'room__hotel__name', 'package__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Booking', {
            'fields': ('user', 'room', 'package', 'start_date', 'end_date', 'total_price'),
        }),
        ('Status', {
            'fields': ('status', 'payment_status', 'payment_method', 'created_at'),
        }),
    )

    def booking_for(self, obj):
        if obj.room:
            return f'Room: {obj.room.hotel.name}'
        if obj.package:
            return f'Package: {obj.package.name}'
        return '—'

    booking_for.short_description = 'Booking For'


@admin.register(TourGuideProfile)
class TourGuideProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'headline', 'years_experience', 'daily_rate', 'is_active', 'image_preview', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'user__email', 'headline', 'bio']
    ordering = ['-created_at']
    filter_horizontal = ['destinations']
    readonly_fields = ['image_preview', 'created_at', 'updated_at']
    fieldsets = (
        ('Guide', {
            'fields': ('user', 'headline', 'bio', 'years_experience', 'daily_rate', 'languages', 'certifications'),
        }),
        ('Destinations', {
            'fields': ('destinations',),
        }),
        ('Image', {
            'fields': ('image', 'image_file', 'image_preview'),
            'description': 'Use either a Cloudinary/external image URL or upload an image file.',
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at'),
        }),
    )

    def image_preview(self, obj):
        return _image_preview(obj)

    image_preview.short_description = 'Preview'


@admin.register(GuideBooking)
class GuideBookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'guide_profile', 'start_date', 'end_date', 'total_price', 'status', 'payment_status', 'created_at']
    list_filter = ['status', 'payment_status', 'payment_method', 'created_at']
    search_fields = ['user__username', 'user__email', 'guide_profile__user__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Guide Booking', {
            'fields': ('user', 'guide_profile', 'start_date', 'end_date', 'total_price', 'notes'),
        }),
        ('Status', {
            'fields': ('status', 'payment_status', 'payment_method', 'created_at'),
        }),
    )


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'rating', 'review_target', 'title', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['user__username', 'comment', 'title', 'hotel__name', 'destination__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at']

    def review_target(self, obj):
        if obj.hotel:
            return f'Hotel: {obj.hotel.name}'
        if obj.destination:
            return f'Destination: {obj.destination.name}'
        return '—'

    review_target.short_description = 'Reviewed'
