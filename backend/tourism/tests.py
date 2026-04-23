
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from .models import Booking, User
from .esewa_integration import EsewaPaymentGateway


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_rejects_public_admin_signup(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'admin-request@example.com',
                'password': 'SafePass123!',
                'name': 'Admin Request',
                'role': 'admin',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(User.objects.count(), 0)

    def test_register_allows_same_local_part_for_different_emails(self):
        first = self.client.post(
            '/api/auth/register/',
            {
                'email': 'sam@example.com',
                'password': 'SafePass123!',
                'name': 'Sam One',
                'role': 'user',
            },
            format='json',
        )
        second = self.client.post(
            '/api/auth/register/',
            {
                'email': 'sam@another.com',
                'password': 'SafePass123!',
                'name': 'Sam Two',
                'role': 'provider',
            },
            format='json',
        )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(User.objects.filter(email__startswith='sam@').count(), 2)
        self.assertEqual(first.data['user']['username'], 'sam@example.com')
        self.assertEqual(second.data['user']['username'], 'sam@another.com')

    @patch('tourism.views.id_token.verify_oauth2_token')
    def test_google_login_does_not_escalate_existing_user_role(self, mock_verify_token):
        user = User.objects.create_user(
            username='traveler@example.com',
            email='traveler@example.com',
            password='SafePass123!',
            role='user',
        )
        mock_verify_token.return_value = {
            'email': user.email,
            'sub': 'google-user-123',
            'given_name': 'Travel',
            'family_name': 'Er',
            'picture': 'https://example.com/avatar.png',
        }

        response = self.client.post(
            '/api/auth/google/',
            {
                'credential': 'fake-google-token',
                'role': 'admin',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.role, 'user')
        self.assertEqual(response.data['user']['role'], 'user')

    @patch('tourism.views.id_token.verify_oauth2_token')
    def test_google_login_rejects_new_admin_account_creation(self, mock_verify_token):
        mock_verify_token.return_value = {
            'email': 'new-admin@example.com',
            'sub': 'google-user-999',
            'given_name': 'New',
            'family_name': 'Admin',
            'picture': 'https://example.com/admin.png',
        }

        response = self.client.post(
            '/api/auth/google/',
            {
                'credential': 'fake-google-token',
                'role': 'admin',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.objects.filter(email='new-admin@example.com').exists())


class EsewaRoutingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='traveler@test.com',
            email='traveler@test.com',
            password='SafePass123!',
            role='user',
        )

    @patch('tourism.views.EsewaPaymentGateway.verify_payment')
    def test_callback_redirects_to_requested_frontend_success_route(self, mock_verify_payment):
        booking = Booking.objects.create(
            user=self.user,
            start_date='2026-04-22',
            end_date='2026-04-23',
            total_price='1500.00',
        )
        transaction_uuid = f'BOOK-{booking.id}-20260422010101'
        mock_verify_payment.return_value = {
            'success': True,
            'transaction_uuid': transaction_uuid,
            'status': 'COMPLETE',
            'ref_id': 'REF123',
            'total_amount': '1500.0',
        }

        response = self.client.get(
            '/api/payment/esewa/callback/',
            {
                'redirect_origin': 'http://127.0.0.1:5173',
                'redirect_path': '/payment/esewa/success',
                'transaction_uuid': transaction_uuid,
                'total_amount': '1500.0',
                'product_code': 'EPAYTEST',
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertIn('http://127.0.0.1:5173/payment/esewa/success', response['Location'])
        self.assertIn(f'booking_id={booking.id}', response['Location'])

        booking.refresh_from_db()
        self.assertEqual(booking.payment_status, 'paid')
        self.assertEqual(booking.payment_method, 'esewa')
        self.assertEqual(booking.status, 'confirmed')

    @patch('tourism.views.EsewaPaymentGateway.verify_payment')
    def test_callback_redirects_to_requested_frontend_failure_route_on_invalid_params(self, mock_verify_payment):
        response = self.client.get(
            '/api/payment/esewa/callback/',
            {
                'redirect_origin': 'http://127.0.0.1:5173',
                'redirect_path': '/payment/esewa/failure',
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertIn('http://127.0.0.1:5173/payment/esewa/failure', response['Location'])
        self.assertIn('error=Invalid+callback+parameters', response['Location'])
        mock_verify_payment.assert_not_called()


class EsewaGatewayTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='esewa-user@test.com',
            email='esewa-user@test.com',
            password='SafePass123!',
            role='user',
        )
        self.booking = Booking.objects.create(
            user=self.user,
            start_date='2026-04-22',
            end_date='2026-04-23',
            total_price='2200.00',
        )

    def test_initiate_payment_generates_unique_transaction_uuid_per_attempt(self):
        gateway = EsewaPaymentGateway()

        first = gateway.initiate_payment(self.booking)
        second = gateway.initiate_payment(self.booking)

        self.assertNotEqual(first['transaction_uuid'], second['transaction_uuid'])
        self.assertTrue(first['transaction_uuid'].startswith(f'BOOK-{self.booking.id}-'))
        self.assertTrue(second['transaction_uuid'].startswith(f'BOOK-{self.booking.id}-'))
