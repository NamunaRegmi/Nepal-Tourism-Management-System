# Payment System - Complete Guide for Viva Defense

## Overview
The Nepal Tourism Management System integrates **two major Nepali payment gateways**:
1. **Khalti** - Digital wallet payment system
2. **eSewa** - Electronic payment service

Both are widely used in Nepal for online transactions.

---

## Payment Flow Architecture

### High-Level Flow
```
User → Selects Package/Hotel → Creates Booking → Chooses Payment Method → 
Payment Gateway → Payment Completion → Verification → Booking Confirmed
```

---

## 1. KHALTI PAYMENT SYSTEM

### 1.1 Khalti Overview
- **Type**: Digital wallet and payment gateway
- **API Version**: v2 (ePay API)
- **Environment**: Sandbox (Test Mode)
- **Documentation**: https://docs.khalti.com/khalti-epayment/

### 1.2 Khalti Payment Flow (Step-by-Step)

#### Step 1: User Initiates Payment
**Location**: Frontend (User clicks "Pay with Khalti")

**What Happens**:
- User has already created a booking (hotel room or tour package)
- Booking is in "pending" status with "unpaid" payment status
- User clicks "Pay with Khalti" button
- Frontend sends request to backend

**Frontend Code**:
```javascript
// User clicks Pay with Khalti
const response = await api.post('/payment/khalti/initiate/', {
  booking_id: bookingId,
  return_url: 'http://localhost:5173/payment/verify'
});
```

#### Step 2: Backend Initiates Payment
**Location**: Backend - `KhaltiPaymentInitiateView`

**What Happens**:
1. Backend receives booking_id
2. Fetches booking from database
3. Validates booking (must be unpaid)
4. Calls Khalti API to initiate payment

**Backend Process**:
```python
# 1. Get booking
booking = Booking.objects.get(id=booking_id, user=request.user)

# 2. Prepare payment data
payload = {
    "return_url": "http://localhost:5173/payment/verify",
    "website_url": "http://localhost:5173",
    "amount": int(booking.total_price * 100),  # Convert to paisa
    "purchase_order_id": f"BOOK-{booking.id}",
    "purchase_order_name": "Hotel Booking - Deluxe Room",
    "customer_info": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9800000000"
    }
}

# 3. Send to Khalti API
response = requests.post(
    'https://dev.khalti.com/api/v2/epayment/initiate/',
    json=payload,
    headers={'Authorization': 'Key test_secret_key_...'}
)

# 4. Return payment URL to frontend
return {
    'payment_url': 'https://test-pay.khalti.com/...',
    'pidx': 'unique_payment_identifier'
}
```

**Khalti API Response**:
```json
{
  "pidx": "HT6o9wGGaKaHLJKBGBu6FB",
  "payment_url": "https://test-pay.khalti.com/#/payment-details/?pidx=HT6o9wGGaKaHLJKBGBu6FB",
  "expires_at": "2024-01-01T12:00:00Z",
  "expires_in": 1800
}
```

#### Step 3: User Redirected to Khalti
**Location**: Khalti's Payment Page

**What Happens**:
1. Frontend redirects user to `payment_url`
2. User sees Khalti payment interface
3. User can pay using:
   - Khalti wallet balance
   - Bank account (eBanking)
   - Mobile banking
   - Cards (Visa, Mastercard)

**User Actions**:
- Enters Khalti credentials or payment details
- Confirms payment
- Khalti processes the transaction

#### Step 4: Payment Completion & Callback
**Location**: Khalti → Backend

**What Happens**:
1. After payment, Khalti redirects user back to `return_url`
2. URL includes payment identifier: `?pidx=HT6o9wGGaKaHLJKBGBu6FB`
3. Frontend captures `pidx` from URL
4. Frontend calls backend to verify payment

**Callback URL**:
```
http://localhost:5173/payment/verify?pidx=HT6o9wGGaKaHLJKBGBu6FB&status=Completed
```

#### Step 5: Payment Verification
**Location**: Backend - `KhaltiPaymentVerifyView`

**What Happens**:
1. Backend receives `pidx` from frontend
2. Backend calls Khalti Lookup API to verify payment
3. Khalti confirms payment status
4. Backend updates booking status

