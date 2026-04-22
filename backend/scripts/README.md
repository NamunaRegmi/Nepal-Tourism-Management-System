# Backend Scripts

This directory contains utility scripts for managing and testing the Nepal Tourism Management System.

## RBAC Scripts

### verify_rbac_setup.py
Quick verification script to check if RBAC is properly configured.

**Usage:**
```bash
python manage.py shell < scripts/verify_rbac_setup.py
```

**What it checks:**
- All hotels have providers assigned
- Providers exist in the system
- Admin users exist
- Provider hotel distribution

### test_rbac.py
Comprehensive test suite for role-based access control.

**Usage:**
```bash
python manage.py shell < scripts/test_rbac.py
```

**What it tests:**
- User role distribution
- Hotel-provider relationships
- Provider isolation
- Admin access capabilities
- Destination coverage

## Data Management Scripts

### seed_data.py
Seeds the database with sample destinations, hotels, and users.

**Usage:**
```bash
python manage.py shell < scripts/seed_data.py
```

### list_destinations.py
Lists all destinations in the system.

**Usage:**
```bash
python manage.py shell < scripts/list_destinations.py
```

### update_images.py
Updates image URLs for destinations and hotels.

**Usage:**
```bash
python manage.py shell < scripts/update_images.py
```

## Payment Testing Scripts

### test_khalti.py
Tests Khalti payment integration.

**Usage:**
```bash
python manage.py shell < scripts/test_khalti.py
```

### test_esewa.py
Tests eSewa payment integration.

**Usage:**
```bash
python manage.py shell < scripts/test_esewa.py
```

## API Testing Scripts

### verify_api.py
Verifies API endpoints are working correctly.

**Usage:**
```bash
python manage.py shell < scripts/verify_api.py
```

### test_script.py
General testing script for various features.

**Usage:**
```bash
python manage.py shell < scripts/test_script.py
```

## Running Scripts

### Method 1: Using shell redirect
```bash
python manage.py shell < scripts/script_name.py
```

### Method 2: Using exec in shell
```bash
python manage.py shell
>>> exec(open('scripts/script_name.py').read())
```

### Method 3: Direct execution (if script has proper setup)
```bash
python scripts/script_name.py
```

## Creating New Scripts

When creating new scripts, include this boilerplate:

```python
#!/usr/bin/env python
"""
Script description here
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Your imports here
from tourism.models import User, Hotel, Destination

def main():
    # Your code here
    pass

if __name__ == '__main__':
    main()
```

## Troubleshooting

### Script not finding Django
Make sure you're running from the backend directory:
```bash
cd Nepal-Tourism-Management-System/backend
python manage.py shell < scripts/script_name.py
```

### Import errors
Ensure all required packages are installed:
```bash
pip install -r requirements.txt
```

### Database errors
Make sure migrations are up to date:
```bash
python manage.py migrate
```
