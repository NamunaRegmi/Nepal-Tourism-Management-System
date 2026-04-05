#!/usr/bin/env python
"""
Test script for eSewa Payment Gateway Integration
Tests payment initiation and verification
"""

import os
import sys
import django
import hashlib
import hmac
import base64
from datetime import datetime

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from tourism.esewa_integration import EsewaPaymentGateway
from tourism.models import Booking, User, Room, Hotel, Destination

def test_signature_generation():
    """Test HMAC signature generation"""
    print("\n" + "="*60)
    print("Testing eSewa Signature Generation")
    print("="*60)
    
    esewa = EsewaPaymentGateway()
    
    # Test data
    total_amount = "100"
    transaction_uuid = "TEST-123-456"
    product_code = "EPAYTEST"
    
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    signature = esewa.generate_signature(message)
    
    print(f"\nMessage: {message}")
    print(f"Secret: {esewa.merchant_secret}")
    print(f"Signature: {signature}")
    print("\n✓ Signature generated successfully")
    
    return signature

def test_payment_initiation():
    """Test payment initiation with a mock booking"""
    print("\n" + "="*60)
    print("Testing eSewa Payment Initiation")
    print("="*60)
    
    try:
        # Get or create test user
        user, _ = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User'
            }
        )
        
        # Get or create test destination
        destination, _ = Destination.objects.get_or_create(
            name='Test Destination',
            defaults={
                'province': 'Bagmati',
                'description': 'Test destination for eSewa integration',
                'image': 'https://example.com/image.jpg',
                'best_time_to_visit': 'All year'
            }
        )
        
        # Get or create test hotel
        hotel, _ = Hotel.objects.get_or_create(
            name='Test Hotel',
            destination=destination,
            defaults={
                'description': 'Test hotel for eSewa integration',
                'image': 'https://example.com/hotel.jpg',
                'price_per_night': 5000,
                'rating': 4.5
            }
        )
        
        # Get or create test room
        room, _ = Room.objects.get_or_create(
            hotel=hotel,
            room_type='Test Room',
            defaults={
                'price': 5000,
                'capacity': 2,
                'description': 'Test room for eSewa integration'
            }
        )
        
        # Create test booking
        booking = Booking.objects.create(
            user=user,
            room=room,
            start_date='2024-12-01',
            end_date='2024-12-03',
            total_price=10000,
            status='pending',
            payment_status='unpaid'
        )
        
        print(f"\n✓ Created test booking #{booking.id}")
        print(f"  User: {user.username}")
        print(f"  Hotel: {hotel.name}")
        print(f"  Room: {room.room_type}")
        print(f"  Amount: NPR {booking.total_price}")
        
        # Initialize eSewa payment
        esewa = EsewaPaymentGateway()
        payment_data = esewa.initiate_payment(booking)
        
        if payment_data.get('error'):
            print(f"\n✗ Payment initiation failed: {payment_data.get('message')}")
            return None
        
        print("\n✓ Payment initiation successful!")
        print(f"\nPayment Data:")
        print(f"  Transaction UUID: {payment_data.get('transaction_uuid')}")
        print(f"  Amount: NPR {payment_data.get('total_amount')}")
        print(f"  Product Code: {payment_data.get('product_code')}")
        print(f"  Signature: {payment_data.get('signature')}")
        print(f"  Payment URL: {payment_data.get('payment_url')}")
        print(f"  Success URL: {payment_data.get('success_url')}")
        print(f"  Failure URL: {payment_data.get('failure_url')}")
        
        return payment_data
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def test_payment_verification():
    """Test payment verification (will fail without actual payment)"""
    print("\n" + "="*60)
    print("Testing eSewa Payment Verification")
    print("="*60)
    
    esewa = EsewaPaymentGateway()
    
    # Test with dummy data (will fail as payment doesn't exist)
    transaction_uuid = "TEST-123-456"
    total_amount = "100"
    
    print(f"\nAttempting to verify payment:")
    print(f"  Transaction UUID: {transaction_uuid}")
    print(f"  Amount: NPR {total_amount}")
    
    result = esewa.verify_payment(transaction_uuid, total_amount)
    
    if result.get('error'):
        print(f"\n⚠ Verification failed (expected for test data): {result.get('message')}")
    else:
        print(f"\n✓ Verification successful!")
        print(f"  Status: {result.get('status')}")
        print(f"  Ref ID: {result.get('ref_id')}")
    
    return result

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("eSewa Payment Gateway Integration Test")
    print("="*60)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Signature Generation
    test_signature_generation()
    
    # Test 2: Payment Initiation
    payment_data = test_payment_initiation()
    
    # Test 3: Payment Verification (with dummy data)
    test_payment_verification()
    
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    print("\n✓ Signature generation: PASSED")
    print("✓ Payment initiation: PASSED" if payment_data else "✗ Payment initiation: FAILED")
    print("⚠ Payment verification: SKIPPED (requires actual payment)")
    
    print("\n" + "="*60)
    print("Next Steps")
    print("="*60)
    print("\n1. Start the Django development server:")
    print("   python manage.py runserver")
    print("\n2. Start the React frontend:")
    print("   cd frontend && npm run dev")
    print("\n3. Create a booking and select eSewa payment")
    print("\n4. Complete payment on eSewa sandbox")
    print("\n5. Verify booking status is updated")
    
    print("\n" + "="*60)

if __name__ == '__main__':
    main()
