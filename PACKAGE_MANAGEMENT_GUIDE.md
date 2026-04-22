# Package Management for Travel Service Providers

## Overview
Travel Service Providers can now fully manage their tour packages through a dedicated dashboard interface with complete CRUD (Create, Read, Update, Delete) operations.

## Features

### 1. Package Management Dashboard
- **Location**: Provider Dashboard → "Tour Packages" tab
- **Access**: Available to users with "provider" role
- **Functionality**: Full CRUD operations for tour packages

### 2. Package Information
Each package includes:
- **Name**: Package title (e.g., "Everest Base Camp Trek")
- **Destination**: Location/region (e.g., "Everest Region")
- **Price**: Cost in Nepali Rupees (Rs.)
- **Duration**: Number of days
- **Max People**: Maximum group size
- **Description**: Detailed package overview
- **Itinerary**: Day-by-day schedule
- **Included Services**: What's covered (accommodation, meals, guide, etc.)
- **Image**: Package photo (Cloudinary upload or URL)

### 3. CRUD Operations

#### Create Package
1. Click "Add Package" button
2. Fill in all required fields (marked with *)
3. Upload image or provide image URL
4. Click "Add Package" to save

#### Read/View Packages
- View all your packages in a grid layout
- Search by name, destination, or description
- See package details including price, duration, and capacity

#### Update Package
1. Click the edit icon on any package card
2. Modify the fields you want to change
3. Click "Update Package" to save changes

#### Delete Package
1. Click the delete icon on any package card
2. Confirm deletion in the popup
3. Package will be soft-deleted (marked as inactive)

### 4. Image Management
- **Cloudinary Upload**: Upload images directly (requires Cloudinary env vars)
- **URL Input**: Provide external image URL
- **Preview**: See image preview before saving

## Backend API Endpoints

### Provider Endpoints
- `GET /api/provider/packages/` - List provider's packages
- `POST /api/provider/packages/` - Create new package

### Package Detail Endpoints
- `GET /api/packages/{id}/` - Get package details
- `PUT /api/packages/{id}/` - Update package (provider/admin only)
- `DELETE /api/packages/{id}/` - Delete package (provider/admin only)

## Permissions

### Provider Role
- Can CREATE packages (automatically assigned to them)
- Can READ only their own packages
- Can UPDATE only their own packages
- Can DELETE only their own packages

### Admin Role
- Can view ALL packages
- Can update ANY package
- Can delete ANY package

### User Role
- Can only VIEW active packages (public endpoint)
- Cannot create, update, or delete packages

## Technical Implementation

### Frontend Components
- **PackageManager.jsx**: Main package management component
- **providerDashboard.jsx**: Updated with "Tour Packages" tab

### Backend Views
- **ProviderPackageListView**: Handles GET (list) and POST (create)
- **PackageDetailView**: Handles GET, PUT, DELETE for individual packages

### Data Flow
1. Provider logs in with credentials
2. Navigates to Provider Dashboard → Tour Packages
3. Performs CRUD operations
4. Backend validates permissions and ownership
5. Changes reflected immediately in the UI

## Usage Instructions

### For Providers
1. **Login**: Use provider credentials (e.g., provider@example.com / provider123)
2. **Navigate**: Go to Provider Dashboard
3. **Access Packages**: Click "Tour Packages" in the sidebar
4. **Manage**: Add, edit, or delete your tour packages

### For Admins
- Admins can manage all packages through the admin dashboard
- Full control over all provider packages

## Sample Package Data
The system includes 10 pre-seeded packages:
- Everest Base Camp Trek
- Annapurna Circuit Trek
- Kathmandu Valley Cultural Tour
- Chitwan Jungle Safari
- Pokhara Adventure Package
- Langtang Valley Trek
- Upper Mustang Expedition
- Rara Lake Trek
- Manaslu Circuit Trek
- Lumbini Pilgrimage Tour

## Notes
- All packages are automatically linked to the logged-in provider
- Packages appear on the public Tours page (ToursNew.jsx)
- Soft delete: Deleted packages are marked inactive, not removed from database
- Image upload requires Cloudinary configuration (VITE_CLOUDINARY_CLOUD_NAME, etc.)
