#!/usr/bin/env python3
"""
Test script to debug Khalti payment integration
"""
import requests
import json

# Khalti test credentials
SECRET_KEY = 'test_secret_key_f59e8b7d18b4499ca40f68195a846e9b'
INITIATE_URL = 'https://dev.khalti.com/api/v2/epayment/initiate/'
LOOKUP_URL = 'https://dev.khalti.com/api/v2/epayment/lookup/'

def test_khalti_initiate():
    """Test Khalti payment initiation"""
    print("Testing Khalti Payment Initiation...")
    print("=" * 50)
    
    payload = {
        "return_url": "http://localhost:3000/payment/verify",
        "website_url": "http://localhost:3000",
        "amount": 1300,  # Rs. 13.00 in paisa
        "purchase_order_id": "TEST-123",
        "purchase_order_name": "Test Booking",
        "customer_info": {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "9800000000"
        }
    }
    
    headers = {
        'Authorization': f'Key {SECRET_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        print(f"URL: {INITIATE_URL}")
        print(f"Headers: {json.dumps(headers, indent=2)}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            INITIATE_URL,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if 'payment_url' in data:
                print(f"✅ Success! Payment URL: {data['payment_url']}")
                print(f"✅ Pidx: {data.get('pidx')}")
                return data
            else:
                print("❌ Invalid response format")
        else:
            print(f"❌ Failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        
    return None

def test_khalti_lookup(pidx):
    """Test Khalti payment lookup"""
    print("\nTesting Khalti Payment Lookup...")
    print("=" * 50)
    
    payload = {
        "pidx": pidx
    }
    
    headers = {
        'Authorization': f'Key {SECRET_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        print(f"URL: {LOOKUP_URL}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            LOOKUP_URL,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Lookup successful!")
        else:
            print(f"❌ Failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🔍 Khalti Payment Integration Test")
    print("=" * 50)
    
    # Test payment initiation
    result = test_khalti_initiate()
    
    if result and 'pidx' in result:
        # Test lookup with the returned pidx
        test_khalti_lookup(result['pidx'])
    else:
        print("\n❌ Cannot test lookup without valid pidx")
