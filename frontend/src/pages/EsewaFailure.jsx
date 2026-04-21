import { XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function EsewaFailure({ onNavigate }) {
  const urlParams = new URLSearchParams(window.location.search);
  const transactionUuid = urlParams.get('transaction_uuid');
  const productCode = urlParams.get('product_code');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-600" />
          </div>
          <CardTitle className="text-red-600">Payment Failed</CardTitle>
          <CardDescription>
            Your eSewa payment was not completed. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactionUuid && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium">{transactionUuid}</span>
              </div>
              {productCode && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Product Code:</span>
                  <span className="font-medium">{productCode}</span>
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Button
              onClick={() => onNavigate ? onNavigate('home') : window.location.href = '/'}
              className="w-full"
            >
              Go Home
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
