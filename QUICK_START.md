# Quick Start - RBAC Implementation

## 🚀 Get Started in 5 Minutes

### Step 1: Run Migrations (2 minutes)
```bash
cd Nepal-Tourism-Management-System/backend
python manage.py migrate
```

### Step 2: Verify Setup (1 minute)
```bash
python manage.py shell < scripts/verify_rbac_setup.py
```

### Step 3: Test the API (2 minutes)

#### Create a test provider:
```bash
python manage.py shell
```
```python
from tourism.models import User
User.objects.create_user(
    username='testprovider',
    email='provider@test.com',
    password='test123',
    role='provider'
)
exit()
```

#### Test provider endpoint:
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "provider@test.com", "password": "test123"}'

# Copy the access token from response, then:
curl -X GET http://localhost:8000/api/provider/hotels/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## ✅ What's Fixed

1. **Provider Dashboard** - Now shows only provider's own hotels
2. **Hotel Creation** - Automatically links to logged-in provider
3. **Role-Based Access** - Providers can only manage their hotels
4. **Admin Access** - Admins can manage all hotels

## 📋 Key Endpoints

| Endpoint | Role | Purpose |
|----------|------|---------|
| `GET /api/provider/hotels/` | Provider | Get my hotels |
| `POST /api/provider/hotels/` | Provider | Create hotel |
| `GET /api/admin/hotels/` | Admin | Get all hotels |
| `PUT /api/hotels/<id>/` | Provider/Admin | Update hotel |
| `DELETE /api/hotels/<id>/` | Provider/Admin | Delete hotel |

## 🔧 Frontend Update Required

Update your provider dashboard to use the new endpoint:

```javascript
// OLD - Don't use this
const hotels = await fetch('/api/destinations/1/hotels/');

// NEW - Use this instead
const hotels = await fetch('/api/provider/hotels/', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 📚 Full Documentation

- **Setup Guide**: `docs/SETUP_RBAC.md`
- **API Reference**: `docs/ROLE_BASED_ACCESS_CONTROL.md`
- **Implementation Details**: `RBAC_IMPLEMENTATION_SUMMARY.md`
- **Complete Checklist**: `IMPLEMENTATION_CHECKLIST.md`

## 🆘 Need Help?

Run the comprehensive test:
```bash
python manage.py shell < scripts/test_rbac.py
```

Check troubleshooting guide: `docs/SETUP_RBAC.md`

## ✨ That's It!

Your role-based access control is now properly configured. Providers can manage their own hotels, and admins have full system control.
