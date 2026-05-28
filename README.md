# Nepal Tourism Management System

A full-stack web application for managing tourism services in Nepal. Features role-based dashboards, hotel and destination management, tour guide bookings, AI-powered recommendations, and integrated payment processing via Khalti and eSewa.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS, shadcn/ui, Vite |
| Backend | Django 5.2, Django REST Framework |
| Database | PostgreSQL (NeonDB serverless or local) |
| Media Storage | Cloudinary |
| Auth | JWT (SimpleJWT) + Google OAuth 2.0 |
| Payments | Khalti, eSewa (sandbox mode) |
| AI | Groq (llama-3.1-8b-instant) — recommendations + chatbot |
| Maps | Leaflet / React-Leaflet |
| Email | Gmail SMTP |

---

## Project Structure

```
Nepal-Tourism-Management-System/
├── backend/
│   ├── backend/                      # Django project config
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── tourism/                      # Main Django app
│   │   ├── models.py                 # All models: User, Destination, Hotel, Room, Booking, Package, Guide
│   │   ├── views.py                  # All API views
│   │   ├── serializers.py
│   │   ├── urls.py                   # API routes
│   │   ├── admin.py                  # Admin panel configuration
│   │   ├── khalti_integration.py
│   │   ├── esewa_integration.py
│   │   ├── management/commands/
│   │   │   ├── seed_destinations.py
│   │   │   ├── seed_hotels_rooms.py
│   │   │   └── sync_cloudinary_images.py
│   │   ├── migrations/
│   │   └── tests/
│   │       ├── test_unit.py
│   │       └── test_blackbox.py
│   ├── scripts/                      # Admin utility scripts
│   │   └── reset_provider_password.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                          # Environment variables (gitignored)
│   └── venv/                         # Python virtual environment (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── pages/                    # Page-level components (PascalCase)
│   │   │   ├── Home.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Tours.jsx
│   │   │   ├── Guides.jsx
│   │   │   ├── GuideDetail.jsx
│   │   │   ├── GuideDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ProviderDashboard.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── PaymentPage.jsx
│   │   │   ├── PaymentVerify.jsx
│   │   │   ├── EsewaSuccess.jsx
│   │   │   ├── EsewaFailure.jsx
│   │   │   └── user/
│   │   │       ├── DestinationDetail.jsx
│   │   │       └── DestinationResults.jsx
│   │   ├── components/               # Reusable UI components
│   │   │   ├── ui/                   # shadcn/ui primitives
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── AuthModal.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   ├── BookingModal.jsx
│   │   │   ├── GuideBookModal.jsx
│   │   │   ├── PackageBookingModal.jsx
│   │   │   ├── PackageManager.jsx
│   │   │   ├── RoomManager.jsx
│   │   │   └── DestinationShowcase.jsx
│   │   ├── services/                 # API service layer
│   │   │   ├── api.js                # Central axios instance + all service functions
│   │   │   ├── cloudinary.js         # Image upload helper
│   │   │   ├── khaltiService.js
│   │   │   └── esewaService.js
│   │   ├── lib/                      # Utilities and helpers
│   │   │   ├── utils.js
│   │   │   ├── dataSync.js
│   │   │   ├── roleNavigation.js
│   │   │   └── nepalTerrain.js
│   │   ├── config/
│   │   │   └── constants.js
│   │   ├── App.jsx                   # Root component with routing
│   │   └── main.jsx                  # Entry point
│   ├── public/assets/                # Static images for seeding
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── docs/                             # Documentation
├── MAP_INTEGRATION_VIVA_GUIDE.md
├── PAYMENT_SYSTEM_VIVA_GUIDE.md
└── README.md
```

---

## Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher and **npm**
- **Git**
- A **PostgreSQL** database — either:
  - **NeonDB** (free serverless cloud Postgres at neon.tech) — recommended, no local install needed
  - **Local PostgreSQL** 14+ (download from postgresql.org)
- A **Cloudinary** account (free at cloudinary.com)
- A **Groq** API key (free at console.groq.com) — for AI recommendations and chatbot

---

## Step-by-Step Setup

### 1. Clone the repository

```bash
git clone https://github.com/NamunaRegmi/Nepal-Tourism-Management-System.git
cd Nepal-Tourism-Management-System
```

---

### 2. Database setup

**Option A — NeonDB (recommended, no local install)**

