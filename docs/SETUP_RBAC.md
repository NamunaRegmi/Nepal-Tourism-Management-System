# Setup Guide - Role-Based Access Control

## Quick Setup

Follow these steps to implement the role-based access control fixes:

### Step 1: Apply Database Migrations

```bash
cd Nepal-Tourism-Management-System/backend
python manage.py migrate
```

This will:
- Assign existing hotels to providers
- Make the provider field required for all hotels

### Step 2: Verify the Setup

Run the test script to verify everything is working:

```bash
python manage.py shell < scripts/test_rbac.py
```

Or manually:

```bash
python manage.py shell
>>> exec(open('scripts/test_rbac.py').read())
```

### Step 3: Create Test Users (if needed)

If you need to create test users for each role:

```bash
python manage.py shell
```

Then run:

```python
from tourism.models import User

# Create a provider
provider = User.objects.create_user(
    username='provider1',
    email='provider1@example.com',
    password='provider123',
    role='provider',
    first_name='John',
    last_name='Provider'
)

# Create an admin
admin = User.objects.create_superuser(
    username='admin',
    email='admin@example.com',
    password='admin123',
    role='admin'
)

# Create a regular user
user = User.objects.create_user(
    username='traveler1',
    email='traveler1@example.com',
    password='user123',
    role='user',
    first_name='Jane',
    last_name='Traveler'
)

print("Test users created successfully!")
```

### Step 4: Test the API Endpoints

#### Test Provider Access

1. Login as provider:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "provider1@example.com", "password": "provider123"}'
```

2. Get provider's hotels:
```bash
curl -X GET http://localhost:8000/api/provider/hotels/ \
  -H "Authorization: Bearer <access_token>"
```

3. Create a hotel:
```bash
curl -X POST http://localhost:8000/api/provider/hotels/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "destination_id": 1,
    "name": "Test Hotel",
    "description": "A test hotel",
    "price_per_night": 5000,
    "currency": "NPR",
    "amenities": ["WiFi", "Parking"],
    "contact_number": "+977-1-234567",
    "email": "info@testhotel.com",
    "address": "Kathmandu, Nepal"
  }'
```

#### Test Admin Access

1. Login as admin:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

2. Get all hotels:
```bash
curl -X GET http://localhost:8000/api/admin/hotels/ \
  -H "Authorization: Bearer <access_token>"
```

### Step 5: Update Frontend

Update your frontend to use the correct endpoints:

#### Provider Dashboard
```javascript
// In your provider dashboard component
const fetchProviderHotels = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch('http://localhost:8000/api/provider/hotels/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const hotels = await response.json();
  return hotels;
};
```

#### Admin Dashboard
```javascript
// In your admin dashboard component
const fetchAllHotels = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch('http://localhost:8000/api/admin/hotels/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const hotels = await response.json();
  return hotels;
};
```

## Troubleshooting

### Issue: Hotels not showing in provider dashboard

**Solution:**
1. Check that the user's role is 'provider'
2. Verify hotels have the correct provider_id:
```python
python manage.py shell
>>> from tourism.models import Hotel
>>> Hotel.objects.filter(provider__isnull=True).count()
```

If there are hotels without a provider, run:
```python
>>> from tourism.models import User, Hotel
>>> provider = User.objects.filter(role='provider').first()
>>> Hotel.objects.filter(provider__isnull=True).update(provider=provider)
```

### Issue: Migration fails

**Solution:**
If the migration fails because hotels have no provider:

1. First, ensure at least one provider exists:
```python
python manage.py shell
>>> from tourism.models import User
>>> User.objects.filter(role='provider').exists()
```

2. If no provider exists, create one:
```python
>>> User.objects.create_user(
...     username='default_provider',
...     email='provider@example.com',
...     password='changeme123',
...     role='provider'
... )
```

3. Then run migrations again:
```bash
python manage.py migrate
```

### Issue: Permission denied when creating hotels

**Solution:**
1. Verify the user's role is 'provider' or 'admin'
2. Check that the authentication token is valid
3. Ensure the endpoint is correct (`/api/provider/hotels/` for providers)

### Issue: Provider can see other providers' hotels

**Solution:**
1. Verify you're using the correct endpoint (`/api/provider/hotels/` not `/api/admin/hotels/`)
2. Check the backend filtering logic in `ProviderHotelListView`
3. Clear browser cache and reload

## API Endpoint Summary

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/provider/hotels/` | GET | Provider | Get provider's own hotels |
| `/api/provider/hotels/` | POST | Provider | Create new hotel |
| `/api/hotels/<id>/` | PUT | Provider/Admin | Update hotel |
| `/api/hotels/<id>/` | DELETE | Provider/Admin | Delete hotel |
| `/api/admin/hotels/` | GET | Admin | Get all hotels |
| `/api/destinations/<id>/hotels/` | GET | Public | Get hotels by destination |

## Next Steps

1. Update your frontend components to use the correct endpoints
2. Add proper error handling for permission denied responses
3. Implement UI to show provider-specific hotels in the dashboard
4. Add admin interface to manage all hotels
5. Test thoroughly with different user roles

## Support

For more information, see:
- [ROLE_BASED_ACCESS_CONTROL.md](./ROLE_BASED_ACCESS_CONTROL.md) - Detailed RBAC documentation
- [DOCUMENTATION.md](./DOCUMENTATION.md) - General system documentation
