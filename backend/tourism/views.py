from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
import base64
from datetime import datetime, time, timedelta
import json
from zoneinfo import ZoneInfo
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.db import IntegrityError, models
from urllib.parse import urlparse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .models import User, Destination, Hotel, Room, Booking, Package, TourGuideProfile, GuideBooking
from .serializers import (
    UserSerializer, DestinationSerializer, HotelSerializer,
    RoomSerializer, BookingSerializer, PackageSerializer,
    TourGuideProfileSerializer, GuideBookingSerializer,
)
from .khalti_integration import KhaltiPaymentGateway
from .esewa_integration import EsewaPaymentGateway


PUBLIC_AUTH_ROLES = {'user', 'provider', 'guide'}
CANCELLATION_CUTOFF_HOURS = 18
BOOKING_TIME_ZONE = ZoneInfo('Asia/Kathmandu')


def build_unique_username(email):
    normalized_email = (email or '').strip().lower()
    if (
        normalized_email
        and len(normalized_email) <= 150
        and not User.objects.filter(username=normalized_email).exists()
    ):
        return normalized_email

    local_part = (normalized_email.split('@')[0] if normalized_email else 'user') or 'user'
    base_username = local_part[:150]
    candidate = base_username
    counter = 1

    while User.objects.filter(username=candidate).exists():
        suffix = f'-{counter}'
        candidate = f"{base_username[:150 - len(suffix)]}{suffix}"
        counter += 1

    return candidate


def normalize_public_auth_role(raw_role):
    role = (raw_role or 'user').strip().lower()
    valid_roles = {value for value, _ in User.USER_ROLES}

    if role not in valid_roles:
        return None, 'Invalid role selected', status.HTTP_400_BAD_REQUEST

    if role not in PUBLIC_AUTH_ROLES:
        return None, 'Admin accounts cannot be created through public authentication', status.HTTP_403_FORBIDDEN

    return role, None, None


def get_booking_start_datetime(booking):
    start_datetime = datetime.combine(booking.start_date, time.min)
    return timezone.make_aware(start_datetime, BOOKING_TIME_ZONE)


def get_cancellation_block_reason(booking):
    now = timezone.now().astimezone(BOOKING_TIME_ZONE)
    start_at = get_booking_start_datetime(booking)

    if now >= start_at:
        return "This booking has already started or passed and can't be cancelled."

    if start_at - now <= timedelta(hours=CANCELLATION_CUTOFF_HOURS):
        return f"Bookings can only be cancelled more than {CANCELLATION_CUTOFF_HOURS} hours before the start date."

    return None


def parse_esewa_callback_payload(query_params):
    encoded_payload = query_params.get('data')

    if encoded_payload:
        try:
            normalized_payload = (
                encoded_payload.replace(' ', '+')
                .replace('-', '+')
                .replace('_', '/')
            )
            padding = '=' * (-len(normalized_payload) % 4)
            decoded_payload = base64.b64decode(f"{normalized_payload}{padding}").decode('utf-8')
            payload = json.loads(decoded_payload)

            return {
                'transaction_uuid': payload.get('transaction_uuid'),
                'transaction_code': payload.get('transaction_code'),
                'total_amount': str(payload.get('total_amount')) if payload.get('total_amount') is not None else None,
                'product_code': payload.get('product_code'),
                'status': payload.get('status'),
                'signed_field_names': payload.get('signed_field_names'),
                'signature': payload.get('signature'),
            }
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            print(f"Failed to decode eSewa callback payload: {exc}")

    return {
        'transaction_uuid': query_params.get('transaction_uuid'),
        'transaction_code': query_params.get('transaction_code'),
        'total_amount': query_params.get('total_amount'),
        'product_code': query_params.get('product_code'),
        'status': query_params.get('status'),
        'signed_field_names': query_params.get('signed_field_names'),
        'signature': query_params.get('signature'),
    }


def get_allowed_frontend_origins():
    origins = set(getattr(settings, 'CORS_ALLOWED_ORIGINS', []))
    frontend_base_url = getattr(settings, 'FRONTEND_BASE_URL', '').rstrip('/')
    if frontend_base_url:
        origins.add(frontend_base_url)
    return origins


def resolve_frontend_redirect_origin(raw_origin):
    allowed_origins = get_allowed_frontend_origins()
    normalized_origin = (raw_origin or '').rstrip('/')

    if normalized_origin and normalized_origin in allowed_origins:
        return normalized_origin

    frontend_base_url = getattr(settings, 'FRONTEND_BASE_URL', '').rstrip('/')
    if frontend_base_url:
        return frontend_base_url

    return normalized_origin or 'http://localhost:5173'


