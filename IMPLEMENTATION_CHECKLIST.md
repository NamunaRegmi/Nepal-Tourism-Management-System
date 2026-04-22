# RBAC Implementation Checklist

## ✅ Completed Backend Changes

- [x] Updated Hotel model to require provider field
- [x] Added limit_choices_to constraint for provider role
- [x] Enhanced ProviderHotelListView with better filtering
- [x] Created AdminHotelListView for admin access
- [x] Updated permission checks in HotelDetailView
- [x] Added admin hotel endpoint to URLs
- [x] Created migration to assign hotels to providers
- [x] Created migration to make provider field required
- [x] Created comprehensive documentation
- [x] Created test scripts for verification

## 📋 Required Steps to Deploy

### 1. Database Migration
```bash
cd Nepal-Tourism-Management-System/backend
python manage.py migrate
```

**Expected output:**
```
Running migrations:
  Applying tourism.0008_assign_hotels_to_providers... OK
  Applying tourism.0009_make_hotel_provider_required... OK
```

### 2. Verify Setup
```bash
python manage.py shell < scripts/verify_rbac_setup.py
```

**Expected output:**
```
✓ All hotels have providers assigned
✓ Total Providers: X
✓ Total Admins: X
✓ RBAC Setup Verified Successfully!
```

### 3. Create Test Users (if needed)
```bash
python manage.py shell
```

```python
from tourism.models import User

# Create provider
User.objects.create_user(
    username='provider1',
    email='provider1@example.com',
    password='provider123',
    role='provider'
)

# Create admin
User.objects.create_superuser(
    username='admin',
    email='admin@example.com',
    password='admin123',
    role='admin'
)
```

## 🔧 Frontend Changes Required

### 1. Provider Dashboard Component

**File to update:** `frontend/src/pages/ProviderDashboard.jsx` (or similar)

**Changes needed:**
```javascript
// Change from:
const response = await fetch('/api/destinations/1/hotels/');

// Change to:
const response = await fetch('/api/provider/hotels/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 2. Create Hotel Form

**File to update:** `frontend/src/components/CreateHotelForm.jsx` (or similar)

**Changes needed:**
```javascript
// Change endpoint from:
const response = await fetch('/api/destinations/${destinationId}/hotels/', {
  method: 'POST',
  // ...
});

// Change to:
const response = await fetch('/api/provider/hotels/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    destination_id: destinationId,
    name: hotelName,
    description: description,
    price_per_night: price,
    // ... other fields
  })
});
```

### 3. Admin Dashboard Component

**File to create/update:** `frontend/src/pages/AdminDashboard.jsx`

**Add new functionality:**
```javascript
const fetchAllHotels = async () => {
  const token = localStorage.getItem('access_token');
  const response = await fetch('/api/admin/hotels/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const hotels = await response.json();
  return hotels;
};
```

### 4. Update Hotel Component

**File to update:** `frontend/src/components/UpdateHotelForm.jsx` (or similar)

**Ensure proper authorization:**
```javascript
const updateHotel = async (hotelId, hotelData) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`/api/hotels/${hotelId}/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(hotelData)
  });
  
  if (response.status === 403) {
    alert('You can only update your own hotels');
    return;
  }
  
  return await response.json();
};
```

### 5. Delete Hotel Component

**File to update:** `frontend/src/components/HotelActions.jsx` (or similar)

**Add permission check:**
```javascript
const deleteHotel = async (hotelId) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`/api/hotels/${hotelId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 403) {
    alert('You can only delete your own hotels');
    return false;
  }
  
  return response.ok;
};
```

## 🧪 Testing Checklist

### Backend Testing

- [ ] Run migrations successfully
- [ ] Verify all hotels have providers
- [ ] Test provider can create hotel
- [ ] Test provider can view only their hotels
- [ ] Test provider can update only their hotels
- [ ] Test provider can delete only their hotels
- [ ] Test provider cannot access other providers' hotels
- [ ] Test admin can view all hotels
- [ ] Test admin can update any hotel
- [ ] Test admin can delete any hotel
- [ ] Test user cannot create/update/delete hotels

### Frontend Testing

- [ ] Provider dashboard shows only provider's hotels
- [ ] Provider can create new hotel
- [ ] Provider can edit their own hotel
- [ ] Provider can delete their own hotel
- [ ] Provider gets error when trying to edit other's hotel
- [ ] Admin dashboard shows all hotels
- [ ] Admin can edit any hotel
- [ ] Admin can delete any hotel
- [ ] User cannot access provider/admin features

### API Testing

Use these curl commands to test:

#### Test Provider Access
```bash
# Login as provider
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "provider1@example.com", "password": "provider123"}' \
  | jq -r '.access')

