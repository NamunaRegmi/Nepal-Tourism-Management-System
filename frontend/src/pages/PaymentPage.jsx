import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, ShieldCheck, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { bookingService } from '../services/api';
import esewaService from '../services/esewaService';
import toast from 'react-hot-toast';

const formatNPR = (amount) => `Rs. ${Number(amount || 0).toLocaleString('en-NP')}`;

export default function PaymentPage({ onNavigate }) {
  // Get bookingId from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('esewa');

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const response = await bookingService.getById(bookingId);
        setBooking(response.data);
      } catch (err) {
        setError('Failed to load booking details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handlePayment = async () => {
    if (!bookingId) return;

    setProcessing(true);
    setError('');

    try {
      localStorage.setItem('esewa_booking_id', bookingId);
      const successUrl = `${window.location.origin}/payment/esewa/success`;
      const failureUrl = `${window.location.origin}/payment/esewa/failure`;
      await esewaService.processPayment(bookingId, successUrl, failureUrl);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSkipPayment = () => {
    toast.success('Booking created. Payment is still pending.');
    if (onNavigate) {
      onNavigate('user-bookings');
    } else {
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => onNavigate ? onNavigate('home') : window.location.href = '/'}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roomDetails = booking?.room_details;
  const packageDetails = booking?.package_details;
  const isPackageBooking = Boolean(packageDetails);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => onNavigate ? onNavigate('home') : window.history.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-blue-600" />
              Complete Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Booking Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Booking ID</span>
                <span className="font-medium">#{booking?.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Booking type</span>
                <span className="font-medium">{isPackageBooking ? 'Package booking' : 'Room booking'}</span>
              </div>
              {roomDetails && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Room Type</span>
                    <span className="font-medium">{roomDetails.room_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Hotel</span>
                    <span className="font-medium">{roomDetails.hotel_name}</span>
                  </div>
                </>
              )}
              {packageDetails && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Package</span>
                    <span className="font-medium">{packageDetails.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Provider</span>
                    <span className="font-medium">{packageDetails.provider_name || 'Tour provider'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{packageDetails.duration_days} days</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{isPackageBooking ? 'Tour starts' : 'Check-in'}</span>
                <span className="font-medium">{booking?.start_date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{isPackageBooking ? 'Tour ends' : 'Check-out'}</span>
                <span className="font-medium">{booking?.end_date}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-2">
                <span>Total Amount</span>
                <span className="text-blue-600">{formatNPR(booking?.total_price)}</span>
              </div>
            </div>

            {/* Payment Method — eSewa only */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
              <div className="p-4 border-2 border-green-600 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wallet className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700">eSewa</p>
                    <p className="text-xs text-green-600">Digital wallet payment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  <strong>Secure Payment:</strong> Your payment is encrypted and secure. eSewa supports mobile banking, cards, and wallet balance.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkipPayment} disabled={processing} className="flex-1">
                Pay Later
              </Button>
              <Button
                onClick={handlePayment}
                disabled={processing}
                className="flex-1 gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {processing ? 'Processing...' : 'Pay with eSewa'}
                <Wallet className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
