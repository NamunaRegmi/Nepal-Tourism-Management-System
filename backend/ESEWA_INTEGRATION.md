# eSewa Payment Gateway Integration

This document describes the eSewa payment gateway integration for the Nepal Tourism Management System.

## Overview

eSewa is a popular digital wallet and payment gateway in Nepal. This integration uses the eSewa Sandbox environment for testing.

## Sandbox Credentials

The following sandbox credentials are configured in `backend/settings.py`:

- **Merchant ID**: `EPAYTEST`
- **Merchant Secret**: `8gBm/:&EnhH.1/q`
- **Payment URL**: `https://rc-epay.esewa.com.np/api/epay/main/v2/form`
- **Verification URL**: `https://uat.esewa.com.np/api/epay/transaction/status/`

## How It Works

### 1. Payment Initiation

When a user chooses to pay with eSewa:

1. Frontend calls `/api/payment/esewa/initiate/` with booking ID
2. Backend generates a unique transaction UUID and HMAC signature
3. Backend returns payment form data including:
   - Amount
   - Transaction UUID
   - Signature
   - Success/Failure URLs
4. Frontend submits this data as a POST form to eSewa's payment URL
5. User is redirected to eSewa's payment page

### 2. Payment Processing

1. User completes payment on eSewa's secure page
2. eSewa redirects user to success or failure URL with payment details
3. Frontend receives the callback and extracts payment parameters

### 3. Payment Verification

1. Frontend calls `/api/payment/esewa/verify/` with transaction details
2. Backend verifies payment with eSewa's verification API
3. If successful, booking status is updated to "confirmed" and payment status to "paid"
4. User sees confirmation page with booking details

## API Endpoints

### Initiate Payment
```
POST /api/payment/esewa/initiate/
```

**Request Body:**
```json
{
  "booking_id": 123,
  "success_url": "http://localhost:3000/payment/esewa/success",
  "failure_url": "http://localhost:3000/payment/esewa/failure"
}
```

**Response:**
```json
{
  "amount": "5000.00",
  "tax_amount": "0",
  "total_amount": "5000.00",
  "transaction_uuid": "BOOK-123-1234567890.123",
  "product_code": "EPAYTEST",
  "product_service_charge": "0",
  "product_delivery_charge": "0",
  "success_url": "http://localhost:3000/payment/esewa/success",
  "failure_url": "http://localhost:3000/payment/esewa/failure",
  "signed_field_names": "total_amount,transaction_uuid,product_code",
  "signature": "base64_encoded_signature",
  "payment_url": "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
}
```

### Verify Payment
```
POST /api/payment/esewa/verify/
```

**Request Body:**
```json
{
  "transaction_uuid": "BOOK-123-1234567890.123",
  "total_amount": "5000.00",
  "product_code": "EPAYTEST"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment verified and booking confirmed",
  "booking_id": 123,
  "payment_details": {
    "success": true,
    "transaction_uuid": "BOOK-123-1234567890.123",
    "status": "COMPLETE",
    "ref_id": "0007KNH",
    "total_amount": "5000.00",
    "transaction_code": "0007KNH"
  }
}
```

### Payment Callback (GET)
```
GET /api/payment/esewa/callback/?transaction_uuid=...&total_amount=...&product_code=...
```

This endpoint is called by eSewa after payment completion.

## Frontend Integration

### Service (`esewaService.js`)

The frontend service provides methods for:
- `initiatePayment()` - Start payment process
- `verifyPayment()` - Verify payment after completion
- `submitPaymentForm()` - Submit payment form to eSewa
- `processPayment()` - Complete payment flow
- `parseCallbackParams()` - Parse callback parameters

### Payment Flow in BookingModal

1. User selects eSewa as payment method
2. Clicks "Pay with eSewa" button
3. System initiates payment and submits form to eSewa
4. User completes payment on eSewa's page
5. eSewa redirects to success/failure page
6. System verifies payment and updates booking

### Success/Failure Pages

- **Success**: `/payment/esewa/success` - Verifies payment and shows confirmation
- **Failure**: `/payment/esewa/failure` - Shows error message and retry option

## Testing

### Test Payment

1. Use sandbox credentials (already configured)
2. Create a booking and select eSewa payment
3. On eSewa's payment page, use test credentials:
   - Any valid eSewa ID format
   - Any password (sandbox accepts any)
4. Complete payment
5. Verify booking status is updated

### Test Credentials

For eSewa sandbox testing, you can use any credentials as the sandbox environment accepts test payments.

## Security

### Signature Generation

Payment requests are secured using HMAC SHA256 signatures:

```python
message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
signature = hmac.new(secret.encode(), message.encode(), hashlib.sha256).digest()
signature_base64 = base64.b64encode(signature).decode()
```

### Payment Verification

All payments are verified with eSewa's verification API before updating booking status.

## Configuration

### Environment Variables

Add these to your `.env` file for production:

```env
ESEWA_MERCHANT_ID=your_merchant_id
ESEWA_MERCHANT_SECRET=your_merchant_secret
ESEWA_SUCCESS_URL=https://yourdomain.com/payment/esewa/success
ESEWA_FAILURE_URL=https://yourdomain.com/payment/esewa/failure
```

### Production URLs

For production, update URLs in `esewa_integration.py`:

```python
self.payment_url = 'https://epay.esewa.com.np/api/epay/main/v2/form'
self.verify_url = 'https://esewa.com.np/api/epay/transaction/status/'
```

## Troubleshooting

### Payment Not Completing

1. Check browser console for errors
2. Verify signature generation is correct
3. Ensure success/failure URLs are accessible
4. Check eSewa sandbox status

### Verification Failing

1. Verify transaction_uuid format is correct
2. Check amount matches exactly
3. Ensure product_code is correct
4. Review backend logs for API errors

## References

- [eSewa Developer Documentation](https://developer.esewa.com.np/)
- [eSewa API Documentation](https://developer.esewa.com.np/pages/Epay)
- [eSewa Sandbox](https://developer.esewa.com.np/pages/sandbox)

## Support

For eSewa integration issues:
- Email: support@esewa.com.np
- Developer Portal: https://developer.esewa.com.np/
