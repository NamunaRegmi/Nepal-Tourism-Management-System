# eSewa Payment Integration Setup Guide

This guide will help you set up and test the eSewa payment gateway integration in your Nepal Tourism Management System.

## 🎯 Overview

eSewa is integrated as a payment option alongside Khalti. Users can now choose between:
- **Khalti** - Digital wallet payment
- **eSewa** - Digital wallet payment

## 📋 What's Been Added

### Backend Files
1. `backend/tourism/esewa_integration.py` - eSewa payment gateway class
2. `backend/tourism/views.py` - Added eSewa payment views
3. `backend/tourism/urls.py` - Added eSewa payment endpoints
4. `backend/backend/settings.py` - Added eSewa configuration
5. `backend/test_esewa.py` - Test script for eSewa integration
6. `backend/ESEWA_INTEGRATION.md` - Detailed integration documentation

### Frontend Files
1. `frontend/src/services/esewaService.js` - eSewa service for API calls
2. `frontend/src/pages/EsewaSuccess.jsx` - Payment success page
3. `frontend/src/pages/EsewaFailure.jsx` - Payment failure page
4. `frontend/src/App.jsx` - Added routes for eSewa pages
5. `frontend/src/components/BookingModal.jsx` - Updated with eSewa option

## 🚀 Quick Start

### 1. Backend Setup

The eSewa sandbox credentials are already configured in `backend/backend/settings.py`:

```python
# eSewa Payment Settings (Sandbox)
ESEWA_MERCHANT_ID = 'EPAYTEST'
ESEWA_MERCHANT_SECRET = '8gBm/:&EnhH.1/q'
ESEWA_SUCCESS_URL = 'http://localhost:3000/payment/esewa/success'
ESEWA_FAILURE_URL = 'http://localhost:3000/payment/esewa/failure'
```

No additional configuration needed for testing!

### 2. Test the Integration

Run the test script to verify everything is working:

```bash
cd backend
python test_esewa.py
```

This will test:
- ✅ Signature generation
- ✅ Payment initiation
- ⚠️ Payment verification (requires actual payment)

### 3. Start the Servers

**Backend:**
```bash
cd backend
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Test Payment Flow

1. Open http://localhost:3000
2. Login or register as a user
3. Browse destinations and select a hotel
4. Click "Book Now" and select a room
5. Choose dates and click "Proceed to Payment"
6. Select **eSewa** as payment method
7. Click "Pay with eSewa"
8. You'll be redirected to eSewa's sandbox payment page
9. Complete the payment (sandbox accepts any credentials)
10. You'll be redirected back to the success page
11. Verify your booking status is updated to "Confirmed"

## 🔧 API Endpoints

### Initiate Payment
```
POST /api/payment/esewa/initiate/
Authorization: Bearer <token>

{
  "booking_id": 123,
  "success_url": "http://localhost:3000/payment/esewa/success",
  "failure_url": "http://localhost:3000/payment/esewa/failure"
}
```

### Verify Payment
```
POST /api/payment/esewa/verify/
Authorization: Bearer <token>

{
  "transaction_uuid": "BOOK-123-1234567890.123",
  "total_amount": "5000.00",
  "product_code": "EPAYTEST"
}
```

### Payment Callback
```
GET /api/payment/esewa/callback/?transaction_uuid=...&total_amount=...
```

## 🎨 Frontend Components

### Payment Selection
Users can choose between Khalti and eSewa in the booking modal:

```jsx
<button onClick={() => setPaymentMethod('esewa')}>
  <Wallet /> eSewa
</button>
```

### Success Page
Shows payment confirmation and booking details:
- Transaction ID
- Booking ID
- Amount paid
- Payment status

### Failure Page
Shows error message with options to:
- Return to dashboard
- Try payment again

## 🔐 Security Features

### HMAC Signature
All payment requests are signed using HMAC SHA256:

```python
message = f"total_amount={amount},transaction_uuid={uuid},product_code={code}"
signature = hmac.new(secret, message, hashlib.sha256).digest()
signature_base64 = base64.b64encode(signature).decode()
```

### Payment Verification
Every payment is verified with eSewa's API before updating booking status:

```python
verify_url = f"{base_url}?product_code={code}&total_amount={amount}&transaction_uuid={uuid}"
response = requests.get(verify_url)
```

## 🧪 Testing

### Sandbox Environment
- **Payment URL**: https://rc-epay.esewa.com.np/api/epay/main/v2/form
- **Verify URL**: https://uat.esewa.com.np/api/epay/transaction/status/
- **Merchant ID**: EPAYTEST
- **Secret**: 8gBm/:&EnhH.1/q

### Test Credentials
For sandbox testing, you can use any credentials as the sandbox accepts all test payments.

### Test Scenarios

1. **Successful Payment**
   - Create booking
   - Select eSewa
   - Complete payment
   - Verify booking confirmed

2. **Failed Payment**
   - Create booking
   - Select eSewa
   - Cancel payment
   - Verify booking still pending

3. **Payment Verification**
   - Complete payment
   - Check transaction in eSewa dashboard
   - Verify booking status updated

## 📱 User Flow

```
1. User selects hotel and room
   ↓
