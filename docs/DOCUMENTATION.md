# Nepal Tourism Management System - Complete Documentation

A comprehensive full-stack web application for managing tourism services in Nepal. Features destination management, hotel bookings, tour packages, tour guide services, and integrated payment processing with Khalti and eSewa.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Authentication System](#authentication-system)
- [Payment Integration](#payment-integration)
- [User Roles & Permissions](#user-roles--permissions)
- [Frontend Pages](#frontend-pages)
- [Configuration](#configuration)
- [Security Considerations](#security-considerations)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Features

### Core Features

- **Destination Management**
  - Browse destinations across 7 provinces of Nepal
  - Destination details with highlights, best time to visit, and coordinates
  - Map integration with Leaflet for location visualization
  - Admin/Provider destination creation and management

- **Hotel & Room Booking**
  - Hotels linked to destinations with amenities, ratings, and contact info
  - Multiple room types per hotel (Single, Double, Deluxe, Suite)
  - Room availability management
  - Date-based booking with price calculation

- **Travel Packages**
  - Multi-destination travel packages
  - Duration-based pricing
  - Provider-managed package creation

- **Tour Guide System**
  - Guide profiles with languages, experience, and certifications
  - Daily rate pricing in NPR
  - Destination specialization
  - Guide booking with automatic price calculation

### User Management

- **Authentication**
  - Email/Password registration and login
  - Google OAuth 2.0 integration
  - JWT token-based authentication
  - Secure password reset via email

- **Role-Based Access Control (RBAC)**
  - **User**: Browse destinations, book hotels/packages/guides
  - **Admin**: Full system management, analytics, user management
  - **Provider**: Manage hotels, rooms, and packages
  - **Guide**: Manage tour guide profile and view bookings

### Payment Processing

- **Khalti Integration**: Nepal's leading digital wallet
- **eSewa Integration**: Popular Nepali payment gateway
- Payment status tracking (unpaid, paid, failed)
- Secure HMAC-SHA256 signature verification

### Dashboards

- **Admin Dashboard**: System statistics, user management, revenue tracking
- **Provider Dashboard**: Hotel management, room management, booking views
- **Guide Dashboard**: Profile management, booking management
- **User Dashboard**: Booking history, profile management

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI Framework |
| Vite | 7.2.4 | Build Tool |
| Tailwind CSS | 3.4.0 | Styling |
| shadcn/ui | - | Component Library |
| Radix UI | - | Accessible Primitives |
| Axios | 1.13.2 | HTTP Client |
| React Router DOM | 7.12.0 | Client-side Routing |
| Leaflet | 1.9.4 | Maps |
| React Leaflet | 5.0.0 | React Map Components |
| Lucide React | 0.562.0 | Icons |
| React Hot Toast | 2.4.1 | Notifications |
| @react-oauth/google | 0.13.4 | Google OAuth |
| khalti-checkout-web | 2.2.0 | Khalti Payment |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Django | 5.2 | Web Framework |
| Django REST Framework | 3.16.1 | REST API |
| djangorestframework-simplejwt | 5.5.1 | JWT Authentication |
| django-cors-headers | 4.9.0 | CORS Support |
| google-auth-oauthlib | 1.2.3 | Google OAuth |
| Pillow | 11.2.1 | Image Processing |
| python-decouple | 3.8 | Environment Variables |
| SQLite3 | - | Database (Development) |

---

## Project Structure

```
Nepal-Tourism-Management-System/
├── backend/
│   ├── backend/                    # Django project configuration
│   │   ├── __init__.py
│   │   ├── settings.py             # Django settings (JWT, CORS, Email, Payment)
│   │   ├── urls.py                 # Root URL configuration
│   │   ├── asgi.py                 # ASGI entry point
│   │   └── wsgi.py                 # WSGI entry point
│   │
│   ├── tourism/                    # Main Django application
│   │   ├── migrations/             # Database migrations
│   │   │   ├── 0001_initial.py
│   │   │   ├── 0002_destination_hotel_package_room_booking.py
│   │   │   ├── 0003_booking_payment_method_booking_payment_status.py
│   │   │   ├── 0004_backfill_hotel_provider.py
│   │   │   └── 0005_tour_guide_feature.py
│   │   ├── __init__.py
│   │   ├── admin.py                # Django admin configuration
│   │   ├── apps.py                 # App configuration
│   │   ├── models.py               # Database models
│   │   ├── serializers.py          # DRF serializers
│   │   ├── urls.py                 # API URL routing
│   │   ├── views.py                # API views (endpoints)
│   │   ├── khalti_integration.py   # Khalti payment gateway
│   │   └── esewa_integration.py    # eSewa payment gateway
│   │
│   ├── manage.py                   # Django management script
│   ├── requirements.txt            # Python dependencies
│   ├── db.sqlite3                  # SQLite database
│   └── .env                        # Environment variables
│
├── frontend/
│   ├── public/                     # Static public assets
│   │
│   ├── src/
│   │   ├── assets/                 # Images and static files
│   │   │
│   │   ├── components/             # Reusable UI components
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   │   ├── avatar.jsx
│   │   │   │   ├── button.jsx
│   │   │   │   ├── card.jsx
│   │   │   │   ├── dialog.jsx
│   │   │   │   ├── dropdown-menu.jsx
│   │   │   │   ├── input.jsx
│   │   │   │   ├── label.jsx
│   │   │   │   ├── select.jsx
│   │   │   │   └── tabs.jsx
│   │   │   ├── AuthModal.jsx       # Authentication modal
│   │   │   ├── BookingModal.jsx    # Hotel/package booking
│   │   │   ├── Chatbot.jsx         # Interactive chatbot
│   │   │   ├── DestinationShowcase.jsx
│   │   │   ├── GuideBookModal.jsx  # Guide booking
│   │   │   ├── Navbar.jsx          # Navigation bar
│   │   │   ├── PropertySection.jsx
│   │   │   └── RoomManager.jsx     # Room CRUD for providers
│   │   │
│   │   ├── lib/                    # Utilities
│   │   │   └── utils.js            # Helper functions
│   │   │
│   │   ├── pages/                  # Page components
│   │   │   ├── Home.jsx            # Landing page
│   │   │   ├── Auth.jsx            # Authentication page
│   │   │   ├── UserDashboard.jsx   # User dashboard
│   │   │   ├── AdminDashboard.jsx  # Admin dashboard
│   │   │   ├── ProviderDashboard.jsx # Provider dashboard
│   │   │   ├── GuideDashboard.jsx  # Guide dashboard
│   │   │   ├── Guides.jsx          # Browse guides
│   │   │   ├── GuideDetail.jsx     # Guide profile view
│   │   │   ├── DestinationDetail.jsx # Destination page
│   │   │   ├── DestinationResults.jsx # Search results
│   │   │   ├── PaymentPage.jsx     # Payment selection
│   │   │   ├── PaymentVerify.jsx   # Khalti verification
│   │   │   ├── EsewaSuccess.jsx    # eSewa success page
│   │   │   ├── EsewaFailure.jsx    # eSewa failure page
│   │   │   └── ResetPassword.jsx   # Password reset
│   │   │
│   │   ├── services/               # API service layer
│   │   │   ├── api.js              # Main API configuration
│   │   │   ├── khaltiService.js    # Khalti payment service
│   │   │   └── esewaService.js     # eSewa payment service
│   │   │
│   │   ├── App.jsx                 # Main app with routing
│   │   ├── App.css                 # Global styles
│   │   ├── index.css               # Tailwind imports
│   │   └── main.jsx                # Entry point
│   │
│   ├── components.json            # shadcn/ui configuration
│   ├── eslint.config.js           # ESLint configuration
│   ├── index.html                 # HTML entry point
│   ├── jsconfig.json              # JavaScript configuration
│   ├── package.json               # NPM dependencies
│   ├── package-lock.json          # Dependency lock file
│   ├── postcss.config.js          # PostCSS configuration
│   ├── tailwind.config.js         # Tailwind CSS configuration
│   └── vite.config.js             # Vite configuration
│
├── README.md                       # Project overview
├── DOCUMENTATION.md                # This file
├── INTEGRATION_SUMMARY.md          # Payment integration summary
├── ESEWA_SETUP.md                  # eSewa setup guide
└── PAYMENT_COMPARISON.md           # Payment gateway comparison
```

---

## Installation & Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm 9+
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/NamunaRegmi/Nepal-Tourism-Management-System.git
   cd Nepal-Tourism-Management-System
   ```

2. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # Linux/macOS
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment file**
   ```bash
   # Create .env file in backend directory
   touch .env
   ```

   Add the following to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   EMAIL_HOST_USER=your_email@gmail.com
   EMAIL_HOST_PASSWORD=your_app_password
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser (admin)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start development server**
   ```bash
   python manage.py runserver
   ```

   Backend runs at: `http://127.0.0.1:8000/`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend runs at: `http://localhost:5173/`

### Quick Start (Both Servers)

**Terminal 1 (Backend):**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `121710348384-xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | `GOCSPX-xxx` |
| `EMAIL_HOST_USER` | Gmail address for sending emails | `your_email@gmail.com` |
| `EMAIL_HOST_PASSWORD` | Gmail App Password (not regular password) | `xxxx xxxx xxxx xxxx` |

### Payment Configuration (in settings.py)

| Variable | Description | Default (Sandbox) |
|----------|-------------|-------------------|
| `KHALTI_SECRET_KEY` | Khalti API Secret | `test_secret_key_xxx` |
| `KHALTI_PUBLIC_KEY` | Khalti Public Key | `test_public_key_xxx` |
| `ESEWA_MERCHANT_ID` | eSewa Merchant Code | `EPAYTEST` |
| `ESEWA_MERCHANT_SECRET` | eSewa Secret Key | `8gBm/:&EnhH.1/q` |

---

## Database Schema

### User Model (Custom)

```python
User:
  - id: Primary Key
  - username: CharField (unique)
  - email: EmailField (unique)
  - password: CharField (hashed)
  - first_name: CharField
  - last_name: CharField
  - phone: CharField (optional)
  - profile_picture: URLField (optional)
  - google_id: CharField (unique, optional)
  - role: CharField (choices: user, admin, provider, guide)
  - is_active: Boolean
  - date_joined: DateTime
```

### Destination Model

```python
Destination:
  - id: Primary Key
  - name: CharField
  - province: CharField (choices: Province 1-7, Bagmati, Gandaki, Lumbini, Karnali, Sudurpashchim)
  - description: TextField
  - image: URLField
  - highlights: JSONField (list of strings)
  - best_time_to_visit: CharField
  - latitude: DecimalField (optional)
  - longitude: DecimalField (optional)
  - is_active: Boolean (default: True)
  - created_by: ForeignKey (User, optional)
  - created_at: DateTime (auto)
  - updated_at: DateTime (auto)
```

### Hotel Model

```python
Hotel:
  - id: Primary Key
  - destination: ForeignKey (Destination)
  - provider: ForeignKey (User)
  - name: CharField
  - description: TextField
  - image: URLField
  - rating: DecimalField (0.0-9.9)
  - price_per_night: DecimalField
  - currency: CharField (default: NPR)
  - amenities: JSONField (list)
  - contact_number: CharField
  - email: EmailField
  - address: CharField
  - total_rooms: IntegerField
  - is_active: Boolean
  - created_at: DateTime (auto)
  - updated_at: DateTime (auto)
```

### Room Model

```python
Room:
  - id: Primary Key
  - hotel: ForeignKey (Hotel)
  - room_type: CharField (choices: Single, Double, Deluxe, Suite)
  - price: DecimalField
  - capacity: IntegerField (default: 2)
  - description: TextField (optional)
  - image: URLField (optional)
  - is_available: Boolean (default: True)
```

### Package Model

```python
Package:
  - id: Primary Key
  - provider: ForeignKey (User)
  - name: CharField
  - description: TextField
  - price: DecimalField
  - duration_days: IntegerField
  - destinations: ManyToManyField (Destination)
  - image: URLField (optional)
  - is_active: Boolean
  - created_at: DateTime (auto)
```

### Booking Model

```python
Booking:
  - id: Primary Key
  - user: ForeignKey (User)
  - room: ForeignKey (Room, optional)
  - package: ForeignKey (Package, optional)
  - start_date: DateField
  - end_date: DateField (optional)
  - total_price: DecimalField
  - status: CharField (choices: pending, confirmed, cancelled, completed)
  - payment_status: CharField (choices: unpaid, paid, failed)
  - payment_method: CharField (choices: none, khalti, esewa)
  - created_at: DateTime (auto)
```

### TourGuideProfile Model

```python
TourGuideProfile:
  - id: Primary Key
  - user: OneToOneField (User)
  - headline: CharField
  - bio: TextField
  - languages: JSONField (list)
  - years_experience: PositiveIntegerField
  - daily_rate: DecimalField (NPR)
  - certifications: TextField
  - image: URLField (optional)
  - destinations: ManyToManyField (Destination)
  - is_active: Boolean
  - created_at: DateTime (auto)
  - updated_at: DateTime (auto)
```

### GuideBooking Model

```python
GuideBooking:
  - id: Primary Key
  - user: ForeignKey (User)
  - guide_profile: ForeignKey (TourGuideProfile)
  - start_date: DateField
  - end_date: DateField
  - total_price: DecimalField (auto-calculated: days × daily_rate)
  - status: CharField (choices: pending, confirmed, cancelled, completed)
  - payment_status: CharField (choices: unpaid, paid, failed)
  - payment_method: CharField
  - notes: TextField (optional)
  - created_at: DateTime (auto)
```

---

## API Documentation

### Base URL

```
http://127.0.0.1:8000/api/
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register/` | Register new user | No |
| POST | `/auth/login/` | Login with email/password | No |
| POST | `/auth/google/` | Google OAuth login | No |
| GET | `/auth/profile/` | Get current user profile | Yes |
| PUT | `/auth/profile/` | Update user profile | Yes |
| POST | `/auth/forgot-password/` | Request password reset email | No |
| POST | `/auth/reset-password/` | Reset password with token | No |

### Destination Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/destinations/` | List all active destinations | No |
| POST | `/destinations/` | Create destination | Admin/Provider |
| GET | `/destinations/{id}/` | Get destination details | No |
| PUT | `/destinations/{id}/` | Update destination | Admin/Provider |
| DELETE | `/destinations/{id}/` | Soft delete destination | Admin |

### Hotel Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/destinations/{id}/hotels/` | List hotels for destination | No |
| GET | `/provider/hotels/` | List provider's hotels | Provider |
| POST | `/provider/hotels/` | Create hotel | Provider |
| GET | `/hotels/{id}/` | Get hotel details with rooms | No |
| PUT | `/hotels/{id}/` | Update hotel | Provider/Admin |
| DELETE | `/hotels/{id}/` | Delete hotel | Provider/Admin |

### Room Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/hotels/{id}/rooms/` | List rooms for hotel | No |
| POST | `/hotels/{id}/rooms/` | Create room | Provider |
| GET | `/rooms/{id}/` | Get room details | No |
| PUT | `/rooms/{id}/` | Update room | Provider |
| DELETE | `/rooms/{id}/` | Delete room | Provider |

### Package Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/packages/` | List all packages | No |
| POST | `/packages/` | Create package | Provider/Admin |
| GET | `/packages/{id}/` | Get package details | No |
| PUT | `/packages/{id}/` | Update package | Provider/Admin |
| DELETE | `/packages/{id}/` | Delete package | Provider/Admin |

### Booking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/bookings/` | List bookings (role-dependent) | Yes |
| POST | `/bookings/` | Create booking | Yes |
| GET | `/bookings/{id}/` | Get booking details | Yes |
| PUT | `/bookings/{id}/` | Update booking status | Yes |

### Tour Guide Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/guides/` | List all active guides | No |
| GET | `/guides/{id}/` | Get guide details | No |
| GET | `/guides/me/profile/` | Get own guide profile | Guide |
| POST | `/guides/me/profile/` | Create guide profile | Guide |
| PUT | `/guides/me/profile/` | Update guide profile | Guide |

### Guide Booking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/guide-bookings/` | List guide bookings | Yes |
| POST | `/guide-bookings/` | Create guide booking | Yes |
| GET | `/guide-bookings/{id}/` | Get booking details | Yes |
| PUT | `/guide-bookings/{id}/` | Update booking | Yes |

### Payment Endpoints

**Khalti:**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payment/khalti/initiate/` | Initiate Khalti payment | Yes |
| POST | `/payment/khalti/verify/` | Verify payment with pidx | Yes |
| GET | `/payment/khalti/status/{pidx}/` | Check payment status | Yes |

**eSewa:**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/payment/esewa/initiate/` | Get eSewa form data | Yes |
| POST | `/payment/esewa/verify/` | Verify transaction | Yes |
| GET | `/payment/esewa/callback/` | eSewa callback handler | No |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/stats/` | Get dashboard statistics | Admin |
| GET | `/admin/users/` | List all users | Admin |
| DELETE | `/admin/users/{id}/` | Delete user | Admin |
| GET | `/admin/providers/` | List all providers | Admin |

### Request/Response Examples

**Register User:**
```bash
POST /api/auth/register/
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "user"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "user",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Create Booking:**
```bash
POST /api/bookings/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "room": 5,
  "start_date": "2024-12-20",
  "end_date": "2024-12-25",
  "total_price": 25000
}
```

**Google OAuth Login:**
```bash
POST /api/auth/google/
Content-Type: application/json

{
  "credential": "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
  "role": "user"
}
```

**Response:**
```json
{
  "id": 2,
  "username": "john_google",
  "email": "john@gmail.com",
  "first_name": "John",
  "last_name": "Doe",
  "profile_picture": "https://lh3.googleusercontent.com/...",
  "role": "user",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Initiate Khalti Payment:**
```bash
POST /api/payment/khalti/initiate/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "booking_id": 15
}
```

**Response:**
```json
{
  "pidx": "bZQLD9wRVWo4CdESSfmSsW",
  "payment_url": "https://test-pay.khalti.com/?pidx=bZQLD9wRVWo4CdESSfmSsW",
  "expires_at": "2024-12-20T15:30:00Z"
}
```

---

## Authentication System

### JWT Token Flow

1. User registers or logs in
2. Backend returns `access_token` (1 hour) and `refresh_token` (7 days)
3. Frontend stores tokens in `localStorage`
4. Axios interceptor adds `Authorization: Bearer {token}` to all requests
5. On 401 error, redirect to login

### Token Configuration

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

### Google OAuth Flow

1. User clicks "Sign in with Google"
2. Google returns credential token
3. Frontend sends token + role to `/api/auth/google/`
4. Backend verifies with Google's public keys
5. Backend creates/updates user and returns JWT tokens

### Password Reset Flow

1. User requests reset at `/api/auth/forgot-password/`
2. Backend sends email with reset link containing token
3. User clicks link, redirected to `/reset-password?token={token}&uid={uid}`
4. User submits new password to `/api/auth/reset-password/`
5. Backend validates token and updates password

### Axios Interceptor (Frontend)

```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## Payment Integration

### Khalti Payment

**Configuration:**
```python
KHALTI_SECRET_KEY = 'test_secret_key_f59e8b7d18b4499ca40f68195a846e9b'
KHALTI_PUBLIC_KEY = 'test_public_key_dc7127a0d5e049b19331a7949389e5b8'
KHALTI_INITIATE_URL = 'https://dev.khalti.com/api/v2/epayment/initiate/'
KHALTI_VERIFY_URL = 'https://dev.khalti.com/api/v2/epayment/lookup/'
```

**Flow:**
1. User selects Khalti at checkout
2. Frontend calls `/api/payment/khalti/initiate/` with booking_id
3. Backend creates payment request with Khalti API
4. Backend returns `payment_url` and `pidx`
5. Frontend opens popup with `payment_url`
6. User completes payment on Khalti
7. Frontend calls `/api/payment/khalti/verify/` with `pidx`
8. Backend verifies with Khalti lookup API
9. On success, booking status updated to "confirmed"

**Test Credentials (Sandbox):**
| Field | Value |
|-------|-------|
| Khalti ID | `9800000001` to `9800000005` |
| MPIN | `1111` |
| OTP | `987654` |

### eSewa Payment

**Configuration:**
```python
ESEWA_MERCHANT_ID = 'EPAYTEST'
ESEWA_MERCHANT_SECRET = '8gBm/:&EnhH.1/q'
ESEWA_PAYMENT_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
ESEWA_VERIFY_URL = 'https://uat.esewa.com.np/api/epay/transaction/status/'
```

**Flow:**
1. User selects eSewa at checkout
2. Frontend calls `/api/payment/esewa/initiate/` with booking_id
3. Backend generates HMAC-SHA256 signature
4. Backend returns form parameters
5. Frontend auto-submits form to eSewa
6. User completes payment on eSewa
7. eSewa redirects to success/failure page
8. Frontend calls `/api/payment/esewa/verify/`
9. Backend verifies transaction status
10. On success, booking status updated

**HMAC Signature Generation:**
```python
import hmac
import hashlib
import base64

def generate_signature(message, secret):
    hmac_sha256 = hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    )
    return base64.b64encode(hmac_sha256.digest()).decode('utf-8')

# Message format
message = f"total_amount={amount},transaction_uuid={uuid},product_code={merchant_id}"
```

**Test Credentials (Sandbox):**
| Field | Value |
|-------|-------|
| eSewa ID | `9806800001` to `9806800005` |
| Password | `Nepal@123` |
| Token/OTP | `123456` |

### Payment Status States

```
payment_status: unpaid → paid (on verification) or failed
status: pending → confirmed (payment verified) or cancelled
payment_method: 'khalti' or 'esewa' or 'none'
```

---

## User Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **user** | Regular tourist/traveler | Browse destinations, book hotels/packages/guides, view own bookings |
| **admin** | System administrator | Full access: manage users, destinations, hotels, packages, view all bookings, analytics |
| **provider** | Tourism service provider | Manage own hotels/rooms/packages, view bookings for own properties |
| **guide** | Certified tour guide | Manage guide profile, view guide bookings, set rates |

### Permission Checks in Views

```python
# Example from views.py
class HotelDetailView(APIView):
    def put(self, request, pk):
        hotel = get_object_or_404(Hotel, pk=pk)

        # Permission check
        if request.user.role not in ['admin', 'provider']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Provider can only edit own hotels
        if request.user.role == 'provider' and hotel.provider != request.user:
            return Response(
                {'error': 'You can only edit your own hotels'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Proceed with update...
```

---

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with destination showcase |
| Auth | `/auth` | Login/Registration page |
| User Dashboard | `/dashboard` | User bookings and profile |
| Admin Dashboard | `/admin` | Admin statistics and management |
| Provider Dashboard | `/provider` | Hotel and room management |
| Guide Dashboard | `/guide-dashboard` | Guide profile and bookings |
| Guides | `/guides` | Browse tour guides |
| Guide Detail | `/guides/:id` | Individual guide profile |
| Destination Detail | `/destinations/:id` | Destination with hotels |
| Search Results | `/search` | Destination search results |
| Payment | `/payment/:bookingId` | Payment method selection |
| Payment Verify | `/payment/verify` | Khalti callback handler |
| eSewa Success | `/payment/esewa/success` | eSewa success page |
| eSewa Failure | `/payment/esewa/failure` | eSewa failure page |
| Reset Password | `/reset-password` | Password reset form |

### Routing Configuration (App.jsx)

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/provider" element={<ProviderDashboard />} />
        <Route path="/guide-dashboard" element={<GuideDashboard />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/guides/:id" element={<GuideDetail />} />
        <Route path="/destinations/:id" element={<DestinationDetail />} />
        <Route path="/search" element={<DestinationResults />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />
        <Route path="/payment/verify" element={<PaymentVerify />} />
        <Route path="/payment/esewa/success" element={<EsewaSuccess />} />
        <Route path="/payment/esewa/failure" element={<EsewaFailure />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Configuration

### Django Settings (backend/backend/settings.py)

```python
# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# CORS Origins
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
]

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### Vite Configuration (frontend/vite.config.js)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### Tailwind Configuration (frontend/tailwind.config.js)

```javascript
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // ... more color definitions
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## Security Considerations

### Implemented Security Measures

- JWT token-based authentication with expiration
- Password hashing (Django's PBKDF2)
- CORS configuration for allowed origins
- HMAC-SHA256 signature verification for eSewa
- Role-based access control
- Soft deletes for data preservation

### Production Security Checklist

| Item | Status | Action Required |
|------|--------|-----------------|
| Django SECRET_KEY | Development | Generate strong unique key |
| DEBUG Mode | True | Set to False |
| ALLOWED_HOSTS | Empty | Configure with domain |
| Database | SQLite | Migrate to PostgreSQL/MySQL |
| HTTPS | Not configured | Enable SSL/TLS |
| Payment Keys | Sandbox | Replace with production keys |
| Rate Limiting | Not implemented | Add API rate limiting |
| Logging | Basic | Add comprehensive logging |
| CORS | Development | Restrict to production domains |

### Recommended Production Settings

```python
# production_settings.py
import os

DEBUG = False
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': '5432',
    }
}

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000

# CORS
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
]
```

---

## Deployment

### Backend Deployment (Heroku Example)

1. **Create Procfile:**
   ```
   web: gunicorn backend.wsgi
   ```

2. **Add dependencies:**
   ```bash
   pip install gunicorn dj-database-url whitenoise
   pip freeze > requirements.txt
   ```

3. **Update settings.py:**
   ```python
   import dj_database_url

   DATABASES['default'] = dj_database_url.config(conn_max_age=600)

   MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
   STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
   ```

4. **Deploy:**
   ```bash
   heroku create your-app-name
   heroku config:set DJANGO_SECRET_KEY=your-secret-key
   git push heroku main
   heroku run python manage.py migrate
   ```

### Frontend Deployment (Vercel Example)

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy via Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel
   ```

3. **Or connect GitHub repo to Vercel dashboard**

### Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=tourism
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=${DB_PASSWORD}

volumes:
  postgres_data:
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ESLint configuration
- **Commits**: Use conventional commit messages

### Development Workflow

1. Create issue for new feature/bug
2. Create branch from `main`
3. Implement changes with tests
4. Submit PR with description
5. Address review feedback
6. Merge after approval

---

## License

This project is licensed under the MIT License.

---

## Contact

- **Author**: Namuna Regmi
- **GitHub**: [NamunaRegmi](https://github.com/NamunaRegmi)

---

## Acknowledgments

- [Django](https://www.djangoproject.com/) - The web framework for perfectionists with deadlines
- [React](https://react.dev/) - The library for web and native user interfaces
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Khalti](https://khalti.com/) - Digital wallet and payment gateway
- [eSewa](https://esewa.com.np/) - Nepal's first online payment gateway
- [Leaflet](https://leafletjs.com/) - Open-source JavaScript library for maps
