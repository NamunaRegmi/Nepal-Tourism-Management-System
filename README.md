#  Nepal Tourism Management System

A full-stack web application for managing tourism services in Nepal, featuring user authentication, role-based dashboards, and destination management.

##  Features

-  **User Authentication**
  - Email/Password registration and login
  - Google OAuth 2.0 integration
  - Secure password reset via email
  
-  **Role-Based Access Control**
  - **Users**: Browse destinations and book tours
  - **Admins**: Manage users and view analytics
  - **Service Providers**: Manage tour offerings
  
-  **Admin Dashboard**
  - User management
  - Booking analytics
  - System overview

-  **Modern UI/UX**
  - Responsive design
  - Beautiful landing page
  - Interactive dashboards

##  Tech Stack

### Frontend
- **React** - JavaScript library for building user interfaces
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Axios** - Promise-based HTTP client
- **Lucide React** - Beautiful icon library

### Backend
- **Django** - High-level Python web framework
- **Django REST Framework** - Toolkit for building Web APIs
- **SQLite** - Lightweight database
- **JWT Authentication** - Secure token-based auth
- **Google OAuth 2.0** - Third-party authentication

### Other Tools
- **Gmail SMTP** - Email service for password resets
- **Git & GitHub** - Version control

##  Project Structure
```
TTMS/
├── backend/
│   ├── tourism/
│   │   ├── models.py          # Database models
│   │   ├── views.py           # API endpoints
│   │   ├── serializers.py     # Data serialization
│   │   └── urls.py            # URL routing
│   ├── manage.py
│   ├── db.sqlite3             # Database file
│   └── requirements.txt       # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Auth.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── ProviderDashboard.jsx
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── package.json           # Node dependencies
│   └── ...
│
└── README.md
```

##  Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 16+
- Git

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/NamunaRegmi/Nepal-Tourism-Management-System.git
cd Nepal-Tourism-Management-System
```

2. Create virtual environment and install dependencies:
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

3. Create `.env` file in backend folder with your credentials:
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
```

4. Run migrations and start server:
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend will run on: http://127.0.0.1:8000/

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

Frontend will run on: http://localhost:5173/

