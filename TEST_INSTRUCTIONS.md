# Testing Instructions - Provider Dashboard

## ✅ Backend is Ready!

The migrations have been applied successfully:
- ✓ All 14 hotels now have providers assigned
- ✓ 2 providers in the system
- ✓ API endpoint `/api/provider/hotels/` is working

## 🔍 Current Situation

You have 2 provider accounts:

1. **provider** (provider@example.com)
   - Has 13 hotels
   - Password: (you need to know this or reset it)

2. **namunaregmi0403** (namunaregmi0403@gmail.com)
   - Has 1 hotel
   - Password: (you need to know this or reset it)

## 🎯 To See Your Hotels

### Step 1: Make Sure You're Logged In as a Provider

1. Open your frontend (http://localhost:5173)
2. Click "Logout" if you're logged in
3. Click "Login"
4. Use one of these provider accounts:
   - Email: `provider@example.com`
   - Email: `namunaregmi0403@gmail.com`

### Step 2: Go to Provider Dashboard

After logging in, navigate to the Provider Dashboard. You should now see:
- If logged in as **provider@example.com**: 13 hotels
- If logged in as **namunaregmi0403@gmail.com**: 1 hotel

## 🔧 If You Don't Know the Password

### Option 1: Reset Password via Django Shell

```bash
cd Nepal-Tourism-Management-System/backend
python manage.py shell
```

Then run:
```python
from tourism.models import User

# Reset password for provider@example.com
user = User.objects.get(email='provider@example.com')
user.set_password('newpassword123')
user.save()
print(f"Password reset for {user.email}")

# Or reset for namunaregmi0403@gmail.com
user2 = User.objects.get(email='namunaregmi0403@gmail.com')
user2.set_password('newpassword123')
user2.save()
print(f"Password reset for {user2.email}")

exit()
```

### Option 2: Create a New Provider Account

1. Go to frontend
2. Click "Register"
3. Fill in details
4. **Important**: Select role as "Travel Service Provider"
5. Login with new account
6. Add hotels - they will automatically be assigned to you

## 🧪 Test the API Directly

### Get a Token First:

```bash
# Login as provider
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"provider@example.com\", \"password\": \"YOUR_PASSWORD\"}"
```

This will return something like:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {...}
}
```

### Then Get Your Hotels:

```bash
# Replace YOUR_TOKEN with the access token from above
curl -X GET http://localhost:8000/api/provider/hotels/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

You should see only the hotels belonging to that provider!

## 📊 What Changed

### Before:
```
Provider Dashboard → Shows nothing or all hotels
```

### After:
```
Provider Dashboard → Shows only YOUR hotels
- provider@example.com sees 13 hotels
- namunaregmi0403@gmail.com sees 1 hotel
```

## 🎉 Success Criteria

You'll know it's working when:
1. ✅ You can login as a provider
2. ✅ Provider dashboard shows "My Properties (X)" where X is your hotel count
3. ✅ You see only hotels you own
4. ✅ You can create new hotels (they auto-assign to you)
5. ✅ You can edit/delete only your hotels

## 🐛 Still Not Working?

### Check 1: Are you logged in as a provider?
```javascript
// Open browser console (F12)
console.log(JSON.parse(localStorage.getItem('user')))
// Should show: { role: 'provider', ... }
```

### Check 2: Is the token valid?
```javascript
// Open browser console (F12)
console.log(localStorage.getItem('access_token'))
// Should show a long JWT token
```

### Check 3: Check browser network tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Navigate to Provider Dashboard
4. Look for request to `/api/provider/hotels/`
5. Check the response

### Check 4: Backend logs
Look at your Django server console for any errors when you access the provider dashboard.

## 💡 Quick Test

Run this in your browser console while on the provider dashboard:

```javascript
fetch('http://localhost:8000/api/provider/hotels/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
.then(r => r.json())
.then(data => console.log('My hotels:', data))
.catch(err => console.error('Error:', err))
```

This should show your hotels in the console!

## 📞 Need More Help?

If hotels still aren't showing:
1. Check which user you're logged in as
2. Verify that user has role='provider'
3. Check that user has hotels assigned to them
4. Look at browser console for errors
5. Check Django server logs for errors
