# Payment Gateway Comparison: Khalti vs eSewa

## Overview

Your Nepal Tourism Management System now supports two popular payment gateways in Nepal:

| Feature | Khalti | eSewa |
|---------|--------|-------|
| **Type** | Digital Wallet | Digital Wallet |
| **Integration** | API-based (popup) | Form-based (redirect) |
| **Sandbox** | ✅ Available | ✅ Available |
| **Payment Methods** | Wallet, Cards, Banking | Wallet, Cards, Banking |
| **User Experience** | Popup window | Full redirect |
| **Verification** | Lookup API | Status API |

## Payment Flow Comparison

### Khalti Flow
```
User clicks "Pay with Khalti"
    ↓
Backend generates payment URL
    ↓
Frontend opens popup window
    ↓
User completes payment in popup
    ↓
Popup closes, returns to app
    ↓
Backend verifies with Khalti API
    ↓
Booking confirmed
```

### eSewa Flow
```
User clicks "Pay with eSewa"
    ↓
Backend generates signature
    ↓
Frontend submits form to eSewa
    ↓
User redirected to eSewa page
    ↓
User completes payment
    ↓
eSewa redirects to success URL
    ↓
Backend verifies with eSewa API
    ↓
Booking confirmed
```

## Technical Implementation

### Khalti
- **Method**: REST API with JWT-like tokens
- **Initiation**: POST request returns payment URL
- **Verification**: POST request with pidx
- **Security**: API key authentication
- **Frontend**: Popup window management

### eSewa
- **Method**: Form POST with HMAC signature
- **Initiation**: Generate form data with signature
- **Verification**: GET request with transaction details
- **Security**: HMAC SHA256 signature
- **Frontend**: Form submission and redirect

## Sandbox Credentials

### Khalti Sandbox
```
Secret Key: test_secret_key_f59e8b7d18b4499ca40f68195a846e9b
Public Key: test_public_key_dc7127a0d5e049b19331a7949389e5b8
Initiate URL: https://dev.khalti.com/api/v2/epayment/initiate/
Lookup URL: https://dev.khalti.com/api/v2/epayment/lookup/
```

### eSewa Sandbox
```
Merchant ID: EPAYTEST
Merchant Secret: 8gBm/:&EnhH.1/q
Payment URL: https://rc-epay.esewa.com.np/api/epay/main/v2/form
Verify URL: https://uat.esewa.com.np/api/epay/transaction/status/
```

## User Interface

### Payment Selection
Users see both options in the booking modal:

```
┌─────────────────────────────────────┐
│  Select Payment Method              │
├─────────────────────────────────────┤
│  ┌──────────┐    ┌──────────┐      │
│  │ 📱       │    │ 💰       │      │
│  │ Khalti   │    │ eSewa    │      │
│  └──────────┘    └──────────┘      │
└─────────────────────────────────────┘
```

### Payment Button Colors
- **Khalti**: Purple gradient (from-purple-600 to-blue-600)
- **eSewa**: Green gradient (from-green-600 to-emerald-600)

## Code Structure

### Backend
```
backend/
├── tourism/
│   ├── khalti_integration.py    # Khalti gateway class
│   ├── esewa_integration.py     # eSewa gateway class
│   ├── views.py                 # Payment views
│   └── urls.py                  # Payment endpoints
└── backend/
    └── settings.py              # Payment configuration
```

### Frontend
```
frontend/src/
├── services/
│   ├── khaltiService.js         # Khalti API calls
│   └── esewaService.js          # eSewa API calls
├── pages/
│   ├── PaymentVerify.jsx        # Khalti verification
│   ├── EsewaSuccess.jsx         # eSewa success page
│   └── EsewaFailure.jsx         # eSewa failure page
└── components/
    └── BookingModal.jsx         # Payment selection UI
```

## API Endpoints

### Khalti Endpoints
```
POST /api/payment/khalti/initiate/
POST /api/payment/khalti/verify/
GET  /api/payment/khalti/callback/
GET  /api/payment/khalti/status/<pidx>/
```

### eSewa Endpoints
```
POST /api/payment/esewa/initiate/
POST /api/payment/esewa/verify/
GET  /api/payment/esewa/callback/
```

## Testing

### Test Khalti Payment
1. Select Khalti payment method
2. Click "Pay with Khalti"
3. Popup opens with Khalti payment page
4. Use test credentials from Khalti docs
5. Complete payment
6. Popup closes automatically
7. Booking status updated

### Test eSewa Payment
1. Select eSewa payment method
2. Click "Pay with eSewa"
3. Redirected to eSewa payment page
4. Use any credentials (sandbox accepts all)
5. Complete payment
6. Redirected to success page
7. Booking status updated

## Error Handling

### Khalti Errors
- Payment window blocked by popup blocker
- Payment window closed by user
- Network error during API call
- Invalid payment response
- Verification failed

### eSewa Errors
- Form submission failed
- Redirect blocked
- Payment cancelled by user
- Verification failed
- Invalid signature

## Production Checklist

### Khalti Production
- [ ] Update to production API URLs
- [ ] Set production secret key
- [ ] Update return URLs to production domain
- [ ] Test with real Khalti account
- [ ] Enable SSL certificate

### eSewa Production
- [ ] Update to production payment URL
- [ ] Update to production verify URL
- [ ] Set production merchant credentials
- [ ] Update success/failure URLs
- [ ] Enable SSL certificate

## Best Practices

### Security
1. ✅ Always verify payments server-side
2. ✅ Use HTTPS for all payment URLs
3. ✅ Validate signatures before processing
4. ✅ Log all payment transactions
5. ✅ Never expose secret keys in frontend

### User Experience
1. ✅ Show clear payment method options
2. ✅ Display loading states during payment
3. ✅ Handle errors gracefully
4. ✅ Provide clear success/failure messages
5. ✅ Allow users to retry failed payments

### Development
1. ✅ Use sandbox for testing
2. ✅ Test all payment scenarios
3. ✅ Handle edge cases
4. ✅ Add comprehensive logging
5. ✅ Document payment flows

## Monitoring

### Key Metrics to Track
- Payment success rate
- Payment failure reasons
- Average payment time
- Gateway response times
- User payment preferences

### Logging
Both integrations log:
- Payment initiation requests
- Payment responses
- Verification requests
- Verification results
- Error messages

## Support

### Khalti Support
- Email: merchant@khalti.com
- Docs: https://docs.khalti.com/
- Dashboard: https://khalti.com/

### eSewa Support
- Email: support@esewa.com.np
- Docs: https://developer.esewa.com.np/
- Dashboard: https://esewa.com.np/

## Summary

Both payment gateways are fully integrated and ready to use:

✅ **Khalti**: Modern API-based integration with popup experience
✅ **eSewa**: Traditional form-based integration with redirect flow

Users can choose their preferred payment method, and both provide secure, reliable payment processing for your Nepal Tourism Management System.
