import { useState, useEffect } from 'react';
import { ArrowLeft, Smartphone, Wallet, ShieldCheck, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { bookingService } from '../services/api';
import khaltiService from '../services/khaltiService';
import esewaService from '../services/esewaService';
import toast from 'react-hot-toast';

const formatNPR = (amount) => `Rs. ${Number(amount).toLocaleString('en-NP')}`;

export default function PaymentPage({ onNavigate }) {
  // Get bookingId from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('khalti');

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
      if (paymentMethod === 'khalti') {
        const paymentResponse = await khaltiService.initiatePayment(bookingId);
        
        if (paymentResponse.payment_url) {
          await khaltiService.openPaymentWindow(paymentResponse.payment_url);
          toast.success('Payment completed! Redirecting...');
          setTimeout(() => {
            if (onNavigate) {
              onNavigate('user-dashboard');
            } else {
              window.location.href = '/';
            }
          }, 2000);
        }
      } else if (paymentMethod === 'esewa') {
        // Store booking ID in localStorage for retrieval after eSewa redirect
        localStorage.setItem('esewa_booking_id', bookingId);
        
        const successUrl = `${window.location.origin}/payment/esewa/success`;
        const failureUrl = `${window.location.origin}/payment/esewa/failure`;
        
        console.log('Initiating eSewa payment with URLs:', { successUrl, failureUrl });
        await esewaService.processPayment(bookingId, successUrl, failureUrl);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSkipPayment = () => {
    toast.success('Booking confirmed! You can pay later.');
    if (onNavigate) {
      onNavigate('user-dashboard');
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
              <Button onClick={() => onNavigate ? onNavigate('user-dashboard') : window.location.href = '/'}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => onNavigate ? onNavigate('user-dashboard') : window.history.back()}
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
              {booking?.room_details && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Room Type</span>
                    <span className="font-medium">{booking.room_details.room_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Hotel</span>
                    <span className="font-medium">{booking.room_details.hotel_name}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Check-in</span>
                <span className="font-medium">{booking?.start_date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Check-out</span>
                <span className="font-medium">{booking?.end_date}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-2">
                <span>Total Amount</span>
                <span className="text-blue-600">{formatNPR(booking?.total_price)}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Select Payment Method</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('khalti')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'khalti'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Smartphone className={`h-10 w-10 ${paymentMethod === 'khalti' ? 'text-purple-600' : 'text-gray-400'}`} />
                    <span className={`font-semibold ${paymentMethod === 'khalti' ? 'text-purple-600' : 'text-gray-600'}`}>
                      Khalti
                    </span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setPaymentMethod('esewa')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'esewa'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Wallet className={`h-10 w-10 ${paymentMethod === 'esewa' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`font-semibold ${paymentMethod === 'esewa' ? 'text-green-600' : 'text-gray-600'}`}>
                      eSewa
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Payment Info */}
            <div className={`${paymentMethod === 'khalti' ? 'bg-purple-50 border-purple-100' : 'bg-green-50 border-green-100'} border rounded-lg p-4`}>
              <div className="flex items-start gap-3">
                <ShieldCheck className={`h-5 w-5 ${paymentMethod === 'khalti' ? 'text-purple-600' : 'text-green-600'} mt-0.5 flex-shrink-0`} />
                <div className={`text-sm ${paymentMethod === 'khalti' ? 'text-purple-800' : 'text-green-800'}`}>
                  <strong>Secure Payment:</strong> Your payment information is encrypted and secure. {paymentMethod === 'khalti' ? 'Khalti' : 'eSewa'} supports multiple payment methods including mobile banking, cards, and wallet balance.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkipPayment}
                disabled={processing}
                className="flex-1"
              >
                Pay Later
              </Button>
              <Button
                onClick={handlePayment}
                disabled={processing}
                className={`flex-1 gap-2 ${
                  paymentMethod === 'khalti'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                }`}
              >
                {processing ? 'Processing...' : `Pay with ${paymentMethod === 'khalti' ? 'Khalti' : 'eSewa'}`}
                {paymentMethod === 'khalti' ? <Smartphone className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
