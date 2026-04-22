# Role-Based Access Control (RBAC) - Hotel Management

## Overview

This document explains the role-based access control system for hotel management in the Nepal Tourism Management System.

## User Roles

### 1. User (Traveler)
- Can view all destinations and hotels
- Can book hotels and packages
- Cannot create or manage hotels

### 2. Travel Service Provider
- Can CREATE, READ, UPDATE, DELETE only their own hotels
- Hotels are automatically linked to the logged-in provider upon creation
- Provider dashboard shows only hotels created by that provider
- Cannot view or modify hotels from other providers

### 3. Admin
- Can view ALL hotels from all providers
- Can manage (approve/edit/delete) any hotel
- Has full control over users and hotel data
- Can access system-wide statistics

## API Endpoints

### Provider Endpoints

#### Get Provider's Hotels
```
GET /api/provider/hotels/
Authorization: Bearer <token>
```
Returns only hotels belonging to the authenticated provider.

#### Create Hotel (Provider)
```
POST /api/provider/hotels/
Authorization: Bearer <token>
Content-Type: application/json

{
  "destination_id": 1,
  "name": "Mountain View Hotel",
  "description": "Beautiful hotel with mountain views",
  "price_per_night": 5000,
  "currency": "NPR",
  "amenities": ["WiFi", "Parking", "Restaurant"],
  "contact_number": "+977-1-234567",
  "email": "info@mountainview.com",
  "address": "Pokhara, Nepal"
}
```
The `provider` field is automatically set to the authenticated user.

#### Update Hotel (Provider)
```
PUT /api/hotels/<hotel_id>/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Hotel Name",
  "price_per_night": 6000
}
```
Providers can only update their own hotels.

#### Delete Hotel (Provider)
```
DELETE /api/hotels/<hotel_id>/
Authorization: Bearer <token>
```
Soft deletes the hotel (sets `is_active=False`). Providers can only delete their own hotels.

### Admin Endpoints

#### Get All Hotels (Admin)
```
GET /api/admin/hotels/
Authorization: Bearer <token>
```
Returns all hotels from all providers.

#### Update Any Hotel (Admin)
```
PUT /api/hotels/<hotel_id>/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Admin Updated Name",
  "is_active": true
}
```
Admins can update any hotel regardless of provider.

#### Delete Any Hotel (Admin)
```
DELETE /api/hotels/<hotel_id>/
Authorization: Bearer <token>
```
Admins can delete any hotel.

### Public Endpoints

#### Get Hotels by Destination
```
GET /api/destinations/<destination_id>/hotels/
```
Returns all active hotels for a specific destination (no authentication required).

#### Get Hotel Details
```
GET /api/hotels/<hotel_id>/
```
Returns details of a specific hotel (no authentication required).

## Database Schema

### Hotel Model
```python
class Hotel(models.Model):
    provider = ForeignKey(User, on_delete=CASCADE, related_name='hotels')
    destination = ForeignKey(Destination, on_delete=CASCADE)
    name = CharField(max_length=200)
    description = TextField()
    price_per_night = DecimalField(max_digits=10, decimal_places=2)
    currency = CharField(max_length=3, default='USD')
    amenities = JSONField(default=list)
    contact_number = CharField(max_length=20)
    email = EmailField()
    address = TextField()
    total_rooms = IntegerField(default=0)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

## Permission Logic

### View Permissions
- **ProviderHotelListView**: Filters hotels by `provider=request.user`
- **AdminHotelListView**: Returns all hotels without filtering
- **HotelListView**: Returns all active hotels for a destination (public)

### Create Permissions
- Only users with `role='provider'` or `role='admin'` can create hotels
- The `provider` field is automatically set to `request.user` during creation

### Update Permissions
- Providers can only update hotels where `hotel.provider == request.user`
- Admins can update any hotel

### Delete Permissions
- Providers can only delete hotels where `hotel.provider == request.user`
- Admins can delete any hotel
- Deletion is soft (sets `is_active=False`)

## Frontend Integration

### Provider Dashboard
```javascript
// Fetch provider's hotels
const response = await fetch('/api/provider/hotels/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const hotels = await response.json();
```

### Admin Dashboard
```javascript
// Fetch all hotels
const response = await fetch('/api/admin/hotels/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const allHotels = await response.json();
```

### Create Hotel (Provider)
```javascript
const response = await fetch('/api/provider/hotels/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    destination_id: 1,
    name: 'New Hotel',
    description: 'Hotel description',
    price_per_night: 5000,
    currency: 'NPR',
    amenities: ['WiFi', 'Parking'],
    contact_number: '+977-1-234567',
    email: 'info@hotel.com',
    address: 'Kathmandu, Nepal'
  })
});
```

## Migration Steps

To apply the changes to your database:

```bash
cd Nepal-Tourism-Management-System/backend
python manage.py migrate
```

This will:
1. Assign existing hotels without a provider to a default provider
2. Make the `provider` field required for all hotels

## Testing

### Test Provider Access
1. Login as a provider
2. Create a hotel via `/api/provider/hotels/`
3. Verify the hotel appears in `/api/provider/hotels/`
4. Try to access another provider's hotel - should be denied

### Test Admin Access
1. Login as an admin
2. Access `/api/admin/hotels/` - should see all hotels
3. Update any hotel - should succeed
4. Delete any hotel - should succeed

### Test User Access
1. Login as a regular user
2. Try to create a hotel - should be denied
3. View hotels by destination - should succeed
4. Book a hotel - should succeed

## Security Considerations

1. **Authentication Required**: All create/update/delete operations require authentication
2. **Role Verification**: Each endpoint checks the user's role before allowing operations
3. **Provider Isolation**: Providers can only access their own hotels
4. **Admin Override**: Admins have full access for system management
5. **Soft Deletes**: Hotels are soft-deleted to maintain data integrity

## Troubleshooting

### Hotels not showing in provider dashboard
- Verify the user's role is set to 'provider'
- Check that hotels have the correct `provider_id` in the database
- Ensure the authentication token is valid

### Permission denied errors
- Verify the user's role matches the required role for the endpoint
- Check that the provider owns the hotel they're trying to modify
- Ensure the authentication token is included in the request

### Hotels showing for wrong provider
- Check the database to verify `provider_id` is correctly set
- Ensure the frontend is calling the correct endpoint (`/api/provider/hotels/`)
- Verify the authentication token belongs to the correct user
