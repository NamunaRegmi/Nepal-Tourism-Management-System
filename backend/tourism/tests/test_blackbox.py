from django.urls import reverse
from rest_framework.test import APITestCase
from tourism.models import User, Destination, Package, Hotel
from datetime import date, timedelta


class BlackBoxTests(APITestCase):
    def setUp(self):
        # Create a destination
        self.dest = Destination.objects.create(
            name='TestDest', province='Bagmati', description='Desc', best_time_to_visit='Any')

        # Create provider
        self.provider = User.objects.create_user(username='prov', email='prov@example.com', role='provider')
        self.provider.set_password('provpass')
        self.provider.save()

        # Create admin
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', role='admin', is_staff=True, is_superuser=True)
        self.admin.set_password('password123')
        self.admin.save()

        # Create a package by provider
        self.package = Package.objects.create(provider=self.provider, name='PKG', description='pkg', price=100.0, duration_days=3)

    def test_admin_login_with_username(self):
        resp = self.client.post('/api/auth/login/', {'email': 'admin', 'password': 'password123'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)

    def test_register_public_user(self):
        payload = {'email': 'user1@example.com', 'password': 'userpass', 'role': 'user', 'name': 'User One'}
        resp = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['user']['role'], 'user')

    def test_provider_create_hotel(self):
        # login provider
        resp = self.client.post('/api/auth/login/', {'email': 'prov', 'password': 'provpass'}, format='json')
        self.assertEqual(resp.status_code, 200)
        token = resp.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        payload = {
            'name': 'Prov Hotel',
            'description': 'Nice hotel',
            'price_per_night': 5000,
            'rating': 4.2
        }
        url = f'/api/destinations/{self.dest.id}/hotels/'
        resp2 = self.client.post(url, payload, format='json')
        self.assertEqual(resp2.status_code, 201)

    def test_booking_inquiry_to_confirmation(self):
        # create user and login
        user = User.objects.create_user(username='trav', email='trav@example.com', role='user')
        user.set_password('travpass')
        user.save()

        resp = self.client.post('/api/auth/login/', {'email': 'trav@example.com', 'password': 'travpass'}, format='json')
        self.assertEqual(resp.status_code, 200)
        user_token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {user_token}')

        start = date.today() + timedelta(days=10)
        end = start + timedelta(days=2)

        payload = {'package': self.package.id, 'start_date': start.isoformat(), 'end_date': end.isoformat(), 'total_price': '200.00'}
        resp_book = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(resp_book.status_code, 201)
        booking_id = resp_book.data['id']
        self.assertEqual(resp_book.data['status'], 'pending')

        # provider confirms booking
        resp2 = self.client.post('/api/auth/login/', {'email': 'prov', 'password': 'provpass'}, format='json')
        prov_token = resp2.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {prov_token}')

        resp_confirm = self.client.put(f'/api/bookings/{booking_id}/', {'status': 'confirmed'}, format='json')
        self.assertEqual(resp_confirm.status_code, 200)
        self.assertEqual(resp_confirm.data['status'], 'confirmed')
