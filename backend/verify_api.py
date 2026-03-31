import requests

try:
    response = requests.get('http://127.0.0.1:8000/api/destinations/')
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Destinations count: {len(data)}")
        print("First destination:", data[0] if data else "None")
    else:
        print("Response:", response.text)
except Exception as e:
    print(f"Connection failed: {e}")
