# Nepal Tourism Management System

A full-stack web application for managing tourism services in Nepal. Features role-based dashboards, hotel and destination management, tour guide bookings, and integrated payment processing via Khalti and eSewa.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS, shadcn/ui, Vite |
| Backend | Django 5.2, Django REST Framework |
| Database | SQLite (development) |
| Auth | JWT (SimpleJWT) + Google OAuth 2.0 |
| Payments | Khalti, eSewa |
| Maps | Leaflet / React-Leaflet |
| Email | Gmail SMTP |

## Project Structure

```
Nepal-Tourism-Management-System/
├── backend/
│   ├── backend/              # Django settings, urls, wsgi
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── tourism/              # Main Django app
│   │   ├── models.py         # User, Destination, Hotel, Room, Booking, Package, Guide
│   │   ├── views.py          # API endpoints
│   │   ├── serializers.py    # DRF serializers
│   │   ├── urls.py           # API routes
│   │   ├── admin.py          # Admin panel config
│   │   ├── khalti_integration.py
│   │   └── esewa_integration.py
│   ├── scripts/              # Utility scripts (seed data, tests)
│   ├── media/                # Uploaded images (gitignored)
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                  # Environment variables (gitignored)
│   └── venv/                 # Python virtual environment (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── services/         # API service layer (axios)
│   │   ├── App.jsx           # Root component with routing
│   │   └── main.jsx          # Entry point
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── docs/                     # Documentation files
└── README.md
```

## Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- **Git**

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/NamunaRegmi/Nepal-Tourism-Management-System.git
cd Nepal-Tourism-Management-System
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # Linux / macOS
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```env
# Google OAuth (get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Gmail SMTP for password reset emails
# Use an App Password, not your regular password
# Generate at: https://myaccount.google.com/apppasswords
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password

# Khalti Payment (optional - defaults to test keys)
# Get from https://admin.khalti.com
# KHALTI_SECRET_KEY=your_khalti_secret_key
# KHALTI_PUBLIC_KEY=your_khalti_public_key

# eSewa Payment (optional - defaults to sandbox)
# ESEWA_MERCHANT_ID=your_esewa_merchant_id
# ESEWA_MERCHANT_SECRET=your_esewa_merchant_secret
```

Run database migrations and start the server:

```bash
python manage.py migrate
python manage.py createsuperuser    # create an admin account
python manage.py runserver
```

Backend runs at: **http://127.0.0.1:8000**

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:5173**

### 4. Seed sample data (optional)

To populate destinations and hotels for testing:

```bash
cd backend
source venv/bin/activate
python manage.py shell < scripts/seed_data.py
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services > Credentials**
4. Create an **OAuth 2.0 Client ID** (Web application)
5. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://localhost:5174`
6. Add authorized redirect URIs:
   - `http://localhost:5173`
7. Copy the **Client ID** and **Client Secret** into your `backend/.env` file
8. The same Client ID is used in `frontend/src/main.jsx` for the Google login button — update it there if you use a different one

## User Roles
~
| Role | Access |
|------|--------|
| **User** | Browse destinations, book hotels/packages, hire guides, make payments |
| **Provider** | Manage own hotels, rooms, and packages |
| **Guide** | Create guide profile, manage bookings |
| **Admin** | Full access — manage users, destinations, all bookings |

Register with any role from the sign-up page. Use the Django admin panel at `/admin/` for full control.

## API Endpoints

Base URL: `http://127.0.0.1:8000/api/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register/` | Register new user |
| POST | `/auth/login/` | Login |
| POST | `/auth/google/` | Google OAuth login |
| GET | `/destinations/` | List destinations |
| GET | `/destinations/<id>/` | Destination detail |
| GET | `/destinations/<id>/hotels/` | Hotels at destination |
| GET | `/hotels/<id>/rooms/` | Rooms in hotel |
| POST | `/bookings/` | Create booking |
| GET | `/bookings/` | List user bookings |
| POST | `/payment/khalti/initiate/` | Start Khalti payment |
| POST | `/payment/khalti/verify/` | Verify Khalti payment |
| POST | `/payment/esewa/initiate/` | Start eSewa payment |
| POST | `/payment/esewa/verify/` | Verify eSewa payment |
| GET | `/guides/` | List tour guides |
| POST | `/guide-bookings/` | Book a guide |

## Payment Integration

Both payment gateways work in **sandbox/test mode** by default (no real money).

- **Khalti**: Test credentials are built into settings. Use Khalti test accounts to simulate payments.
- **eSewa**: Defaults to `EPAYTEST` sandbox. Use eSewa test accounts to simulate payments.

To switch to production, set the real keys in your `.env` file.

## Running in Production

This setup is for development only. For production you would need to:

- Switch `DEBUG = False` in settings
- Use PostgreSQL or another production database
- Serve media files via a CDN or cloud storage (e.g., Cloudinary)
- Use a WSGI server like Gunicorn
- Set `ALLOWED_HOSTS` and proper CORS origins
- Use environment-specific secret keys
