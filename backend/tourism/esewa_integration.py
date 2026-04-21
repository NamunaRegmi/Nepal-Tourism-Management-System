import hashlib
import hmac
import base64
import requests
from django.conf import settings
from .models import Booking

class EsewaPaymentGateway:
    """
    eSewa Payment Gateway Integration for Nepal Tourism Management System
    Based on official eSewa documentation: https://developer.esewa.com.np/
    Using eSewa Sandbox for testing
    """
    
    def __init__(self):
        # eSewa Sandbox Credentials
        self.merchant_id = getattr(settings, 'ESEWA_MERCHANT_ID', 'EPAYTEST')
        self.merchant_secret = getattr(settings, 'ESEWA_MERCHANT_SECRET', '8gBm/:&EnhH.1/q')
        
        # eSewa Sandbox URLs
        self.payment_url = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
        self.verify_url = 'https://uat.esewa.com.np/api/epay/transaction/status/'
        
        # Return URLs
        self.success_url = getattr(settings, 'ESEWA_SUCCESS_URL', 'http://localhost:3000/payment/esewa/success')
        self.failure_url = getattr(settings, 'ESEWA_FAILURE_URL', 'http://localhost:3000/payment/esewa/failure')
        
    def generate_signature(self, message):
        """
        Generate HMAC SHA256 signature for eSewa payment
        """
        secret = self.merchant_secret.encode()
        message = message.encode()
        signature = hmac.new(secret, message, hashlib.sha256).digest()
        return base64.b64encode(signature).decode()
    
    def initiate_payment(self, booking, success_url=None, failure_url=None):
        """
        Initiate eSewa payment for a booking
        Returns payment form data that frontend will use to submit
        """
        try:
            # Generate unique transaction UUID
            transaction_uuid = f"BOOK-{booking.id}-{booking.created_at.strftime('%Y%m%d%H%M%S')}"
            
            # Amount in rupees (eSewa uses NPR)
            total_amount = str(float(booking.total_price))
            
            # Create message for signature
            # Format: total_amount,transaction_uuid,product_code
            message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={self.merchant_id}"
            
            # Generate signature
            signature = self.generate_signature(message)
            
            # Prepare payment data
            payment_data = {
                'amount': total_amount,
                'tax_amount': '0',
                'total_amount': total_amount,
                'transaction_uuid': transaction_uuid,
                'product_code': self.merchant_id,
                'product_service_charge': '0',
                'product_delivery_charge': '0',
                'success_url': success_url or self.success_url,
                'failure_url': failure_url or self.failure_url,
                'signed_field_names': 'total_amount,transaction_uuid,product_code',
                'signature': signature,
                'payment_url': self.payment_url
            }
            
            print(f"eSewa Payment Initiation:")
            print(f"Transaction UUID: {transaction_uuid}")
            print(f"Amount: {total_amount}")
            print(f"Signature: {signature}")
            
            return payment_data
            
        except Exception as e:
            return {
                'error': True,
                'message': f'Payment initiation error: {str(e)}'
            }
    
    def verify_payment(self, transaction_uuid, total_amount, product_code=None):
        """
        Verify eSewa payment after completion
        """
        try:
            if not product_code:
                product_code = self.merchant_id
            
            # Prepare verification request
            verify_url = f"{self.verify_url}?product_code={product_code}&total_amount={total_amount}&transaction_uuid={transaction_uuid}"
            
            print(f"eSewa Verification Request: {verify_url}")
            
            response = requests.get(verify_url, timeout=30)
            
            print(f"eSewa Verification Response Status: {response.status_code}")
            print(f"eSewa Verification Response: {response.text}")
            
            if response.status_code == 200:
                response_data = response.json()
                
                # Check if payment was successful
                if response_data.get('status') == 'COMPLETE':
                    return {
                        'success': True,
                        'transaction_uuid': transaction_uuid,
                        'status': response_data.get('status'),
                        'ref_id': response_data.get('ref_id'),
                        'total_amount': response_data.get('total_amount'),
                        'transaction_code': response_data.get('transaction_code')
                    }
                else:
                    return {
                        'error': True,
                        'message': f'Payment not completed. Status: {response_data.get("status")}',
                        'details': response_data
                    }
            else:
                return {
                    'error': True,
                    'message': f'Verification failed: {response.status_code} - {response.text}'
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
