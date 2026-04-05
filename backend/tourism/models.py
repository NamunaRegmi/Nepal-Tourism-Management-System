from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    USER_ROLES = (
        ('user', 'User'),
        ('admin', 'Admin'),
        ('provider', 'Travel Service Provider'),
        ('guide', 'Tour Guide'),
    )
    
    role = models.CharField(max_length=20, choices=USER_ROLES, default='user')
    phone = models.CharField(max_length=15, blank=True)
    profile_picture = models.URLField(blank=True, null=True)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    
    # Fix the clash by adding related_name
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='tourism_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='tourism_user_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    
    def __str__(self):
        return self.username


class Destination(models.Model):
    """Model for travel destinations in Nepal"""
    PROVINCE_CHOICES = (
        ('Koshi', 'Koshi Province'),
        ('Madhesh', 'Madhesh Province'),
        ('Bagmati', 'Bagmati Province'),
        ('Gandaki', 'Gandaki Province'),
        ('Lumbini', 'Lumbini Province'),
        ('Karnali', 'Karnali Province'),
        ('Sudurpashchim', 'Sudurpashchim Province'),
    )
    
    name = models.CharField(max_length=200)
    province = models.CharField(max_length=50, choices=PROVINCE_CHOICES)
    description = models.TextField()
    image = models.URLField(help_text="URL of the main destination image")
    highlights = models.JSONField(default=list, help_text="List of key attractions")
    best_time_to_visit = models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_destinations')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Hotel(models.Model):
    """Model for hotels/resorts at destinations"""
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hotels', null=True)  # Allow null for existing rows
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name='hotels')
    name = models.CharField(max_length=200)
    description = models.TextField()
    image = models.URLField(help_text="URL of the hotel image")
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=0.0)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    amenities = models.JSONField(default=list, help_text="List of hotel amenities")
    contact_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    total_rooms = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-rating']
    
    def __str__(self):
        return f"{self.name} - {self.destination.name}"


class Room(models.Model):
    """Model for rooms within a hotel"""
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='rooms')
    room_type = models.CharField(max_length=100)  # e.g., Single, Double, Deluxe, Suite
    price = models.DecimalField(max_digits=10, decimal_places=2)
    capacity = models.IntegerField(default=2)
    description = models.TextField(blank=True)
    image = models.URLField(blank=True, null=True)
    is_available = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.room_type} - {self.hotel.name}"


class Package(models.Model):
    """Model for travel packages offered by providers"""
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='packages')
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.IntegerField()
    destinations = models.ManyToManyField(Destination, related_name='packages')
    image = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Booking(models.Model):
    """Model for bookings (Hotel Rooms or Packages)"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    )
    PAYMENT_STATUS_CHOICES = (
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    # Link to either room or package (or both ideally, but let's keep it simple for now)
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    package = models.ForeignKey(Package, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)  # For room bookings
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')
    payment_method = models.CharField(max_length=50, default='none')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Booking #{self.id} by {self.user.username}"


class TourGuideProfile(models.Model):
    """Public-facing profile for certified tour guides (linked to user with role=guide)."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tour_guide_profile')
    headline = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    languages = models.JSONField(default=list, help_text='e.g. ["English", "Nepali"]')
    years_experience = models.PositiveIntegerField(default=0)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, help_text='NPR per day')
    certifications = models.TextField(blank=True)
    image = models.URLField(blank=True, null=True)
    destinations = models.ManyToManyField(Destination, related_name='tour_guides', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Guide: {self.user.get_full_name() or self.user.username}"


class GuideBooking(models.Model):
    """Customer books a tour guide for a date range."""
    STATUS_CHOICES = Booking.STATUS_CHOICES
    PAYMENT_STATUS_CHOICES = Booking.PAYMENT_STATUS_CHOICES

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='guide_bookings')
    guide_profile = models.ForeignKey(
        TourGuideProfile, on_delete=models.CASCADE, related_name='bookings'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid'
    )
    payment_method = models.CharField(max_length=50, default='none')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Guide booking #{self.id} — {self.user.username}"