def resolve_frontend_redirect_path(raw_path, fallback_path):
    path = raw_path or fallback_path
    parsed = urlparse(path)
    candidate = parsed.path or fallback_path

    if not candidate.startswith('/'):
        candidate = f'/{candidate}'

    return candidate


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        token = request.data.get('credential')
        
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

            user = User.objects.filter(email=email).first()

            if user is None:
                selected_role, role_error, role_status = normalize_public_auth_role(request.data.get('role'))
                if role_error:
                    return Response({'error': role_error}, status=role_status)

                user = User.objects.create_user(
                    username=build_unique_username(email),
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    google_id=google_id,
                    profile_picture=picture,
                    role=selected_role,
                )

            if not user.google_id:
                user.google_id = google_id

            user.profile_picture = picture
            user.first_name = first_name or user.first_name
            user.last_name = last_name or user.last_name
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
        email = (request.data.get('email') or '').strip().lower()
        password = request.data.get('password')
        name = request.data.get('name', '')
        role, role_error, role_status = normalize_public_auth_role(request.data.get('role'))
        
        if not email or not password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if role_error:
            return Response({'error': role_error}, status=role_status)
        
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.create_user(
                username=build_unique_username(email),
                email=email,
                password=password,
                first_name=name.split()[0] if name else '',
                last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else '',
                role=role
            )
        except IntegrityError:
            return Response(
                {'error': 'Unable to create account with this email'}, 
                status=status.HTTP_400_BAD_REQUEST
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

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        return self.put(request)


# Destination Views
class DestinationListView(APIView):
    """List all active destinations or create a new destination"""
    permission_classes = [AllowAny]  # Anyone can view destinations
    
    def get(self, request):
        destinations = Destination.objects.filter(is_active=True).annotate(
            hotels_count=models.Count(
                'hotels',
                filter=models.Q(hotels__is_active=True),
                distinct=True,
            )
        )
        serializer = DestinationSerializer(destinations, many=True, context={'request': request})
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
        
        serializer = DestinationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DestinationDetailView(APIView):
    """Retrieve, update or delete a destination"""
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        try:
            destination = Destination.objects.filter(pk=pk, is_active=True).annotate(
                hotels_count=models.Count(
                    'hotels',
                    filter=models.Q(hotels__is_active=True),
                    distinct=True,
                )
            ).get()
            serializer = DestinationSerializer(destination, context={'request': request})
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
            serializer = DestinationSerializer(destination, data=request.data, partial=True, context={'request': request})
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
        serializer = HotelSerializer(hotels, many=True, context={'request': request})
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

        serializer = HotelSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(destination=destination, provider=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProviderHotelListView(APIView):
    """List or create hotels owned by the authenticated provider."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'provider':
            return Response(
                {'error': 'Only service providers can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Only return properties belonging to the authenticated provider
        hotels = (
            Hotel.objects.filter(provider=request.user)
            .select_related('destination', 'provider')
            .prefetch_related('rooms')
            .order_by('-created_at')
        )
        serializer = HotelSerializer(hotels, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'provider':
            return Response(
                {'error': 'Only service providers can create hotels here'},
                status=status.HTTP_403_FORBIDDEN
            )

        payload = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        dest_raw = payload.pop('destination_id', None) or payload.pop('destination', None)
        if dest_raw is None:
            return Response(
                {'error': 'destination_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            destination = Destination.objects.get(pk=int(dest_raw))
        except (ValueError, TypeError):
            return Response({'error': 'Invalid destination_id'}, status=status.HTTP_400_BAD_REQUEST)
        except Destination.DoesNotExist:
            return Response({'error': 'Destination not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = HotelSerializer(data=payload, context={'request': request})
        if serializer.is_valid():
            serializer.save(destination=destination, provider=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HotelDetailView(APIView):
    """Retrieve, update or delete a hotel"""
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        try:
            hotel = Hotel.objects.get(pk=pk, is_active=True)
            serializer = HotelSerializer(hotel, context={'request': request})
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
            if request.user.role == 'provider' and hotel.provider_id != request.user.id:
                return Response(
                    {'error': 'You can only update your own hotels'},
                    status=status.HTTP_403_FORBIDDEN
                )

            payload = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            dest_raw = payload.pop('destination_id', None) or payload.pop('destination', None)
            destination = None
            if dest_raw not in (None, ''):
                try:
                    destination = Destination.objects.get(pk=int(dest_raw))
                except (ValueError, TypeError):
                    return Response({'error': 'Invalid destination_id'}, status=status.HTTP_400_BAD_REQUEST)
                except Destination.DoesNotExist:
                    return Response({'error': 'Destination not found'}, status=status.HTTP_404_NOT_FOUND)

            serializer = HotelSerializer(hotel, data=payload, partial=True, context={'request': request})
            if serializer.is_valid():
                if destination is not None:
                    serializer.save(destination=destination)
                else:
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

        try:
            hotel = Hotel.objects.get(pk=pk)
        except Hotel.DoesNotExist:
            return Response(
                {'error': 'Hotel not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user.role == 'admin':
            pass
        elif request.user.role == 'provider' and hotel.provider_id == request.user.id:
            pass
        else:
            return Response(
                {'error': 'Only admins or the owning provider can delete this hotel'},
                status=status.HTTP_403_FORBIDDEN
            )

        hotel.is_active = False
        hotel.save()
        return Response(
            {'message': 'Hotel deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )


# Room Views
class RoomListView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, hotel_id):
        rooms = Room.objects.filter(hotel_id=hotel_id, is_available=True)
        serializer = RoomSerializer(rooms, many=True, context={'request': request})
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
            
        serializer = RoomSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(hotel=hotel)
            hotel.total_rooms = hotel.rooms.count()
            hotel.save(update_fields=['total_rooms'])
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
        serializer = RoomSerializer(room, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        room = self.get_object(pk)
        if not room:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user != room.hotel.provider and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        serializer = RoomSerializer(room, data=request.data, partial=True, context={'request': request})
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
        
        hotel = room.hotel
        room.delete()
        hotel.total_rooms = hotel.rooms.count()
        hotel.save(update_fields=['total_rooms'])
        return Response({'message': 'Room deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


# Package Views
class PackageListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Package.objects.filter(is_active=True).select_related('provider').prefetch_related('destinations')
        destination_id = request.query_params.get('destination_id')
        if destination_id:
            qs = qs.filter(
                models.Q(destinations__id=destination_id) |
                models.Q(destination__icontains=Destination.objects.filter(id=destination_id).values_list('name', flat=True).first() or '')
            ).distinct()
        serializer = PackageSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class ProviderPackageListView(APIView):
    """List or create packages owned by the authenticated provider."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'provider':
            return Response(
                {'error': 'Only service providers can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )

        packages = (
            Package.objects.filter(provider=request.user, is_active=True)
            .prefetch_related('destinations')
            .order_by('-created_at')
        )
        serializer = PackageSerializer(packages, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated or request.user.role not in ['provider', 'admin']:
            return Response({'error': 'Only providers and admins can create packages'}, status=status.HTTP_403_FORBIDDEN)

        serializer = PackageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(provider=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PackageDetailView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        try:
            package = Package.objects.get(pk=pk, is_active=True)
            serializer = PackageSerializer(package, context={'request': request})
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

        # Check permissions
        if request.user.role == 'provider' and package.provider_id != request.user.id:
            return Response({'error': 'You can only update your own packages'}, status=status.HTTP_403_FORBIDDEN)
        elif request.user.role not in ['provider', 'admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        serializer = PackageSerializer(package, data=request.data, partial=True, context={'request': request})
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
            
        # Check permissions
        if request.user.role == 'admin':
            pass
        elif request.user.role == 'provider' and package.provider_id == request.user.id:
            pass
        else:
            return Response({'error': 'Only admins or the owning provider can delete this package'}, status=status.HTTP_403_FORBIDDEN)
            
        package.is_active = False
        package.save()
        return Response({'message': 'Package deleted successfully', 'success': True}, status=status.HTTP_200_OK)


# Booking Views
class BookingListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        base = Booking.objects.select_related(
            'user', 'room', 'room__hotel', 'room__hotel__provider', 'package', 'package__provider'
        )
        if request.user.role == 'user':
            bookings = base.filter(user=request.user)
        elif request.user.role == 'provider':
            # Provider sees bookings for their hotels or packages
            bookings = base.filter(
                models.Q(room__hotel__provider=request.user) |
                models.Q(package__provider=request.user)
            ).distinct()
        else:  # Admin
            bookings = base.all()

        serializer = BookingSerializer(bookings, many=True, context={'request': request})
        return Response(serializer.data)
        
    def post(self, request):
        serializer = BookingSerializer(data=request.data, context={'request': request})
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
        serializer = BookingSerializer(booking, context={'request': request})
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
            if status_update == 'cancelled':
                cancellation_error = get_cancellation_block_reason(booking)
                if cancellation_error:
                    return Response({'error': cancellation_error}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = BookingSerializer(booking, data=request.data, partial=True, context={'request': request})
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
        total_guides = User.objects.filter(role='guide').count()
        total_bookings = Booking.objects.count()
        total_guide_bookings = GuideBooking.objects.count()
        total_packages = Package.objects.filter(is_active=True).count()
        total_hotels = Hotel.objects.filter(is_active=True).count()

        revenue = Booking.objects.filter(status='confirmed').aggregate(total=models.Sum('total_price'))['total'] or 0
        guide_revenue = GuideBooking.objects.filter(status='confirmed').aggregate(
            total=models.Sum('total_price')
        )['total'] or 0

        return Response({
            'total_users': total_users,
            'total_providers': total_providers,
            'total_guides': total_guides,
            'total_bookings': total_bookings,
            'total_guide_bookings': total_guide_bookings,
            'total_packages': total_packages,
            'total_hotels': total_hotels,
            'revenue': revenue,
            'guide_revenue': guide_revenue,
        })


class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.filter(role='user').order_by('-date_joined')
        return Response(UserSerializer(users, many=True).data)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk)
            return Response(UserSerializer(user).data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = User.objects.get(pk=pk)
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        if pk == request.user.id:
            return Response({'error': 'Cannot delete your own account this way'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target = User.objects.get(pk=pk)
            target.delete()
            return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class AdminProviderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        providers = User.objects.filter(role='provider').order_by('-date_joined')
        return Response(UserSerializer(providers, many=True).data)


class AdminProviderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        try:
            provider = User.objects.get(pk=pk, role='provider')
            return Response(UserSerializer(provider).data)
        except User.DoesNotExist:
            return Response({'error': 'Provider not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        try:
            provider = User.objects.get(pk=pk, role='provider')
            serializer = UserSerializer(provider, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'Provider not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        if pk == request.user.id:
            return Response({'error': 'Cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            provider = User.objects.get(pk=pk, role='provider')
            provider.delete()
            return Response({'message': 'Provider deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'error': 'Provider not found'}, status=status.HTTP_404_NOT_FOUND)


class AdminHotelListView(APIView):
    """Admin view to list and manage all hotels from all providers"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Admin can see all hotels regardless of provider
        hotels = (
            Hotel.objects.all()
            .select_related('destination', 'provider')
            .prefetch_related('rooms')
            .order_by('-created_at')
        )
        serializer = HotelSerializer(hotels, many=True, context={'request': request})
        return Response(serializer.data)


class AdminPackageListView(APIView):
    """Admin view to list all packages from all providers"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Admin can see all packages regardless of provider
        packages = (
            Package.objects.all()
            .select_related('provider')
            .prefetch_related('destinations')
            .order_by('-created_at')
        )
        serializer = PackageSerializer(packages, many=True, context={'request': request})
        return Response(serializer.data)


class TourGuideListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = TourGuideProfile.objects.filter(is_active=True).select_related('user').prefetch_related('destinations')
        dest_id = request.query_params.get('destination')
        if dest_id:
            qs = qs.filter(destinations__id=dest_id).distinct()
        serializer = TourGuideProfileSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class TourGuideDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            profile = TourGuideProfile.objects.select_related('user').prefetch_related('destinations').get(
                pk=pk, is_active=True
            )
        except TourGuideProfile.DoesNotExist:
            return Response({'error': 'Guide not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TourGuideProfileSerializer(profile).data)


class TourGuideMeProfileView(APIView):
    """Current guide: get / create / update own public profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'guide':
            return Response({'error': 'Only tour guides can access this'}, status=status.HTTP_403_FORBIDDEN)
        try:
            profile = request.user.tour_guide_profile
        except TourGuideProfile.DoesNotExist:
            return Response({'detail': 'No profile yet'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TourGuideProfileSerializer(profile).data)

    def post(self, request):
        if request.user.role != 'guide':
            return Response({'error': 'Only tour guides can create a profile'}, status=status.HTTP_403_FORBIDDEN)
        if TourGuideProfile.objects.filter(user=request.user).exists():
            return Response({'error': 'Profile already exists. Use PUT to update.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = TourGuideProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        if request.user.role != 'guide':
            return Response({'error': 'Only tour guides can update a profile'}, status=status.HTTP_403_FORBIDDEN)
        try:
            profile = request.user.tour_guide_profile
        except TourGuideProfile.DoesNotExist:
            return Response({'error': 'Create your profile with POST first.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TourGuideProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GuideBookingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'user':
            qs = GuideBooking.objects.filter(user=user)
        elif user.role == 'guide':
            qs = GuideBooking.objects.filter(guide_profile__user=user)
        elif user.role == 'admin':
            qs = GuideBooking.objects.all()
        else:
            qs = GuideBooking.objects.none()
        qs = qs.select_related('user', 'guide_profile', 'guide_profile__user')
        return Response(GuideBookingSerializer(qs, many=True).data)

    def post(self, request):
        if request.user.role != 'user':
            return Response({'error': 'Only travelers can request a guide booking'}, status=status.HTTP_403_FORBIDDEN)
        serializer = GuideBookingSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GuideBookingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            booking = GuideBooking.objects.select_related('guide_profile', 'guide_profile__user', 'user').get(pk=pk)
        except GuideBooking.DoesNotExist:
            return None
        if user.role == 'admin':
            return booking
        if booking.user_id == user.id:
            return booking
        if user.role == 'guide' and booking.guide_profile.user_id == user.id:
            return booking
        return None

    def get(self, request, pk):
        booking = self.get_object(pk, request.user)
        if not booking:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(GuideBookingSerializer(booking).data)

    def put(self, request, pk):
        booking = self.get_object(pk, request.user)
        if not booking:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        status_update = request.data.get('status')
        if status_update:
            if request.user.role == 'user' and status_update not in ['cancelled']:
                return Response({'error': 'Users can only cancel'}, status=status.HTTP_403_FORBIDDEN)
            if request.user.role == 'guide' and status_update not in ['confirmed', 'cancelled', 'completed']:
                return Response({'error': 'Invalid status for guide'}, status=status.HTTP_403_FORBIDDEN)
            if status_update == 'cancelled':
                cancellation_error = get_cancellation_block_reason(booking)
                if cancellation_error:
                    return Response({'error': cancellation_error}, status=status.HTTP_400_BAD_REQUEST)
        serializer = GuideBookingSerializer(booking, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DestinationRecommendationView(APIView):
    """
    Gemini-powered destination recommendations.
    Gemini ranks candidates by semantic similarity and writes a reason for each.
    Falls back to scoring algorithm if Gemini is unavailable.
    """
    permission_classes = [AllowAny]

    def _fallback_rank(self, source, candidates, user_interests, user_season):
        """Simple scoring fallback used when Gemini call fails."""
        SEASON_MONTHS = {
            'spring': {'march', 'april', 'may', 'mar', 'apr'},
            'summer': {'june', 'july', 'august', 'jun', 'jul', 'aug'},
            'autumn': {'september', 'october', 'november', 'sep', 'oct', 'nov'},
            'winter': {'december', 'january', 'february', 'dec', 'jan', 'feb'},
        }
        season_words = SEASON_MONTHS.get(user_season, set())
        source_highlights = set(h.lower() for h in (source.highlights or []))
        source_time = (source.best_time_to_visit or '').lower()

        scored = []
        for dest in candidates:
            score = 0
            if dest.province == source.province:
                score += 3
            dest_highlights = set(h.lower() for h in (dest.highlights or []))
            score += len(source_highlights & dest_highlights)
            dest_time = (dest.best_time_to_visit or '').lower()
            if source_time and dest_time:
                src_words = set(source_time.replace(',', ' ').split())
                dst_words = set(dest_time.replace(',', ' ').split())
                shared = src_words & dst_words - {'to', 'and', 'or', 'the', '-'}
                score += min(len(shared), 2) * 2
            if user_interests:
                score += sum(2 for i in user_interests if any(i in h for h in dest_highlights))
            if season_words and dest_time:
                if set(dest_time.replace(',', ' ').split()) & season_words:
                    score += 3
            scored.append((score, dest))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [{'destination': d, 'reason': None} for _, d in scored[:4]]

    def get(self, request, pk):
        try:
            source = Destination.objects.get(pk=pk, is_active=True)
        except Destination.DoesNotExist:
            return Response({'error': 'Destination not found'}, status=status.HTTP_404_NOT_FOUND)

        candidates = list(Destination.objects.filter(is_active=True).exclude(pk=pk))

        raw_interests = request.query_params.get('interests', '')
        user_interests = [i.strip().lower() for i in raw_interests.split(',') if i.strip()]
        user_season = (request.query_params.get('season') or '').strip().lower()

        ranked = self._groq_rank(source, candidates, user_interests, user_season)

        results = []
        for item in ranked:
            dest = item['destination']
            data = DestinationSerializer(dest, context={'request': request}).data
            data['ai_reason'] = item['reason']
            results.append(data)

        return Response(results)

    def _groq_rank(self, source, candidates, user_interests, user_season):
        import os
        api_key = os.getenv('GROQ_API_KEY', '')
        if not api_key or not candidates:
            return self._fallback_rank(source, candidates, user_interests, user_season)

        try:
            from groq import Groq

            candidate_list = [
                {
                    'id': d.id,
                    'name': d.name,
                    'province': d.province,
                    'description': (d.description or '')[:300],
                    'highlights': d.highlights or [],
                    'best_time_to_visit': d.best_time_to_visit or '',
                }
                for d in candidates
            ]

            prefs_text = ''
            if user_interests:
                prefs_text += f"- Interests: {', '.join(user_interests)}\n"
            if user_season:
                prefs_text += f"- Preferred travel season: {user_season}\n"
            if not prefs_text:
                prefs_text = '- No specific preferences given\n'

            prompt = f"""You are a Nepal tourism recommendation assistant.

The traveller is currently viewing:
Name: {source.name}
Province: {source.province}
Description: {(source.description or '')[:400]}
Highlights: {', '.join(source.highlights or [])}
Best time to visit: {source.best_time_to_visit or 'unknown'}

Traveller preferences:
{prefs_text}
From the candidate destinations below, choose the 4 most relevant and similar ones for this traveller.
Rank them from most to least relevant.
For each, write ONE short sentence (max 18 words) explaining why it suits this traveller.
Be specific — mention highlights, season, or activity type. Do not start every reason with "A".

Candidates:
{json.dumps(candidate_list, indent=2)}

Reply with ONLY a valid JSON array, no markdown fences, no extra text:
[{{"id": <int>, "reason": "<sentence>"}}, ...]"""

            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                model='llama-3.1-8b-instant',
                messages=[{'role': 'user', 'content': prompt}],
                temperature=0.3,
            )

            raw = (response.choices[0].message.content or '').strip()
            if raw.startswith('```'):
                raw = raw.split('```')[1]
                if raw.startswith('json'):
                    raw = raw[4:]
            raw = raw.strip()

            groq_results = json.loads(raw)

            dest_map = {d.id: d for d in candidates}
            ranked = []
            seen = set()
            for item in groq_results:
                did = item.get('id')
                if did and did in dest_map and did not in seen:
                    ranked.append({'destination': dest_map[did], 'reason': item.get('reason', '')})
                    seen.add(did)
                if len(ranked) == 4:
                    break

            if len(ranked) < 4:
                fallback = self._fallback_rank(source, candidates, user_interests, user_season)
                for fb in fallback:
                    if fb['destination'].id not in seen:
                        ranked.append(fb)
                    if len(ranked) == 4:
                        break

            return ranked

        except Exception as e:
            print(f'Groq recommendation error: {e}')
            return self._fallback_rank(source, candidates, user_interests, user_season)


class DestinationExploreRecommendationView(APIView):
    """
    AI recommendations for the Explore page — no source destination.
    Groq picks the best destinations based purely on user preferences.
    Falls back to most-booked / first-added ordering if Groq fails.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        destinations = list(Destination.objects.filter(is_active=True))
        if not destinations:
            return Response([])

        raw_interests = request.query_params.get('interests', '')
        user_interests = [i.strip().lower() for i in raw_interests.split(',') if i.strip()]
        user_season = (request.query_params.get('season') or '').strip().lower()

        ranked = self._groq_rank(destinations, user_interests, user_season)

        results = []
        for item in ranked:
            dest = item['destination']
            data = DestinationSerializer(dest, context={'request': request}).data
            data['ai_reason'] = item['reason']

            hotels_qs = Hotel.objects.filter(destination=dest, is_active=True)
            hotel_stats = hotels_qs.aggregate(
                avg_rating=models.Avg('rating'),
                min_price=models.Min('price_per_night'),
                max_price=models.Max('price_per_night'),
                total_rooms=models.Sum('total_rooms'),
            )
            hotel_count = hotels_qs.count()

            booking_count = Booking.objects.filter(
                models.Q(room__hotel__destination=dest) |
                models.Q(package__destinations=dest)
            ).count()

            dest_name_lower = dest.name.lower()
            matching_packages = Package.objects.filter(is_active=True).filter(
                models.Q(destinations=dest) |
                models.Q(destination__icontains=dest_name_lower.split()[0])
            ).distinct()
            package_count = matching_packages.count()

            top_hotel = hotels_qs.order_by('-rating').first()

            data['stats'] = {
                'hotel_count': hotel_count,
                'avg_rating': round(float(hotel_stats['avg_rating'] or 0), 1),
                'min_price': float(hotel_stats['min_price'] or 0),
                'max_price': float(hotel_stats['max_price'] or 0),
                'total_rooms': int(hotel_stats['total_rooms'] or 0),
                'package_count': package_count,
                'booking_count': booking_count,
                'highlights_count': len(dest.highlights or []),
            }

            data['top_hotel'] = {
                'id': top_hotel.id,
                'name': top_hotel.name,
                'rating': float(top_hotel.rating),
                'price_per_night': float(top_hotel.price_per_night),
                'currency': top_hotel.currency,
                'amenities': (top_hotel.amenities or [])[:3],
            } if top_hotel else None

            data['packages'] = [
                {
                    'id': p.id,
                    'name': p.name,
                    'price': float(p.price),
                    'duration_days': p.duration_days,
                    'max_people': p.max_people,
                }
                for p in matching_packages[:3]
            ]

            results.append(data)

        return Response(results)

    def _groq_rank(self, destinations, user_interests, user_season):
        import os
        api_key = os.getenv('GROQ_API_KEY', '')
        if not api_key:
            return [{'destination': d, 'reason': None} for d in destinations[:4]]

        try:
            from groq import Groq
            from django.db.models import Avg, Min

            # Pre-select a diverse subset: up to 3 per province, max 24 total,
            # biased toward interest keywords when provided.
            scored = []
            for d in destinations:
                text = f"{d.name} {' '.join(d.highlights or [])} {d.description or ''}".lower()
                match_score = sum(1 for kw in user_interests if kw in text)
                scored.append((match_score, d))

            scored.sort(key=lambda x: -x[0])

            # Pick at most 3 per province, capped at 24
            province_counts: dict = {}
            candidate_pool = []
            for _, d in scored:
                pc = province_counts.get(d.province, 0)
                if pc < 3:
                    candidate_pool.append(d)
                    province_counts[d.province] = pc + 1
                if len(candidate_pool) >= 24:
                    break

            dest_list = []
            for d in candidate_pool:
                h_stats = Hotel.objects.filter(destination=d, is_active=True).aggregate(
                    avg_rating=Avg('rating'), min_price=Min('price_per_night')
                )
                dest_list.append({
                    'id': d.id,
                    'name': d.name,
                    'province': d.province,
                    'highlights': (d.highlights or [])[:4],
                    'best_time': d.best_time_to_visit or '',
                    'avg_hotel_rating': round(float(h_stats['avg_rating'] or 0), 1),
                    'min_price_per_night': float(h_stats['min_price'] or 0),
                })

            if user_interests or user_season:
                prefs_text = ''
                if user_interests:
                    prefs_text += f"- Interests: {', '.join(user_interests)}\n"
                if user_season:
                    prefs_text += f"- Travel season: {user_season}\n"
                context = f"The traveller has these preferences:\n{prefs_text}"
            else:
                context = "The traveller is a first-time visitor to Nepal with no specific preferences yet."

            prompt = f"""You are a Nepal tourism expert helping travellers discover destinations.

{context}

From the list of Nepal destinations below, recommend exactly 4 that best match this traveller.
Rank them from most to least suitable.
For each, write ONE engaging sentence (max 18 words) explaining why it's perfect for them.
Be specific — mention the type of experience, activity, or season. Vary the sentence structure.

Destinations:
{json.dumps(dest_list, indent=2)}

Reply with ONLY a valid JSON array, no markdown fences, no extra text:
[{{"id": <int>, "reason": "<sentence>"}}, ...]"""

            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                model='llama-3.1-8b-instant',
                messages=[{'role': 'user', 'content': prompt}],
                temperature=0.4,
            )

            raw = (response.choices[0].message.content or '').strip()
            if raw.startswith('```'):
                raw = raw.split('```')[1]
                if raw.startswith('json'):
                    raw = raw[4:]
            raw = raw.strip()

            results = json.loads(raw)
            dest_map = {d.id: d for d in destinations}
            ranked = []
            seen = set()
            for item in results:
                did = item.get('id')
                if did and did in dest_map and did not in seen:
                    ranked.append({'destination': dest_map[did], 'reason': item.get('reason', '')})
                    seen.add(did)
                if len(ranked) == 4:
                    break

            if len(ranked) < 4:
                for d in destinations:
                    if d.id not in seen:
                        ranked.append({'destination': d, 'reason': None})
                    if len(ranked) == 4:
                        break

            return ranked

        except Exception as e:
            print(f'Groq explore recommendation error: {e}')
            return [{'destination': d, 'reason': None} for d in destinations[:4]]


class KhaltiVerifyView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        token = request.data.get('token')
        amount = request.data.get('amount')
        
        if not token or not amount:
            return Response({'error': 'Token and amount are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            booking = Booking.objects.get(pk=pk, user=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Verify with Khalti
        import requests as httprequests
        url = "https://khalti.com/api/v2/payment/verify/"
        payload = {
            "token": token,
            "amount": amount
        }
        headers = {
            "Authorization": "Key test_secret_key_f59e8b7d18b4499ca40f68195a846e9b"
        }
        
        try:
            response = httprequests.post(url, payload, headers=headers)
            result = response.json()
            
            if response.status_code == 200 and result.get('idx'):
                # Payment successful
                booking.payment_status = 'paid'
                booking.payment_method = 'khalti'
                booking.status = 'confirmed'
                booking.save()
                return Response({'message': 'Payment verified successfully'})
            else:
                booking.payment_status = 'failed'
                booking.status = 'cancelled'
                booking.save()
                return Response({'error': 'Payment verification failed', 'details': result}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class KhaltiPaymentInitiateView(APIView):
    """
    Initiate Khalti payment for a booking
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            booking_id = request.data.get('booking_id')
            return_url = request.data.get('return_url', getattr(settings, 'KHALTI_RETURN_URL', 'http://localhost:5173/payment/verify'))
            
            if not booking_id:
                return Response({'error': 'Booking ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                booking = Booking.objects.get(id=booking_id, user=request.user)
            except Booking.DoesNotExist:
                return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
            
            if booking.payment_status == 'paid':
                return Response({'error': 'Payment already completed for this booking'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Initialize Khalti payment
            khalti = KhaltiPaymentGateway()
            payment_response = khalti.initiate_payment(booking, return_url)
            
            if payment_response.get('error'):
                return Response(payment_response, status=status.HTTP_400_BAD_REQUEST)
            
            # Update booking with payment initiation details
            booking.payment_method = 'khalti'
            booking.save()
            
            # Return Khalti response directly (frontend expects payment_url and pidx)
            return Response(payment_response)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class KhaltiPaymentVerifyView(APIView):
    """
    Verify Khalti payment after completion
    Following Khalti documentation for payment verification
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            pidx = request.data.get('pidx')
            
            if not pidx:
                return Response({'error': 'Payment identifier (pidx) is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Find booking associated with this pidx
            # We need to extract booking_id from purchase_order_id format "BOOK-{id}"
            # For now, we'll get all bookings and find the one with matching pidx in metadata
            # In production, you should store pidx with the booking during initiation
            
            # Verify payment with Khalti using lookup API
            khalti = KhaltiPaymentGateway()
            verification_response = khalti.verify_payment(pidx)
            
            if verification_response.get('error'):
                return Response(verification_response, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if verification was successful
            if verification_response.get('status') == 'Completed':
                # Extract booking_id from purchase_order_id
                purchase_order_id = verification_response.get('purchase_order_id', '')
                booking_id = None
                if purchase_order_id and purchase_order_id.startswith('BOOK-'):
                    try:
                        booking_id = int(purchase_order_id.split('-')[1])
                    except (ValueError, IndexError):
                        pass

                if booking_id:
                    try:
                        booking = Booking.objects.get(id=booking_id, user=request.user)
                        booking.payment_status = 'paid'
                        booking.payment_method = 'khalti'
                        booking.status = 'confirmed'
                        booking.save()

                        return Response({
                            'success': True,
                            'message': 'Payment verified and booking confirmed',
                            'booking_id': booking.id,
                            'payment_details': verification_response
                        })
                    except Booking.DoesNotExist:
                        pass

                return Response({
                    'success': True,
                    'message': 'Payment verified successfully',
                    'payment_details': verification_response
                })
            else:
                return Response({
                    'error': 'Payment not completed',
                    'status': verification_response.get('status'),
                    'details': verification_response
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class KhaltiPaymentCallbackView(APIView):
    """
    Handle Khalti payment callback (GET request)
    Following Khalti documentation for callback handling
    """
    permission_classes = [AllowAny]  # Callback from Khalti doesn't require authentication
    
    def get(self, request):
        try:
            pidx = request.GET.get('pidx')
            payment_status = request.GET.get('status')
            transaction_id = request.GET.get('transaction_id')
            amount = request.GET.get('amount')
            purchase_order_id = request.GET.get('purchase_order_id')

            if not pidx:
                return Response({'error': 'Payment identifier (pidx) is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Log the callback for debugging
            print(f"Khalti Callback: pidx={pidx}, status={payment_status}, transaction_id={transaction_id}")

            if payment_status == 'Completed':
                # Payment was successful, verify with lookup API
                khalti = KhaltiPaymentGateway()
                verification_response = khalti.verify_payment(pidx)

                if not verification_response.get('error') and verification_response.get('status') == 'Completed':
                    # Extract booking_id from purchase_order_id
                    booking_id = None
                    if purchase_order_id and purchase_order_id.startswith('BOOK-'):
                        try:
                            booking_id = int(purchase_order_id.split('-')[1])
                        except (ValueError, IndexError):
                            pass

                    if booking_id:
                        try:
                            booking = Booking.objects.get(id=booking_id)
                            booking.payment_status = 'paid'
                            booking.payment_method = 'khalti'
                            booking.status = 'confirmed'
                            booking.save()

                            return Response({
                                'success': True,
                                'message': 'Payment verified and booking confirmed',
                                'booking_id': booking.id
                            })
                        except Booking.DoesNotExist:
                            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

                    return Response({
                        'success': True,
                        'message': 'Payment verified',
                        'details': verification_response
                    })
                else:
                    return Response({'error': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)
            elif payment_status == 'User canceled':
                return Response({'error': 'Payment was cancelled by user'}, status=status.HTTP_400_BAD_REQUEST)
            elif payment_status == 'Pending':
                return Response({'error': 'Payment is pending'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'error': f'Payment failed with status: {payment_status}'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class KhaltiPaymentStatusView(APIView):
    """
    Check payment status using pidx
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pidx):
        try:
            khalti = KhaltiPaymentGateway()
            status_response = khalti.get_payment_status(pidx)
            
            if status_response.get('error'):
                return Response(status_response, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(status_response)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# eSewa Payment Views
@method_decorator(csrf_exempt, name='dispatch')
class EsewaPaymentInitiateView(APIView):
    """
    Initiate eSewa payment for a booking
    Returns payment form data for frontend to submit
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            booking_id = request.data.get('booking_id')
            success_url = request.data.get('success_url', getattr(settings, 'ESEWA_SUCCESS_URL', 'http://localhost:5173/payment/esewa/success'))
            failure_url = request.data.get('failure_url', getattr(settings, 'ESEWA_FAILURE_URL', 'http://localhost:5173/payment/esewa/failure'))
            
            if not booking_id:
                return Response({'error': 'Booking ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                booking = Booking.objects.get(id=booking_id, user=request.user)
            except Booking.DoesNotExist:
                return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
            
            if booking.payment_status == 'paid':
                return Response({'error': 'Payment already completed for this booking'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Initialize eSewa payment
            esewa = EsewaPaymentGateway()
            payment_data = esewa.initiate_payment(booking, success_url, failure_url)
            
            if payment_data.get('error'):
                return Response(payment_data, status=status.HTTP_400_BAD_REQUEST)
            
            # Update booking with payment initiation details
            booking.payment_method = 'esewa'
            booking.save()
            
            return Response(payment_data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class EsewaPaymentVerifyView(APIView):
    """
    Verify eSewa payment after completion
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            transaction_uuid = request.data.get('transaction_uuid')
            total_amount = request.data.get('total_amount')
            product_code = request.data.get('product_code')
            
            if not transaction_uuid or not total_amount:
                return Response({
                    'error': 'transaction_uuid and total_amount are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify payment with eSewa
            esewa = EsewaPaymentGateway()
            verification_response = esewa.verify_payment(transaction_uuid, total_amount, product_code)
            
            if verification_response.get('error'):
                return Response(verification_response, status=status.HTTP_400_BAD_REQUEST)
            
            # Extract booking_id from transaction_uuid (format: BOOK-{id}-{timestamp})
            booking_id = None
            if transaction_uuid and transaction_uuid.startswith('BOOK-'):
                try:
                    parts = transaction_uuid.split('-')
                    if len(parts) >= 2:
                        booking_id = int(parts[1])
                except (ValueError, IndexError):
                    pass
            
            if booking_id:
                try:
                    booking = Booking.objects.get(id=booking_id, user=request.user)
                    booking.payment_status = 'paid'
                    booking.payment_method = 'esewa'
                    booking.status = 'confirmed'
                    booking.save()
                    
                    return Response({
                        'success': True,
                        'message': 'Payment verified and booking confirmed',
                        'booking_id': booking.id,
                        'payment_details': verification_response
                    })
                except Booking.DoesNotExist:
                    return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'success': True,
                'message': 'Payment verified',
                'details': verification_response
            })
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@method_decorator(csrf_exempt, name='dispatch')
class EsewaPaymentCallbackView(APIView):
    """
    Handle eSewa payment callback (GET request from eSewa)
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            redirect_origin = resolve_frontend_redirect_origin(request.GET.get('redirect_origin'))
            requested_redirect_path = request.GET.get('redirect_path')
            success_redirect_path = resolve_frontend_redirect_path(
                requested_redirect_path,
                '/payment/esewa/success',
            )
            failure_redirect_path = resolve_frontend_redirect_path(
                requested_redirect_path if requested_redirect_path and 'failure' in requested_redirect_path else None,
                '/payment/esewa/failure',
            )

            redirect_params = request.GET.copy()
            redirect_params.pop('redirect_origin', None)
            redirect_params.pop('redirect_path', None)

            callback_data = parse_esewa_callback_payload(redirect_params)
            transaction_uuid = callback_data.get('transaction_uuid')
            transaction_code = callback_data.get('transaction_code')
            total_amount = callback_data.get('total_amount')
            product_code = callback_data.get('product_code')
            status_param = callback_data.get('status')
            
            print(f"eSewa Callback: transaction_uuid={transaction_uuid}, status={status_param}")
            
            if not transaction_uuid or not total_amount:
                failure_query = redirect_params.copy()
                failure_query['error'] = 'Invalid callback parameters'
                return HttpResponseRedirect(
                    f"{redirect_origin}{failure_redirect_path}?{failure_query.urlencode()}"
                )
            
            # Verify payment with eSewa
            esewa = EsewaPaymentGateway()
            verification_response = esewa.verify_payment(transaction_uuid, total_amount, product_code)
            
            if verification_response.get('success'):
                # Extract booking_id from transaction_uuid
                booking_id = None
                if transaction_uuid.startswith('BOOK-'):
                    try:
                        parts = transaction_uuid.split('-')
                        if len(parts) >= 2:
                            booking_id = int(parts[1])
                    except (ValueError, IndexError):
                        pass
                
                if booking_id:
                    try:
                        booking = Booking.objects.get(id=booking_id)
                        booking.payment_status = 'paid'
                        booking.payment_method = 'esewa'
                        booking.status = 'confirmed'
                        booking.save()

                        success_query = redirect_params.copy()
                        success_query['booking_id'] = booking.id
                        return HttpResponseRedirect(
                            f"{redirect_origin}{success_redirect_path}?{success_query.urlencode()}"
                        )
                    except Booking.DoesNotExist:
                        failure_query = redirect_params.copy()
                        failure_query['error'] = 'Booking not found'
                        return HttpResponseRedirect(
                            f"{redirect_origin}{failure_redirect_path}?{failure_query.urlencode()}"
                        )

                return HttpResponseRedirect(
                    f"{redirect_origin}{success_redirect_path}?{redirect_params.urlencode()}"
                )

            failure_query = redirect_params.copy()
            failure_query['error'] = verification_response.get('message', 'Payment verification failed')
            return HttpResponseRedirect(
                f"{redirect_origin}{failure_redirect_path}?{failure_query.urlencode()}"
            )
                
        except Exception as e:
            redirect_origin = resolve_frontend_redirect_origin(request.GET.get('redirect_origin'))
            failure_redirect_path = resolve_frontend_redirect_path(
                request.GET.get('redirect_path') if request.GET.get('redirect_path') and 'failure' in request.GET.get('redirect_path') else None,
                '/payment/esewa/failure',
            )
            error_query = request.GET.copy()
            error_query.pop('redirect_origin', None)
            error_query.pop('redirect_path', None)
            error_query['error'] = str(e)
            return HttpResponseRedirect(
                f"{redirect_origin}{failure_redirect_path}?{error_query.urlencode()}"
            )


CHAT_SYSTEM_PROMPT = """You are a knowledgeable and friendly Nepal Tourism Assistant for the Nepal Tourism Management System website.

Your role:
- Answer ANY question related to Nepal tourism, travel, culture, food, festivals, trekking, hotels, visa, currency, transport, weather, safety, and bookings.
- Be conversational, warm, and helpful — like a local expert who knows Nepal deeply.
- Handle typos and informal language gracefully; understand what the user means even if spelled incorrectly.
- Keep responses concise but complete — use bullet points and short paragraphs for readability.
- If asked about specific hotels, packages, or bookings on this platform, guide the user to explore the Destinations and Hotels sections of the website.
- For pricing, give realistic NPR/USD ranges based on current Nepal tourism standards.
- Always be encouraging about visiting Nepal.

Key knowledge areas:
- Destinations: Kathmandu, Pokhara, Chitwan, Lumbini, Everest Base Camp, Annapurna Circuit, Mustang, Manang, Langtang
- Trekking: routes, difficulty levels, required permits (TIMS, ACAP, Sagarmatha), best seasons
- Culture: Hinduism, Buddhism, Newari culture, festivals (Dashain, Tihar, Holi, Indra Jatra, Buddha Jayanti, Losar)
- Food: Dal bhat, Momos, Thukpa, Sel roti, Newari cuisine, Thakali food
- Transport: Domestic flights, tourist buses, local transport
- Visa: Visa on arrival, fees, duration (15/30/90 days), SAARC free visa
- Currency: NPR, exchange rates, ATM availability
- Safety: altitude sickness, water safety, trekking safety, emergency contacts
- Weather: spring (Mar-May), monsoon (Jun-Aug), autumn (Sep-Nov), winter (Dec-Feb)
- Adventure: paragliding in Pokhara, rafting, bungee jumping, mountain flights, wildlife safaris

Do NOT answer questions unrelated to Nepal tourism or travel. Politely redirect if asked about unrelated topics."""


class ChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        import os
        message = (request.data.get('message') or '').strip()
        history = request.data.get('history') or []

        if not message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        api_key = os.getenv('GROQ_API_KEY', '')
        if not api_key:
            return Response({'reply': 'AI assistant is temporarily unavailable. Please try again later.'})

        try:
            from groq import Groq
            client = Groq(api_key=api_key)

            messages = [{'role': 'system', 'content': CHAT_SYSTEM_PROMPT}]

            for turn in history[-10:]:
                role = turn.get('role')
                content = turn.get('content', '')
                if role in ('user', 'assistant') and content:
                    messages.append({'role': role, 'content': content})

            messages.append({'role': 'user', 'content': message})

            completion = client.chat.completions.create(
                model='llama-3.1-8b-instant',
                messages=messages,
                temperature=0.7,
                max_tokens=600,
            )
            reply = completion.choices[0].message.content.strip()
            return Response({'reply': reply})

        except Exception as e:
            return Response({'reply': 'Sorry, I encountered an error. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