2. User clicks "Proceed to Payment"
   ↓
3. User selects eSewa payment method
   ↓
4. System initiates payment and generates signature
   ↓
5. User redirected to eSewa payment page
   ↓
6. User completes payment on eSewa
   ↓
7. eSewa redirects to success/failure URL
   ↓
8. System verifies payment with eSewa API
   ↓
9. Booking status updated to "Confirmed"
   ↓
10. User sees confirmation page
```

## 🔄 Payment States

### Booking Status
- `pending` - Booking created, payment not completed
- `confirmed` - Payment verified, booking confirmed
- `cancelled` - Booking cancelled
- `completed` - Service completed

### Payment Status
- `unpaid` - No payment made
- `paid` - Payment verified and completed
- `failed` - Payment attempt failed

## 🚨 Troubleshooting

### Payment Not Initiating
- Check if booking exists
- Verify user is authenticated
- Check backend logs for errors
- Ensure eSewa credentials are correct

### Payment Not Verifying
- Check transaction UUID format
- Verify amount matches exactly
- Ensure product code is correct
- Check eSewa API status

### Redirect Not Working
- Verify success/failure URLs are accessible
- Check browser console for errors
- Ensure URLs match in settings

### Common Errors

**Error: "Booking ID is required"**
- Solution: Ensure booking_id is passed in request

**Error: "Payment already completed"**
- Solution: Booking already paid, create new booking

**Error: "Invalid callback parameters"**
- Solution: Check eSewa callback URL parameters

## 📊 Database Schema

### Booking Model
```python
class Booking(models.Model):
    user = ForeignKey(User)
    room = ForeignKey(Room)
    start_date = DateField()
    end_date = DateField()
    total_price = DecimalField()
    status = CharField()  # pending, confirmed, cancelled, completed
    payment_status = CharField()  # unpaid, paid, failed
    payment_method = CharField()  # khalti, esewa, none
    created_at = DateTimeField()
```

## 🌐 Production Deployment

### Update URLs
Change sandbox URLs to production in `esewa_integration.py`:

```python
self.payment_url = 'https://epay.esewa.com.np/api/epay/main/v2/form'
self.verify_url = 'https://esewa.com.np/api/epay/transaction/status/'
```

### Update Credentials
Set production credentials in environment variables:

```env
ESEWA_MERCHANT_ID=your_production_merchant_id
ESEWA_MERCHANT_SECRET=your_production_secret
ESEWA_SUCCESS_URL=https://yourdomain.com/payment/esewa/success
ESEWA_FAILURE_URL=https://yourdomain.com/payment/esewa/failure
```

### SSL Certificate
Ensure your domain has a valid SSL certificate for secure payments.

## 📚 Resources

- [eSewa Developer Portal](https://developer.esewa.com.np/)
- [eSewa API Documentation](https://developer.esewa.com.np/pages/Epay)
- [eSewa Sandbox Guide](https://developer.esewa.com.np/pages/sandbox)

## 💡 Tips

1. **Always verify payments** - Never trust client-side data
2. **Log all transactions** - Keep detailed logs for debugging
3. **Handle errors gracefully** - Show user-friendly error messages
4. **Test thoroughly** - Test all payment scenarios before production
5. **Monitor payments** - Set up alerts for failed payments

## 🤝 Support

For issues or questions:
- Check `backend/ESEWA_INTEGRATION.md` for detailed documentation
- Review backend logs in console
- Check browser console for frontend errors
- Contact eSewa support: support@esewa.com.np

## ✅ Checklist

Before going live:
- [ ] Test payment initiation
- [ ] Test successful payment flow
- [ ] Test failed payment flow
- [ ] Test payment verification
- [ ] Update to production URLs
- [ ] Set production credentials
- [ ] Enable SSL certificate
- [ ] Test on production environment
- [ ] Set up payment monitoring
- [ ] Document payment procedures

## 🎉 Success!

You now have a fully functional eSewa payment integration! Users can choose between Khalti and eSewa for secure payments.

Happy coding! 🚀
