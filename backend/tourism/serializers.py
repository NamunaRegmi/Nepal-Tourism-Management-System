from rest_framework import serializers
from .models import User, Destination, Hotel, Room, Booking, Package, TourGuideProfile, GuideBooking

class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.CharField(required=False, allow_blank=True)

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
    provider_name = serializers.CharField(source='provider.username', read_only=True, allow_null=True)
    destination_id = serializers.IntegerField(read_only=True)

    def validate_amenities(self, value):
        if value in (None, '', []):
            return []
        if isinstance(value, str):
            return [x.strip() for x in value.split(',') if x.strip()]
        return value

    class Meta:
        model = Hotel
        fields = [
            'id', 'provider', 'provider_name', 'destination', 'destination_id', 'name', 'description', 'image', 'rating',
            'price_per_night', 'currency', 'amenities',
            'contact_number', 'email', 'address', 'total_rooms',
            'is_active', 'created_at', 'updated_at', 'rooms'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'provider', 'destination']


class DestinationSerializer(serializers.ModelSerializer):
    hotels_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Destination
        fields = [
            'id', 'name', 'province', 'description', 'image', 
            'highlights', 'best_time_to_visit', 'latitude', 'longitude',
            'is_active', 'created_at', 'updated_at', 'hotels_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def get_hotels_count(self, obj):
        annotated_count = getattr(obj, 'hotels_count', None)
        if annotated_count is not None:
            return annotated_count
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
            'start_date', 'end_date', 'total_price', 'status', 'payment_status', 'payment_method', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']


class DestinationMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = ['id', 'name', 'province']


class TourGuideProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    destinations = DestinationMiniSerializer(many=True, read_only=True)
    destination_ids = serializers.PrimaryKeyRelatedField(
        queryset=Destination.objects.filter(is_active=True),
        many=True,
        write_only=True,
        required=False,
        source='destinations',
    )
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = TourGuideProfile
        fields = [
            'id', 'user', 'display_name', 'headline', 'bio', 'languages',
            'years_experience', 'daily_rate', 'certifications', 'image',
            'destinations', 'destination_ids', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_display_name(self, obj):
        u = obj.user
        name = (u.get_full_name() or '').strip()
        return name or u.username

    def validate_languages(self, value):
        if value in (None, '', []):
            return []
        if isinstance(value, str):
            return [x.strip() for x in value.split(',') if x.strip()]
        return value

    def create(self, validated_data):
        dests = validated_data.pop('destinations', [])
        user = self.context['request'].user
        if user.role != 'guide':
            raise serializers.ValidationError({'non_field_errors': ['Only tour guides can create a profile.']})
        if TourGuideProfile.objects.filter(user=user).exists():
            raise serializers.ValidationError({'non_field_errors': ['You already have a guide profile.']})
        profile = TourGuideProfile.objects.create(user=user, **validated_data)
        if dests:
            profile.destinations.set(dests)
        return profile

    def update(self, instance, validated_data):
        dests = validated_data.pop('destinations', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if dests is not None:
            instance.destinations.set(dests)
        return instance


class GuideBookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    guide_profile = serializers.PrimaryKeyRelatedField(
        queryset=TourGuideProfile.objects.filter(is_active=True)
    )
    guide_display_name = serializers.SerializerMethodField()

    class Meta:
        model = GuideBooking
        fields = [
            'id', 'user', 'guide_profile', 'guide_display_name',
            'start_date', 'end_date', 'total_price', 'status', 'payment_status',
            'payment_method', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'total_price', 'created_at']

    def get_guide_display_name(self, obj):
        u = obj.guide_profile.user
        return (u.get_full_name() or '').strip() or u.username

    def validate_guide_profile(self, value):
        if self.instance is not None and value != self.instance.guide_profile:
            raise serializers.ValidationError('Cannot change guide after the booking is created.')
        return value

    def validate(self, attrs):
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if self.instance:
            start = start or self.instance.start_date
            end = end or self.instance.end_date
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': 'Must be on or after start date.'})
        return attrs

    def create(self, validated_data):
        from decimal import Decimal
        request = self.context['request']
        user = request.user
        if user.role != 'user':
            raise serializers.ValidationError({'non_field_errors': ['Only travelers (users) can book a guide.']})
        guide = validated_data['guide_profile']
        if guide.user_id == user.id:
            raise serializers.ValidationError({'guide_profile': ['You cannot book yourself.']})
        start = validated_data['start_date']
        end = validated_data['end_date']
        days = (end - start).days + 1
        if days < 1:
            days = 1
        total = guide.daily_rate * Decimal(days)
        validated_data['user'] = user
        validated_data['total_price'] = total
        return GuideBooking.objects.create(**validated_data)