# Get provider's hotels
curl -X GET http://localhost:8000/api/provider/hotels/ \
  -H "Authorization: Bearer $TOKEN"

# Create hotel
curl -X POST http://localhost:8000/api/provider/hotels/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination_id": 1,
    "name": "Test Hotel",
    "description": "Test",
    "price_per_night": 5000,
    "currency": "NPR"
  }'
```

#### Test Admin Access
```bash
# Login as admin
ADMIN_TOKEN=$(curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' \
  | jq -r '.access')

# Get all hotels
curl -X GET http://localhost:8000/api/admin/hotels/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 📚 Documentation

All documentation has been created:

- [x] ROLE_BASED_ACCESS_CONTROL.md - Comprehensive RBAC guide
- [x] SETUP_RBAC.md - Setup and troubleshooting
- [x] RBAC_IMPLEMENTATION_SUMMARY.md - Implementation summary
- [x] scripts/README.md - Script documentation
- [x] IMPLEMENTATION_CHECKLIST.md - This file

## 🚀 Deployment Steps

1. **Backup Database**
   ```bash
   python manage.py dumpdata > backup.json
   ```

2. **Pull Latest Code**
   ```bash
   git pull origin main
   ```

3. **Install Dependencies** (if any new ones)
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Migrations**
   ```bash
   python manage.py migrate
   ```

5. **Verify Setup**
   ```bash
   python manage.py shell < scripts/verify_rbac_setup.py
   ```

6. **Restart Server**
   ```bash
   # Development
   python manage.py runserver
   
   # Production (example with gunicorn)
   gunicorn backend.wsgi:application
   ```

7. **Update Frontend**
   - Update API endpoints as documented above
   - Test all provider and admin features
   - Deploy frontend changes

## ⚠️ Important Notes

1. **Backup First**: Always backup your database before running migrations
2. **Test Environment**: Test in development environment first
3. **Provider Assignment**: Existing hotels will be assigned to the first available provider
4. **No Rollback**: Once migrated, provider field cannot be made nullable again without data loss
5. **Frontend Updates**: Frontend must be updated to use new endpoints

## 🐛 Common Issues and Solutions

### Issue: Migration fails
**Solution:** Ensure at least one provider exists before running migrations

### Issue: Hotels not showing
**Solution:** Check that you're using `/api/provider/hotels/` endpoint

### Issue: Permission denied
**Solution:** Verify user role and authentication token

### Issue: Provider can see other hotels
**Solution:** Ensure using correct endpoint, not `/api/admin/hotels/`

## ✅ Final Verification

After completing all steps, verify:

```bash
# Run comprehensive test
python manage.py shell < scripts/test_rbac.py

# Check API endpoints
curl http://localhost:8000/api/provider/hotels/ -H "Authorization: Bearer $TOKEN"
curl http://localhost:8000/api/admin/hotels/ -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section in SETUP_RBAC.md
2. Review the detailed documentation in ROLE_BASED_ACCESS_CONTROL.md
3. Run the verification script to identify issues
4. Check server logs for error messages

## 🎉 Success Criteria

The implementation is successful when:
- ✅ All migrations run without errors
- ✅ Verification script passes all checks
- ✅ Provider can manage only their own hotels
- ✅ Admin can manage all hotels
- ✅ Users can view but not modify hotels
- ✅ No permission errors in normal operations
- ✅ Frontend displays correct data for each role

---

**Last Updated:** 2024
**Version:** 1.0
