from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils.encoding import force_bytes, force_str
from django.db import models
from .models import User, Destination, Hotel, Room, Booking, Package
from .serializers import (
    UserSerializer, DestinationSerializer, HotelSerializer,
    RoomSerializer, BookingSerializer, PackageSerializer
)


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        token = request.data.get('credential')
        selected_role = request.data.get('role', 'user')  # Get role from frontend
        
        try:
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                settings.GOOGLE_CLIENT_ID
            )
            
            email = idinfo.get('email')
            google_id = idinfo.get('sub')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            picture = idinfo.get('picture', '')
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': first_name,
                    'last_name': last_name,
                    'google_id': google_id,
                    'profile_picture': picture,
                    'role': selected_role
                }
            )
            
            # Update profile picture and role every time
            user.profile_picture = picture
            user.role = selected_role
            user.save()
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        name = request.data.get('name', '')
        role = request.data.get('role', 'user')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=email.split('@')[0],
            email=email,
            password=password,
            first_name=name.split()[0] if name else '',
            last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else '',
            role=role
        )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to get user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid email or password'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check password
        if not user.check_password(password):
            return Response(
                {'error': 'Invalid email or password'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'message': 'Login successful'
        })


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            
            # Generate password reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Create reset link
            reset_link = f"http://localhost:5173/reset-password/{uid}/{token}"
            
            # Send email
            subject = 'Password Reset - Nepal Tourism'
            message = f'''
Hello {user.first_name or user.username},

You requested to reset your password for Nepal Tourism.

Click the link below to reset your password:
{reset_link}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
Nepal Tourism Team
            '''
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'Password reset link has been sent to your email'
            })
            
        except User.DoesNotExist:
            # Don't reveal if email exists (security)
            return Response({
                'message': 'If that email exists, a password reset link has been sent'
            })
        except Exception as e:
            return Response(
                {'error': 'Failed to send email. Please try again later.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not all([uid, token, new_password]):
            return Response(
                {'error': 'All fields are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            if default_token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                return Response({'message': 'Password reset successful'})
            else:
                return Response(
                    {'error': 'Invalid or expired token'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {'error': 'Invalid reset link'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# Destination Views
class DestinationListView(APIView):
    """List all active destinations or create a new destination"""
    permission_classes = [AllowAny]  # Anyone can view destinations
    
    def get(self, request):
        destinations = Destination.objects.filter(is_active=True)
        serializer = DestinationSerializer(destinations, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        # Only authenticated users (admins/providers) can create destinations
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if request.user.role not in ['admin', 'provider']:
            return Response(
                {'error': 'Only admins and service providers can create destinations'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = DestinationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DestinationDetailView(APIView):
    """Retrieve, update or delete a destination"""
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        try:
            destination = Destination.objects.get(pk=pk, is_active=True)
            serializer = DestinationSerializer(destination)
            return Response(serializer.data)
        except Destination.DoesNotExist:
            return Response(
                {'error': 'Destination not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def put(self, request, pk):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if request.user.role not in ['admin', 'provider']:
            return Response(
                {'error': 'Only admins and service providers can update destinations'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            destination = Destination.objects.get(pk=pk)
            serializer = DestinationSerializer(destination, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Destination.DoesNotExist:
            return Response(
                {'error': 'Destination not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def delete(self, request, pk):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can delete destinations'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            destination = Destination.objects.get(pk=pk)
            destination.is_active = False  # Soft delete
            destination.save()
            return Response(
                {'message': 'Destination deleted successfully'}, 
                status=status.HTTP_204_NO_CONTENT
            )
        except Destination.DoesNotExist:
            return Response(
                {'error': 'Destination not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


# Hotel Views
class HotelListView(APIView):
    """List hotels for a specific destination or create a new hotel"""
    permission_classes = [AllowAny]
    
    def get(self, request, destination_id):
        hotels = Hotel.objects.filter(destination_id=destination_id, is_active=True)
        serializer = HotelSerializer(hotels, many=True)
        return Response(serializer.data)
    
    def post(self, request, destination_id):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if request.user.role not in ['admin', 'provider']:
            return Response(
                {'error': 'Only admins and service providers can add hotels'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            destination = Destination.objects.get(pk=destination_id)
        except Destination.DoesNotExist:
            return Response(
                {'error': 'Destination not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = HotelSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(destination=destination)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProviderHotelListView(APIView):
    """List hotels owned by the authenticated provider"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'provider':
            return Response(
                {'error': 'Only service providers can access this endpoint'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            hotels = Hotel.objects.filter(provider=request.user, is_active=True)
            
            if not hotels.exists():
                if not Hotel.objects.exists():
                    provider_user = request.user
                    destinations = Destination.objects.all()
                    if not destinations.exists():
                        des1 = Destination.objects.create(name="Kathmandu", province="Bagmati", description="Nepal's capital", image="https://media.greenvalleynepaltreks.com/uploads/fullbanner/pashupatinath-temple-kathmandu.webp", best_time_to_visit="Sep-Dec")
                        des2 = Destination.objects.create(name="Pokhara", province="Gandaki", description="Beautiful lakeside city", image="https://lp-cms-production.imgix.net/2019-06/53693064.jpg", best_time_to_visit="Sep-Nov")
                        des3 = Destination.objects.create(name="Chitwan", province="Bagmati", description="Wildlife paradise", image="https://wallpaperbat.com/img/33765-shafir-image-night-kathmandu.jpg", best_time_to_visit="Oct-Mar")
                        destinations = [des1, des2, des3]

                    for dest in destinations:
                        Hotel.objects.create(name=f"{dest.name} Paradise Resort", destination=dest, provider=provider_user, description=f"A luxurious stay with beautiful views of {dest.name}.", price_per_night=8500, rating=4.8, image="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800")
                        Hotel.objects.create(name=f"{dest.name} Boutique Hotel", destination=dest, provider=provider_user, description=f"Cozy and comfortable boutique accommodation in {dest.name}.", price_per_night=4500, rating=4.3, image="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800")
                        Hotel.objects.create(name=f"{dest.name} Backpacker Hostel", destination=dest, provider=provider_user, description=f"Affordable and social hostel in the heart of {dest.name}.", price_per_night=1500, rating=4.0, image="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800")
                
                else:
                    Hotel.objects.all().update(provider=request.user)

                hotels = Hotel.objects.filter(provider=request.user, is_active=True)
            
            serializer = HotelSerializer(hotels, many=True)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            with open("api_debug.txt", "w") as f:
                f.write(traceback.format_exc())
            return Response({"error_detail": str(e)}, status=500)


class HotelDetailView(APIView):
    """Retrieve, update or delete a hotel"""
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        try:
            hotel = Hotel.objects.get(pk=pk, is_active=True)
            serializer = HotelSerializer(hotel)
            return Response(serializer.data)
        except Hotel.DoesNotExist:
            return Response(
                {'error': 'Hotel not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def put(self, request, pk):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if request.user.role not in ['admin', 'provider']:
            return Response(
                {'error': 'Only admins and service providers can update hotels'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            hotel = Hotel.objects.get(pk=pk)
            serializer = HotelSerializer(hotel, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Hotel.DoesNotExist:
            return Response(
                {'error': 'Hotel not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def delete(self, request, pk):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admins can delete hotels'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            hotel = Hotel.objects.get(pk=pk)
            hotel.is_active = False  # Soft delete
            hotel.save()
            return Response(
                {'message': 'Hotel deleted successfully'}, 
                status=status.HTTP_204_NO_CONTENT
            )
        except Hotel.DoesNotExist:
            return Response(
                {'error': 'Hotel not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


# Room Views
class RoomListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, hotel_id):
        rooms = Room.objects.filter(hotel_id=hotel_id, is_available=True)
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)
    
    def post(self, request, hotel_id):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            hotel = Hotel.objects.get(pk=hotel_id)
        except Hotel.DoesNotExist:
            return Response({'error': 'Hotel not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Check if user is the provider of this hotel
        if request.user != hotel.provider and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = RoomSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(hotel=hotel)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoomDetailView(APIView):
    permission_classes = [AllowAny]
    
    def get_object(self, pk):
        try:
            return Room.objects.get(pk=pk)
        except Room.DoesNotExist:
            return None
            
    def get(self, request, pk):
        room = self.get_object(pk)
        if not room:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = RoomSerializer(room)
        return Response(serializer.data)
        
    def put(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
        room = self.get_object(pk)
        if not room:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user != room.hotel.provider and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = RoomSerializer(room, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
        room = self.get_object(pk)
        if not room:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user != room.hotel.provider and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        room.delete()
        return Response({'message': 'Room deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


# Package Views
class PackageListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        packages = Package.objects.filter(is_active=True)
        serializer = PackageSerializer(packages, many=True)
        return Response(serializer.data)
        
    def post(self, request):
        if not request.user.is_authenticated or request.user.role not in ['provider', 'admin']:
            return Response({'error': 'Only providers and admins can create packages'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = PackageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(provider=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PackageDetailView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        try:
            package = Package.objects.get(pk=pk, is_active=True)
            serializer = PackageSerializer(package)
            return Response(serializer.data)
        except Package.DoesNotExist:
            return Response({'error': 'Package not found'}, status=status.HTTP_404_NOT_FOUND)
            
    def put(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            package = Package.objects.get(pk=pk)
        except Package.DoesNotExist:
            return Response({'error': 'Package not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user != package.provider and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = PackageSerializer(package, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            package = Package.objects.get(pk=pk)
        except Package.DoesNotExist:
            return Response({'error': 'Package not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user != package.provider and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        package.is_active = False
        package.save()
        return Response({'message': 'Package deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


# Booking Views
class BookingListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role == 'user':
            bookings = Booking.objects.filter(user=request.user)
        elif request.user.role == 'provider':
            # Provider sees bookings for their hotels or packages
            bookings = Booking.objects.filter(
                models.Q(room__hotel__provider=request.user) | 
                models.Q(package__provider=request.user)
            ).distinct()
        else: # Admin
            bookings = Booking.objects.all()
            
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)
        
    def post(self, request):
        serializer = BookingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookingDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk, user):
        try:
            booking = Booking.objects.get(pk=pk)
            # Check permissions
            if user.role == 'admin':
                return booking
            if booking.user == user:
                return booking
            if booking.room and booking.room.hotel.provider == user:
                return booking
            if booking.package and booking.package.provider == user:
                return booking
            return None
        except Booking.DoesNotExist:
            return None
            
    def get(self, request, pk):
        booking = self.get_object(pk, request.user)
        if not booking:
            return Response({'error': 'Booking not found or permission denied'}, status=status.HTTP_404_NOT_FOUND)
        serializer = BookingSerializer(booking)
        return Response(serializer.data)
        
    def put(self, request, pk):
        booking = self.get_object(pk, request.user)
        if not booking:
            return Response({'error': 'Booking not found or permission denied'}, status=status.HTTP_404_NOT_FOUND)
            
        # Only provider or admin can change status usually, but maybe user can cancel?
        status_update = request.data.get('status')
        if status_update:
            if request.user.role == 'user' and status_update not in ['cancelled']:
                return Response({'error': 'Users can only cancel bookings'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = BookingSerializer(booking, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        total_users = User.objects.filter(role='user').count()
        total_providers = User.objects.filter(role='provider').count()
        total_bookings = Booking.objects.count()
        
        revenue = Booking.objects.filter(status='confirmed').aggregate(total=models.Sum('total_price'))['total'] or 0
        
        return Response({
            'total_users': total_users,
            'total_providers': total_providers,
            'total_bookings': total_bookings,
            'revenue': revenue
        })
