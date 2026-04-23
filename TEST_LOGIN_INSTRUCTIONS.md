# Login Authorization Blocked - Fix Instructions

## Issue
Getting "authorization blocked" error when trying to login.

## Fixes Applied

### 1. Enhanced CORS Configuration
**File**: `backend/backend/settings.py`

Added explicit CORS headers and methods:
```python
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
```

### 2. Verified Credentials
Provider account verified:
- ✅ Email: provider@example.com
- ✅ Password: provider123
- ✅ Role: provider
- ✅ Account active

## Steps to Fix

### Step 1: Restart Backend Server
```bash
# Stop the current server (Ctrl+C)
cd Nepal-Tourism-Management-System/backend
python manage.py runserver
```

### Step 2: Restart Frontend Server
```bash
# Stop the current server (Ctrl+C)
cd Nepal-Tourism-Management-System/frontend
npm run dev
```

### Step 3: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click on refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use Ctrl + Shift + Delete → Clear cache

### Step 4: Clear LocalStorage
Open browser console (F12) and run:
```javascript
localStorage.clear();
sessionStorage.clear();
```

### Step 5: Try Login Again
1. Go to login page
2. Enter credentials:
   - Email: provider@example.com
   - Password: provider123
3. Click Login

## Troubleshooting

### Check 1: Backend Server Running
```bash
# Should see:
# Starting development server at http://127.0.0.1:8000/
```

### Check 2: Frontend Server Running
```bash
# Should see:
# Local: http://localhost:5173/
```

### Check 3: Check Browser Console
Open DevTools (F12) → Console tab
Look for errors like:
- CORS errors
- Network errors
- 401/403 errors

### Check 4: Check Network Tab
Open DevTools (F12) → Network tab
1. Try to login
2. Look for POST request to `/api/auth/login/`
3. Check response:
   - Status should be 200 OK
   - Response should have `access` token

### Check 5: Test Login API Directly
Open a new terminal and run:
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"provider@example.com","password":"provider123"}'
```

Expected response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "provider",
    "email": "provider@example.com",
    "role": "provider"
  },
  "message": "Login successful"
}
```

## Common Issues

### Issue 1: CORS Error
**Error**: "Access to XMLHttpRequest blocked by CORS policy"

**Solution**:
1. Restart backend server
2. Clear browser cache
3. Make sure frontend is running on http://localhost:5173

### Issue 2: 401 Unauthorized
**Error**: "Invalid email or password"

**Solution**:
1. Verify credentials are correct
2. Run password reset script:
```bash
cd Nepal-Tourism-Management-System/backend
python scripts/test_login.py
```

### Issue 3: Network Error
**Error**: "Network Error" or "ERR_CONNECTION_REFUSED"

**Solution**:
1. Check backend server is running on port 8000
2. Check frontend is trying to connect to http://127.0.0.1:8000
3. Check firewall settings

### Issue 4: Token Not Saved
**Error**: Login successful but redirects back to login

**Solution**:
1. Check browser console for localStorage errors
2. Make sure cookies are enabled
3. Check if browser is blocking third-party cookies

## Manual Login Test

### Using Browser Console
1. Open browser console (F12)
2. Go to login page
3. Run this code:

```javascript
fetch('http://127.0.0.1:8000/api/auth/login/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'provider@example.com',
    password: 'provider123'
  })
})
.then(res => res.json())
.then(data => {
  console.log('Login response:', data);
  if (data.access) {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    console.log('✅ Login successful! Tokens saved.');
    window.location.href = '/provider-dashboard';
  }
})
.catch(err => console.error('Login error:', err));
```

## Verification Checklist

- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 5173
- [ ] Browser cache cleared
- [ ] LocalStorage cleared
- [ ] CORS settings updated
- [ ] Provider account exists
- [ ] Password is correct
- [ ] No console errors
- [ ] Network tab shows 200 OK response

## Alternative: Use Different Browser

If still not working, try:
1. Open in Incognito/Private mode
2. Try different browser (Chrome, Firefox, Edge)
3. Disable browser extensions temporarily

## Files Modified

1. `backend/backend/settings.py`
   - Added CORS_ALLOW_HEADERS
   - Added CORS_ALLOW_METHODS

2. `backend/scripts/test_login.py`
   - Created credential verification script

## Expected Behavior After Fix

1. Enter credentials on login page
2. Click Login button
3. See loading state
4. Redirect to provider dashboard
5. See "Welcome back, Service Provider!" message
6. See Tour Packages tab in sidebar

## Still Not Working?

If you're still getting "authorization blocked":

1. **Check exact error message** in browser console
2. **Share the error** - copy the full error message
3. **Check Network tab** - what's the status code?
4. **Try curl command** - does direct API call work?
5. **Check backend logs** - any errors in terminal?

## Quick Fix Commands

Run these in order:

```bash
# 1. Stop all servers (Ctrl+C in both terminals)

# 2. Restart backend
cd Nepal-Tourism-Management-System/backend
python manage.py runserver

# 3. In new terminal, restart frontend
cd Nepal-Tourism-Management-System/frontend
npm run dev

# 4. Open browser in incognito mode
# 5. Go to http://localhost:5173
# 6. Try login
```

## Contact Information

If still having issues, provide:
1. Exact error message from console
2. Network tab screenshot
3. Backend terminal output
4. Frontend terminal output

---

**Status**: CORS configuration updated, credentials verified
**Next Step**: Restart both servers and try login
