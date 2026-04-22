# RBAC Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Nepal Tourism System                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │  Provider   │     │    Admin    │
│ (Traveler)  │     │  (Hotel)    │     │  (System)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                    │
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────────────────────────────────────────────┐
│                   API Endpoints                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  User Endpoints:                                     │
│  • GET /api/destinations/<id>/hotels/  (View)       │
│  • GET /api/hotels/<id>/               (View)       │
│  • POST /api/bookings/                 (Book)       │
│                                                       │
│  Provider Endpoints:                                 │
│  • GET /api/provider/hotels/           (List Own)   │
│  • POST /api/provider/hotels/          (Create)     │
│  • PUT /api/hotels/<id>/               (Update Own) │
│  • DELETE /api/hotels/<id>/            (Delete Own) │
│                                                       │
│  Admin Endpoints:                                    │
│  • GET /api/admin/hotels/              (List All)   │
│  • PUT /api/hotels/<id>/               (Update Any) │
│  • DELETE /api/hotels/<id>/            (Delete Any) │
│                                                       │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│                  Permission Layer                     │
├──────────────────────────────────────────────────────┤
│                                                       │
│  • IsAuthenticated - Check JWT token                │
│  • Role Verification - Check user.role              │
│  • Ownership Check - Verify hotel.provider          │
│  • Admin Override - Allow admin full access         │
│                                                       │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│                   Database Layer                      │
├──────────────────────────────────────────────────────┤
│                                                       │
│  User Model:                                         │
│  ├─ id                                               │
│  ├─ username                                         │
│  ├─ email                                            │
│  └─ role (user/provider/admin)                      │
│                                                       │
│  Hotel Model:                                        │
│  ├─ id                                               │
│  ├─ provider (FK → User) [REQUIRED]                 │
│  ├─ destination (FK → Destination)                  │
│  ├─ name                                             │
│  ├─ description                                      │
│  ├─ price_per_night                                 │
│  └─ is_active                                        │
│                                                       │
│  Destination Model:                                  │
│  ├─ id                                               │
│  ├─ name                                             │
│  ├─ province                                         │
│  └─ description                                      │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## Data Flow

### Provider Creates Hotel

```
Provider → POST /api/provider/hotels/
           ↓
    Check Authentication (JWT)
           ↓
    Verify role == 'provider'
           ↓
    Auto-assign provider = request.user
           ↓
    Save to Database
           ↓
    Return created hotel
```

### Provider Views Hotels

```
Provider → GET /api/provider/hotels/
           ↓
    Check Authentication (JWT)
           ↓
    Verify role == 'provider'
           ↓
    Filter: Hotel.objects.filter(provider=request.user)
           ↓
    Return filtered hotels
```

### Admin Views All Hotels

```
Admin → GET /api/admin/hotels/
        ↓
    Check Authentication (JWT)
        ↓
    Verify role == 'admin'
        ↓
    Query: Hotel.objects.all()
        ↓
    Return all hotels
```

### Provider Updates Hotel

```
Provider → PUT /api/hotels/<id>/
           ↓
    Check Authentication (JWT)
           ↓
    Get hotel by ID
           ↓
    Check: hotel.provider == request.user
           ↓
    If YES: Update hotel
    If NO: Return 403 Forbidden
```

## Permission Matrix

```
┌──────────────┬──────────┬──────────┬──────────┐
│   Action     │   User   │ Provider │  Admin   │
├──────────────┼──────────┼──────────┼──────────┤
│ View All     │    ❌    │    ❌    │    ✅    │
│ View Own     │    ❌    │    ✅    │    ✅    │
│ View Public  │    ✅    │    ✅    │    ✅    │
│ Create       │    ❌    │    ✅    │    ✅    │
│ Update Own   │    ❌    │    ✅    │    ✅    │
│ Update Any   │    ❌    │    ❌    │    ✅    │
│ Delete Own   │    ❌    │    ✅    │    ✅    │
│ Delete Any   │    ❌    │    ❌    │    ✅    │
└──────────────┴──────────┴──────────┴──────────┘
```

## Database Relationships

```
User (Provider)
    │
    │ 1:N
    ▼
  Hotel ──────┐
    │         │ N:1
    │ 1:N     ▼
    │     Destination
    ▼
  Room
    │
    │ 1:N
    ▼
 Booking ────┐
             │ N:1
             ▼
         User (Traveler)
```

## Security Layers