**Verification Process**:
```python
# 1. Receive pidx from frontend
pidx = request.data.get('pidx')

# 2. Call Khalti Lookup API
response = requests.post(
    'https://dev.khalti.com/api/v2/epayment/lookup/',
    json={'pidx': pidx},
    headers={'Authorization': 'Key test_secret_key_...'}
)

# 3. Check payment status
if response.json()['status'] == 'Completed':
    # 4. Update booking
    booking.payment_status = 'paid'
    booking.payment_method = 'khalti'
    booking.status = 'confirmed'
    booking.save()
    
    return {'success': True, 'message': 'Payment verified'}
```

**Khalti Lookup Response**:
```json
{
  "pidx": "HT6o9wGGaKaHLJKBGBu6FB",
  "total_amount": 100000,
  "status": "Completed",
  "transaction_id": "GFT7RS8DJU",
  "fee": 0,
  "refunded": false
}
```

#### Step 6: Booking Confirmed
**Location**: Frontend

**What Happens**:
- User sees success message
- Booking status changes to "confirmed"
- Payment status changes to "paid"
- User receives confirmation (email/notification)

---

## 2. ESEWA PAYMENT SYSTEM

### 2.1 eSewa Overview
- **Type**: Electronic payment service
- **API Version**: v2
- **Environment**: Sandbox (RC - Release Candidate)
- **Documentation**: https://developer.esewa.com.np/

### 2.2 eSewa Payment Flow (Step-by-Step)

#### Step 1: User Initiates Payment
**Location**: Frontend

**What Happens**:
- User clicks "Pay with eSewa"
- Frontend requests payment form data from backend

**Frontend Code**:
```javascript
const response = await api.post('/payment/esewa/initiate/', {
  booking_id: bookingId,
  success_url: 'http://localhost:5173/payment/esewa/success',
  failure_url: 'http://localhost:5173/payment/esewa/failure'
});
```

#### Step 2: Backend Generates Payment Form
**Location**: Backend - `EsewaPaymentInitiateView`

**What Happens**:
1. Backend receives booking_id
2. Generates unique transaction UUID
3. Creates HMAC-SHA256 signature for security
4. Returns form data to frontend

**Signature Generation**:
```python
# 1. Create message
message = f"total_amount={total_amount},transaction_uuid={uuid},product_code=EPAYTEST"

# 2. Generate HMAC-SHA256 signature
secret = '8gBm/:&EnhH.1/q'  # eSewa merchant secret
signature = hmac.new(
    secret.encode(),
    message.encode(),
    hashlib.sha256
).digest()
signature = base64.b64encode(signature).decode()

# 3. Return form data
return {
    'amount': '1000.00',
    'total_amount': '1000.00',
    'transaction_uuid': 'BOOK-123-20260423',
    'product_code': 'EPAYTEST',
    'signature': 'generated_signature',
    'payment_url': 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
}
```

#### Step 3: Frontend Submits Form to eSewa
**Location**: Frontend

**What Happens**:
1. Frontend creates HTML form with payment data
2. Form is auto-submitted to eSewa
3. User is redirected to eSewa payment page

**Form Submission**:
```javascript
// Create form dynamically
const form = document.createElement('form');
form.method = 'POST';
form.action = paymentData.payment_url;

// Add hidden fields
form.innerHTML = `
  <input type="hidden" name="amount" value="${paymentData.amount}" />
  <input type="hidden" name="total_amount" value="${paymentData.total_amount}" />
  <input type="hidden" name="transaction_uuid" value="${paymentData.transaction_uuid}" />
  <input type="hidden" name="product_code" value="${paymentData.product_code}" />
  <input type="hidden" name="signature" value="${paymentData.signature}" />
  <input type="hidden" name="success_url" value="${paymentData.success_url}" />
  <input type="hidden" name="failure_url" value="${paymentData.failure_url}" />
`;

// Submit form
document.body.appendChild(form);
form.submit();
```

#### Step 4: User Pays on eSewa
**Location**: eSewa's Payment Page

**What Happens**:
1. User sees eSewa payment interface
2. User can pay using:
   - eSewa wallet balance
   - Bank account
   - Mobile banking
3. User enters credentials and confirms payment

#### Step 5: eSewa Redirects Back
**Location**: eSewa → Frontend

**What Happens**:
1. After payment, eSewa redirects to `success_url` or `failure_url`
2. URL includes payment details in query parameters
3. Frontend captures these parameters

**Success URL**:
```
http://localhost:5173/payment/esewa/success?
  data=base64_encoded_payment_data
  &transaction_uuid=BOOK-123-20260423
  &total_amount=1000.00
  &status=COMPLETE
```

#### Step 6: Payment Verification
**Location**: Backend - `EsewaPaymentVerifyView`