1. Go to [neon.tech](https://neon.tech) and create a free project
2. From the project dashboard, copy the **Connection string** (it looks like `postgresql://user:pass@host/dbname?sslmode=require`)
3. You will paste this as `DATABASE_URL` in your `.env` file (see Step 4)

**Option B — Local PostgreSQL**

1. Install PostgreSQL from **postgresql.org/download/windows** (includes pgAdmin 4)
2. Open **pgAdmin 4** and create a database named `nepal_tourism`
3. Create a login role `tourism_user` with a password and grant it all privileges on `nepal_tourism`
4. You will use the individual `DB_*` variables in your `.env` file (see Step 4)

---

### 3. Cloudinary setup

1. Sign up for a free account at [cloudinary.com](https://cloudinary.com)
2. Go to your Dashboard → copy **Cloud name**, **API Key**, and **API Secret**

---

### 4. Backend setup

```cmd
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```env
# Google OAuth (get from https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Gmail SMTP — use an App Password, not your real password
# Generate at: https://myaccount.google.com/apppasswords
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password

# --- Database: pick ONE option ---

# Option A: NeonDB (or any cloud Postgres) — paste full connection string
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Option B: Local PostgreSQL — fill in individual values
DB_NAME=nepal_tourism
DB_USER=tourism_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Groq AI (free at https://console.groq.com)
GROQ_API_KEY=your_groq_api_key

# Khalti Payment (optional — defaults to test/sandbox keys)
# KHALTI_SECRET_KEY=your_khalti_secret_key
# KHALTI_PUBLIC_KEY=your_khalti_public_key

# eSewa Payment (optional — defaults to EPAYTEST sandbox)
# ESEWA_MERCHANT_ID=your_esewa_merchant_id
# ESEWA_MERCHANT_SECRET=your_esewa_merchant_secret
```

Run database migrations and create a superuser for the admin panel:

```cmd
python manage.py migrate
python manage.py createsuperuser
```

Start the backend server:

```cmd
python manage.py runserver
```

Backend runs at: **http://127.0.0.1:8000**  
Django Admin panel: **http://127.0.0.1:8000/admin/**

---

### 5. Frontend setup

Open a **new terminal** (keep the backend terminal running):

```cmd
cd frontend

npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

### 6. Seed sample data (optional)

With the backend virtual environment active and `manage.py` reachable:

```cmd
cd backend
venv\Scripts\activate

# Seed destinations
python manage.py seed_destinations

# Seed hotels and rooms
python manage.py seed_hotels_rooms

# Upload all existing images to Cloudinary
python manage.py sync_cloudinary_images

# Re-upload even images already on Cloudinary (force re-sync)
python manage.py sync_cloudinary_images --force
```

---

## Running the Project (Daily Use)

Once setup is complete, you only need two terminals:

**Terminal 1 — Backend**
```cmd
cd backend
venv\Scripts\activate
python manage.py runserver
```

**Terminal 2 — Frontend**
```cmd
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Django Admin Panel

Access the admin panel at **http://127.0.0.1:8000/admin/** using the superuser you created.

The following models are manageable from the admin panel:

| Model | What you can do |
|-------|----------------|
| **Users** | View/edit all users, filter by role |
| **Destinations** | Add/edit destinations with image preview and Cloudinary upload |
| **Hotels** | Add/edit hotels with provider assignment and image preview |
| **Rooms** | Add/edit rooms per hotel with image preview |
| **Packages** | Add/edit travel packages with multi-destination selector |
| **Bookings** | View all bookings, filter by status and payment method |
| **Tour Guide Profiles** | View/edit guide profiles with image preview |
| **Guide Bookings** | View all guide bookings, filter by status |

---

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
7. Copy the **Client ID** and **Client Secret** into `backend/.env`
8. The same Client ID must also be set in `frontend/src/main.jsx` for the Google login button

---

## User Roles

| Role | Access |
|------|--------|
| **User** | Browse destinations, book hotels/packages, hire guides, make payments |
| **Provider** | Manage own hotels, rooms, and packages |
| **Guide** | Create guide profile, manage bookings |
| **Admin** | Full access — manage users, destinations, all bookings |

Register with any role from the sign-up page. Use the Django admin panel at `/admin/` for full backend control.

---

## API Endpoints

Base URL: `http://127.0.0.1:8000/api/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register/` | Register new user |
| POST | `/auth/login/` | Login |
| POST | `/auth/google/` | Google OAuth login |
| GET | `/destinations/` | List destinations |
| GET | `/destinations/<id>/` | Destination detail |
| GET | `/destinations/<id>/recommendations/` | AI-powered similar destinations |
| GET | `/destinations/explore-recommendations/` | AI-powered explore page |
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
| POST | `/chat/` | AI tourism chatbot |
| POST | `/uploads/cloudinary-image/` | Upload image to Cloudinary |

---

## Payment Integration

Both payment gateways work in **sandbox/test mode** by default — no real money is charged.

- **Khalti**: Test credentials are built into `settings.py`. Use Khalti test accounts to simulate payments.
- **eSewa**: Defaults to `EPAYTEST` sandbox. Use eSewa test credentials to simulate payments.

To switch to production, set real keys in your `.env` file.

---

## Troubleshooting

**`python` not found** — use `python3` instead, or ensure Python is in your PATH.

**`venv\Scripts\activate` not recognized** — make sure you are in the `backend/` folder. On PowerShell, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once if scripts are blocked.

**Database connection error with NeonDB** — check your `DATABASE_URL` in `.env`. Make sure it ends with `?sslmode=require`. Do NOT include `channel_binding=require` — it is incompatible with NeonDB's pooler.

**Cloudinary images not loading** — run `python manage.py sync_cloudinary_images` to upload local images to Cloudinary.

**Google login not working** — verify that `GOOGLE_CLIENT_ID` in both `backend/.env` and `frontend/src/main.jsx` match exactly.

**Port 8000 already in use** — run the server on a different port: `python manage.py runserver 8001`

**Port 5173 already in use** — Vite will automatically try 5174, 5175, etc. Update `CORS_ALLOWED_ORIGINS` in `backend/backend/settings.py` if needed.

---

## Running in Production

This project already uses PostgreSQL and Cloudinary. For a production deployment you would additionally need to:

- Set `DEBUG = False` in `settings.py`
- Use a WSGI server like **Gunicorn** (Linux) or **Waitress** (Windows)
- Set `ALLOWED_HOSTS` to your real domain
- Set proper `CORS_ALLOWED_ORIGINS`
- Generate a strong `SECRET_KEY` and store it in `.env`
- Set `FRONTEND_BASE_URL` in `.env` to your deployed frontend URL
