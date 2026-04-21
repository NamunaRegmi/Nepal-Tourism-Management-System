import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import khaltiService from '../services/khaltiService';

const PaymentVerify = ({ onNavigate }) => {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const searchParams = new URLSearchParams(window.location.search);

      // Parse callback parameters from Khalti
      const callbackData = khaltiService.parseCallbackParams(searchParams);

      const { pidx, status: paymentStatus, transaction_id, amount, purchase_order_id } = callbackData;

      if (!pidx) {
        setStatus('error');
        setMessage('Payment verification failed. Missing payment identifier.');
        return;
      }

      if (paymentStatus === 'User canceled') {
        setStatus('error');
        setMessage('Payment was cancelled by user.');
        return;
      }

      if (paymentStatus === 'Pending') {
        setStatus('error');
        setMessage('Payment is still pending. Please check back later.');
        return;
      }

      if (paymentStatus !== 'Completed') {
        setStatus('error');
        setMessage(`Payment failed with status: ${paymentStatus || 'Unknown'}`);
        return;
      }

      try {
        // Verify payment with backend using lookup API
        const response = await khaltiService.verifyPayment(pidx);

        if (response.success) {
          setStatus('success');
          setMessage('Payment verified successfully!');
          setBookingDetails({
            bookingId: purchase_order_id,
            transactionId: transaction_id,
            amount: amount,
            paymentMethod: 'Khalti',
            paymentDetails: response.payment_details
          });
        } else {
          setStatus('error');
          setMessage(response.error || 'Payment verification failed.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Payment verification failed. Please try again.');
        console.error('Payment verification error:', error);
      }
    };

    verifyPayment();
  }, []);

  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate('home');
    } else {
      window.location.href = '/';
    }
  };

  const handleViewBookings = () => {
    if (onNavigate) {
      onNavigate('user-bookings');
    } else {
      window.location.href = '/';
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifying Payment</h3>
              <p className="text-sm text-gray-600">Please wait while we verify your payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-sm text-gray-600 mb-4">{message}</p>
              <div className="space-y-2">
                <Button onClick={handleGoHome} variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center space-y-4 p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-sm text-gray-600 mb-4">{message}</p>

            {bookingDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left w-full">
                <h4 className="font-semibold text-gray-900 mb-2">Booking Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-medium">{bookingDetails.bookingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium">{bookingDetails.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">Rs. {Number(bookingDetails.amount).toLocaleString('en-NP')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{bookingDetails.paymentMethod}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 w-full">
              <Button onClick={handleViewBookings} className="w-full">
                View My Bookings
              </Button>
              <Button onClick={handleGoHome} variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentVerify;