**What Happens**:
1. Frontend sends transaction details to backend
2. Backend calls eSewa Status API
3. eSewa confirms payment status
4. Backend updates booking

**Verification Process**:
```python
# 1. Receive transaction details
transaction_uuid = request.data.get('transaction_uuid')
total_amount = request.data.get('total_amount')

# 2. Call eSewa Status API
verify_url = f"https://rc.esewa.com.np/api/epay/transaction/status/?product_code=EPAYTEST&total_amount={total_amount}&transaction_uuid={transaction_uuid}"

response = requests.get(verify_url)

# 3. Check status
if response.json()['status'] == 'COMPLETE':
    # 4. Update booking
    booking.payment_status = 'paid'
    booking.payment_method = 'esewa'
    booking.status = 'confirmed'
    booking.save()
    
    return {'success': True}
```

**eSewa Status Response**:
```json
{
  "product_code": "EPAYTEST",
  "total_amount": "1000.00",
  "transaction_uuid": "BOOK-123-20260423",
  "status": "COMPLETE",
  "ref_id": "0007KMI",
  "transaction_code": "0007KMI"
}
```

---

## 3. SECURITY MEASURES

### 3.1 Khalti Security
1. **API Key Authentication**: Secret key required for all API calls
2. **HTTPS**: All communication encrypted
3. **JWT Tokens**: User authentication via JWT
4. **Payment Verification**: Double verification using lookup API
5. **Expiry Time**: Payment URLs expire after 30 minutes

### 3.2 eSewa Security
1. **HMAC-SHA256 Signature**: Prevents tampering with payment data
2. **Merchant Secret**: Only backend knows the secret key
3. **Transaction UUID**: Unique identifier prevents duplicate payments
4. **Status Verification**: Backend verifies with eSewa before confirming
5. **HTTPS**: All communication encrypted

### 3.3 Application Security
1. **User Authentication**: Only logged-in users can make payments
2. **Booking Ownership**: Users can only pay for their own bookings
3. **Payment Status Check**: Prevents double payment
4. **Database Transactions**: Atomic updates to prevent race conditions
5. **CSRF Protection**: Cross-site request forgery protection enabled

---

## 4. DATABASE SCHEMA

### Booking Model
```python
class Booking(models.Model):
    user = ForeignKey(User)  # Who made the booking
    room = ForeignKey(Room, null=True)  # Hotel room (if hotel booking)
    package = ForeignKey(Package, null=True)  # Tour package (if package booking)
    
    start_date = DateField()
    end_date = DateField(null=True)
    total_price = DecimalField()
    
    # Payment fields
    status = CharField(choices=[
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed')
    ])
    payment_status = CharField(choices=[
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('failed', 'Failed')
    ])
    payment_method = CharField()  # 'khalti', 'esewa', 'none'
    
    created_at = DateTimeField(auto_now_add=True)
```

### Payment Status Transitions
```
Initial: status='pending', payment_status='unpaid'
         ↓
After Payment: status='confirmed', payment_status='paid'
         ↓
After Stay: status='completed', payment_status='paid'
```

---

## 5. API ENDPOINTS

### Khalti Endpoints
```
POST /api/payment/khalti/initiate/
  - Initiates Khalti payment
  - Returns: payment_url, pidx

POST /api/payment/khalti/verify/
  - Verifies payment using pidx
  - Returns: success status

GET /api/payment/khalti/callback/
  - Handles Khalti callback (optional)
  - Returns: payment status

GET /api/payment/khalti/status/<pidx>/
  - Checks payment status
  - Returns: current status
```

### eSewa Endpoints
```
POST /api/payment/esewa/initiate/
  - Generates payment form data
  - Returns: form fields, signature

POST /api/payment/esewa/verify/
  - Verifies payment with eSewa
  - Returns: success status

GET /api/payment/esewa/callback/
  - Handles eSewa callback
  - Returns: payment status
```

---

## 6. TESTING CREDENTIALS

### Khalti Test Credentials
```
Secret Key: test_secret_key_f59e8b7d18b4499ca40f68195a846e9b
API Base URL: https://dev.khalti.com/api/v2/epayment/

Test Khalti Account:
  Mobile: 9800000000
  MPIN: 1111
  OTP: 987654
```

### eSewa Test Credentials
```
Merchant ID: EPAYTEST
Merchant Secret: 8gBm/:&EnhH.1/q
API Base URL: https://rc-epay.esewa.com.np/

Test eSewa Account:
  eSewa ID: 9806800001
  Password: Nepal@123
  MPIN: 1122
```

