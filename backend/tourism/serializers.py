from rest_framework import serializers
from .models import User, Destination, Hotel, Room, Booking, Package

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'profile_picture']
        read_only_fields = ['id']


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'hotel', 'room_type', 'price', 'capacity', 'description', 'image', 'is_available']
        read_only_fields = ['id', 'hotel']


class HotelSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)
    provider_name = serializers.CharField(source='provider.username', read_only=True)
    
    class Meta:
        model = Hotel
        fields = [
            'id', 'provider', 'provider_name', 'destination', 'name', 'description', 'image', 'rating', 
            'price_per_night', 'currency', 'amenities', 
            'contact_number', 'email', 'address', 'total_rooms', 
            'is_active', 'created_at', 'updated_at', 'rooms'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'provider', 'destination']


class DestinationSerializer(serializers.ModelSerializer):
    hotels = HotelSerializer(many=True, read_only=True)
    hotels_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Destination
        fields = [
            'id', 'name', 'province', 'description', 'image', 
            'highlights', 'best_time_to_visit', 'latitude', 'longitude',
            'is_active', 'created_at', 'updated_at', 'hotels', 'hotels_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def get_hotels_count(self, obj):
        return obj.hotels.filter(is_active=True).count()


class PackageSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.username', read_only=True)
    destinations = DestinationSerializer(many=True, read_only=True)
    destination_ids = serializers.PrimaryKeyRelatedField(
        queryset=Destination.objects.all(), write_only=True, many=True, source='destinations'
    )
    
    class Meta:
        model = Package
        fields = [
            'id', 'provider', 'provider_name', 'name', 'description', 'price', 
            'duration_days', 'destinations', 'destination_ids', 'image', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'provider']


class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    package_details = PackageSerializer(source='package', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'room', 'room_details', 'package', 'package_details',
            'start_date', 'end_date', 'total_price', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']
