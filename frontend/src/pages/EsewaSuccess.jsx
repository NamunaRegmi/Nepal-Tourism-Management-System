import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import esewaService from '../services/esewaService';

export default function EsewaSuccess({ onNavigate }) {
  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);

        // Log the full URL for debugging
        console.log('Full URL:', window.location.href);
        console.log('Search params:', window.location.search);
        console.log('All URL params:', Object.fromEntries(urlParams.entries()));
        
        // Parse callback parameters
        const callbackData = esewaService.parseCallbackParams(urlParams);
        
        console.log('eSewa callback data:', callbackData);

        // If no parameters from eSewa, we can't verify
        if (!callbackData.transaction_uuid || !callbackData.total_amount) {
          // Clean up stored booking ID if present
          localStorage.removeItem('esewa_booking_id');

          setError('Invalid payment callback. Missing transaction details from eSewa. Please try the payment again.');
          setVerifying(false);
          return;
        }

        // Clean up stored booking ID now that we have real callback params
        localStorage.removeItem('esewa_booking_id');

        // Verify payment with backend
        const result = await esewaService.verifyPayment(
          callbackData.transaction_uuid,
          callbackData.total_amount,
          callbackData.product_code
        );

        console.log('Verification result:', result);

        if (result.success) {
          setVerificationResult(result);
        } else {
          throw new Error(result.message || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError(err.message || 'Failed to verify payment');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, []);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>
            <CardTitle>Verifying Payment</CardTitle>
            <CardDescription>
              Please wait while we verify your eSewa payment...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Payment Verification Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => onNavigate ? onNavigate('home') : window.location.href = '/'}
              className="w-full"
              variant="outline"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Payment Successful!</CardTitle>
          <CardDescription>
            Your payment has been verified and your booking is confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationResult && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-medium">#{verificationResult.booking_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium">{verificationResult.payment_details?.ref_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">NPR {verificationResult.payment_details?.total_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Confirmed</span>
              </div>
            </div>
          )}
          <Button
            onClick={() => onNavigate ? onNavigate('user-bookings') : window.location.href = '/'}
            className="w-full"
          >
            View My Bookings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