---

## 7. ERROR HANDLING

### Common Errors & Solutions

#### Khalti Errors
1. **"Invalid secret key"**
   - Solution: Check KHALTI_SECRET_KEY in settings

2. **"Payment expired"**
   - Solution: Payment URLs expire after 30 minutes, initiate new payment

3. **"Insufficient balance"**
   - Solution: User needs to add funds to Khalti wallet

#### eSewa Errors
1. **"Invalid signature"**
   - Solution: Check signature generation, verify merchant secret

2. **"Transaction not found"**
   - Solution: Wait a few seconds, eSewa may have delay

3. **"Payment failed"**
   - Solution: User cancelled or insufficient balance

---

## 8. ADVANTAGES OF THIS SYSTEM

### For Users
1. **Multiple Payment Options**: Choose between Khalti and eSewa
2. **Secure**: Industry-standard encryption and security
3. **Fast**: Payment completes in seconds
4. **Convenient**: No need to visit physical locations
5. **Instant Confirmation**: Booking confirmed immediately

### For Business
1. **Automated**: No manual payment verification needed
2. **Reliable**: Both gateways are trusted in Nepal
3. **Scalable**: Can handle many transactions
4. **Trackable**: All payments logged in database
5. **Revenue Tracking**: Real-time revenue dashboard

---

## 9. VIVA DEFENSE TALKING POINTS

### Key Points to Mention:

1. **Integration Complexity**:
   - "We integrated two major Nepali payment gateways"
   - "Each has different API specifications and security requirements"
   - "Khalti uses JWT-style authentication, eSewa uses HMAC signatures"

2. **Security Implementation**:
   - "All payment data is encrypted using HTTPS"
   - "We never store sensitive payment information"
   - "Backend verifies every payment with the gateway"
   - "User authentication required before payment"

3. **User Experience**:
   - "Users can choose their preferred payment method"
   - "Seamless redirect to payment gateway"
   - "Automatic booking confirmation after payment"
   - "Clear error messages if payment fails"

4. **Technical Architecture**:
   - "Frontend handles UI and redirects"
   - "Backend manages payment initiation and verification"
   - "Database stores booking and payment status"
   - "Payment gateways handle actual money transfer"

5. **Testing**:
   - "Used sandbox environments for both gateways"
   - "Tested with official test credentials"
   - "Verified all payment flows work correctly"
   - "Handled error cases and edge scenarios"

### Questions You Might Face:

**Q: Why did you choose these payment gateways?**
A: Khalti and eSewa are the most popular payment methods in Nepal. They're trusted, widely used, and have good documentation for integration.

**Q: How do you ensure payment security?**
A: We use HTTPS for all communication, verify payments with the gateway before confirming bookings, use authentication tokens, and never store sensitive payment data.

**Q: What happens if payment fails?**
A: The booking remains in "pending" status with "unpaid" payment status. User can retry payment or cancel the booking.

**Q: How do you prevent double payment?**
A: We check payment status before initiating new payment. Each transaction has a unique identifier. Backend verifies payment only once.

**Q: Can users get refunds?**
A: Yes, admin can change booking status to "cancelled" and process refunds through the payment gateway's merchant dashboard.

---

## 10. FLOW DIAGRAMS

### Khalti Payment Flow
```
User → Frontend → Backend → Khalti API → Khalti Payment Page
                                              ↓
User Pays → Khalti Processes → Redirect to Return URL
                                              ↓
Frontend → Backend → Khalti Lookup API → Verify Payment
                                              ↓
Update Booking → Confirm to User
```

### eSewa Payment Flow
```
User → Frontend → Backend → Generate Signature → Return Form Data
                                                        ↓
Frontend → Submit Form → eSewa Payment Page
                              ↓
User Pays → eSewa Processes → Redirect to Success URL
                                    ↓
Frontend → Backend → eSewa Status API → Verify Payment
                                              ↓
Update Booking → Confirm to User
```

---

## CONCLUSION

The payment system is a critical component that:
- Enables secure online transactions
- Integrates with Nepal's top payment gateways
- Provides seamless user experience
- Maintains accurate payment records
- Supports business revenue tracking

**Status**: ✅ Fully functional and tested
**Security**: ✅ Industry-standard encryption
**User Experience**: ✅ Simple and intuitive
**Reliability**: ✅ Verified with both gateways

---

**Good luck with your viva! 🎓**