```
┌─────────────────────────────────────────┐
│         Layer 1: Authentication         │
│  • JWT Token Validation                 │
│  • Token Expiry Check                   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Layer 2: Authorization          │
│  • Role Verification                    │
│  • Permission Check                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Layer 3: Ownership              │
│  • Provider Ownership Check             │
│  • Admin Override                       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Layer 4: Data Access            │
│  • Filtered Queries                     │
│  • Soft Deletes                         │
└─────────────────────────────────────────┘
```

## Request Flow Example

### Scenario: Provider Updates Their Hotel

```
1. Frontend Request
   ↓
   PUT /api/hotels/5/
   Headers: { Authorization: "Bearer eyJ..." }
   Body: { "name": "Updated Hotel Name" }

2. Django Middleware
   ↓
   • Parse JWT token
   • Extract user from token
   • Attach user to request

3. View Layer (HotelDetailView.put)
   ↓
   • Check: request.user.is_authenticated ✓
   • Get hotel: Hotel.objects.get(pk=5)
   • Check: request.user.role in ['admin', 'provider'] ✓
   • Check: hotel.provider_id == request.user.id ✓

4. Serializer Layer
   ↓
   • Validate input data
   • Check field constraints
   • Prepare for save

5. Database Layer
   ↓
   • Update hotel record
   • Set updated_at timestamp
   • Commit transaction

6. Response
   ↓
   200 OK
   { "id": 5, "name": "Updated Hotel Name", ... }
```

## Error Handling Flow

```
Request → Authentication Failed
          ↓
          401 Unauthorized
          { "error": "Authentication required" }

Request → Wrong Role
          ↓
          403 Forbidden
          { "error": "Only providers can access this" }

Request → Not Owner
          ↓
          403 Forbidden
          { "error": "You can only update your own hotels" }

Request → Not Found
          ↓
          404 Not Found
          { "error": "Hotel not found" }

Request → Invalid Data
          ↓
          400 Bad Request
          { "error": "Invalid data", "details": {...} }
```

## Migration Strategy

```
Current State:
  Hotel.provider = NULL (allowed)

Migration 0008:
  ↓
  Assign all NULL providers to default provider
  ↓
  Hotel.provider = User(provider) (all assigned)

Migration 0009:
  ↓
  ALTER TABLE hotel
  MODIFY provider_id NOT NULL
  ↓
  Hotel.provider = REQUIRED

Final State:
  Hotel.provider = NOT NULL (enforced)
```

## Component Interaction

```
┌──────────────┐
│   Frontend   │
│  (React)     │
└──────┬───────┘
       │ HTTP/REST
       ▼
┌──────────────┐
│   Backend    │
│  (Django)    │
└──────┬───────┘
       │ ORM
       ▼
┌──────────────┐
│  Database    │
│  (SQLite)    │
└──────────────┘
```

## Key Design Decisions

1. **Automatic Provider Assignment**
   - Provider field set automatically on creation
   - Prevents manual manipulation
   - Ensures data integrity

2. **Soft Deletes**
   - Hotels marked as inactive instead of deleted
   - Maintains referential integrity
   - Allows data recovery

3. **Role-Based Filtering**
   - Filtering at database level
   - Efficient query performance
   - Prevents data leakage

4. **Admin Override**
   - Admins bypass ownership checks
   - Full system management capability
   - Audit trail maintained

5. **Separate Endpoints**
   - Provider-specific endpoints
   - Admin-specific endpoints
   - Clear separation of concerns

## Performance Considerations

```
Optimization Techniques:

1. Select Related
   Hotel.objects.select_related('provider', 'destination')
   • Reduces N+1 queries
   • Single JOIN query

2. Prefetch Related
   Hotel.objects.prefetch_related('rooms')
   • Efficient for many-to-many
   • Separate optimized queries

3. Database Indexing
   • ForeignKey fields auto-indexed
   • Fast lookups by provider
   • Fast lookups by destination

4. Query Filtering
   • Filter at database level
   • Reduce data transfer
   • Faster response times
```

## Scalability

```
Current: Single Server
  ├─ Django Application
  ├─ SQLite Database
  └─ Static Files

Future: Distributed System
  ├─ Load Balancer
  ├─ Multiple Django Instances
  ├─ PostgreSQL Database (Primary)
  ├─ PostgreSQL Database (Replica)
  ├─ Redis Cache
  └─ CDN for Static Files
```

## Monitoring Points

```
Key Metrics to Monitor:

1. Authentication
   • Failed login attempts
   • Token expiry rate
   • Active sessions

2. Authorization
   • Permission denied count
   • Role distribution
   • Access patterns

3. Performance
   • Query execution time
   • API response time
   • Database connections

4. Data Integrity
   • Hotels without provider
   • Orphaned records
   • Constraint violations
```
