import requests
import json
from django.conf import settings
from django.http import JsonResponse
from .models import Booking

class KhaltiPaymentGateway:
    """
    Khalti Payment Gateway Integration for Nepal Tourism Management System
    Based on official Khalti documentation: https://docs.khalti.com/khalti-epayment/
    """
    
    def __init__(self):
        # Khalti Test Credentials from documentation
        self.secret_key = getattr(settings, 'KHALTI_SECRET_KEY', 'test_secret_key_f59e8b7d18b4499ca40f68195a846e9b')
        self.website_url = getattr(settings, 'KHALTI_WEBSITE_URL', 'http://localhost:3000')
        self.return_url = getattr(settings, 'KHALTI_RETURN_URL', 'http://localhost:3000/payment/verify')
        
        # API endpoints from Khalti documentation
        self.initiate_url = 'https://dev.khalti.com/api/v2/epayment/initiate/'
        self.lookup_url = 'https://dev.khalti.com/api/v2/epayment/lookup/'
        
    def initiate_payment(self, booking, return_url=None):
        """
        Initiate Khalti payment for a booking
        Following Khalti API specification
        """
        try:
            payload = {
                "return_url": return_url or self.return_url,
                "website_url": self.website_url,
                "amount": int(booking.total_price * 100),  # Convert to paisa
                "purchase_order_id": f"BOOK-{booking.id}",
                "purchase_order_name": f"Hotel Booking - {booking.room.room_type if booking.room else 'Package'}",
                "customer_info": {
                    "name": booking.user.get_full_name() or booking.user.username,
                    "email": booking.user.email,
                    "phone": booking.user.phone or "9800000000"
                }
            }
            
            headers = {
                'Authorization': f'Key {self.secret_key}',
                'Content-Type': 'application/json'
            }
            
            print(f"Khalti Request: {self.initiate_url}")
            print(f"Khalti Payload: {json.dumps(payload, indent=2)}")
            print(f"Khalti Headers: {headers}")
            
            response = requests.post(
                self.initiate_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            print(f"Khalti Response Status: {response.status_code}")
            print(f"Khalti Response: {response.text}")
            
            if response.status_code == 200:
                response_data = response.json()
                if 'payment_url' in response_data and 'pidx' in response_data:
                    return response_data
                else:
                    return {
                        'error': True,
                        'message': f'Invalid response format: {response.text}'
                    }
            else:
                return {
                    'error': True,
                    'message': f'Payment initiation failed: {response.status_code} - {response.text}'
                }
                
        except requests.exceptions.RequestException as e:
            return {
                'error': True,
                'message': f'Network error: {str(e)}'
            }
        except Exception as e:
            return {
                'error': True,
                'message': f'Payment initiation error: {str(e)}'
            }
    
    def verify_payment(self, pidx):
        """
        Verify Khalti payment using lookup API
        Following Khalti documentation
        """
        try:
            payload = {
                "pidx": pidx
            }
            
            headers = {
                'Authorization': f'Key {self.secret_key}',
                'Content-Type': 'application/json'
            }
            
            print(f"Khalti Lookup Request: {self.lookup_url}")
            print(f"Khalti Lookup Payload: {json.dumps(payload, indent=2)}")
            
            response = requests.post(
                self.lookup_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            
            print(f"Khalti Lookup Response Status: {response.status_code}")
            print(f"Khalti Lookup Response: {response.text}")
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    'error': True,
                    'message': f'Payment verification failed: {response.status_code} - {response.text}'
                }
                
        except requests.exceptions.RequestException as e:
            return {
                'error': True,
                'message': f'Network error: {str(e)}'
            }
        except Exception as e:
            return {
                'error': True,
                'message': f'Payment verification error: {str(e)}'
            }
