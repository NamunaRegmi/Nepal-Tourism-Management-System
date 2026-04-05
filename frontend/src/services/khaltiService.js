import api from './api';

class KhaltiService {
  /**
   * Khalti Payment Service for Nepal Tourism Management System
   * Based on official Khalti documentation: https://docs.khalti.com/khalti-epayment/
   */

  /**
   * Initiate Khalti payment for a booking
   * @param {number} bookingId - The booking ID
   * @param {string} returnUrl - The return URL after payment
   * @returns {Promise} - Payment initiation response
   */
  async initiatePayment(bookingId, returnUrl = null) {
    try {
      console.log('Initiating Khalti payment for booking:', bookingId);
      
      const response = await api.post('/payment/khalti/initiate/', {
        booking_id: bookingId,
        return_url: returnUrl || `${window.location.origin}/payment/verify`
      });
      
      console.log('Khalti initiation response:', response.data);
      
      if (response.data.payment_url && response.data.pidx) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Invalid payment response');
      }
    } catch (error) {
      console.error('Khalti payment initiation failed:', error);
      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.error || error.message || 'Payment initiation failed';
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify Khalti payment using lookup API
   * @param {string} pidx - The payment identifier
   * @returns {Promise} - Payment verification response
   */
  async verifyPayment(pidx) {
    try {
      const response = await api.post('/payment/khalti/verify/', { pidx });
      return response.data;
    } catch (error) {
      console.error('Khalti payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Check payment status using pidx
   * @param {string} pidx - Payment index
   * @returns {Promise} - Payment status response
   */
  async getPaymentStatus(pidx) {
    try {
      const response = await api.get(`/payment/khalti/status/${pidx}/`);
      return response.data;
    } catch (error) {
      console.error('Khalti payment status check failed:', error);
      throw error;
    }
  }

  /**
   * Open Khalti payment in a new window
   * @param {string} paymentUrl - The payment URL from Khalti
   * @returns {Promise} - Promise that resolves when payment is completed
   */
  openPaymentWindow(paymentUrl) {
    return new Promise((resolve, reject) => {
      // Open payment window
      const paymentWindow = window.open(
        paymentUrl,
        'khalti-payment',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!paymentWindow) {
        reject(new Error('Failed to open payment window. Please allow popups for this site.'));
        return;
      }

      // Listen for messages from the payment window
      const messageHandler = (event) => {
        // Verify the origin for security
        if (event.origin !== window.location.origin && event.origin !== 'https://dev.khalti.com' && event.origin !== 'https://khalti.com') {
          return;
        }

        if (event.data.type === 'KHALTI_PAYMENT_SUCCESS') {
          paymentWindow.close();
          resolve(event.data.payload);
        } else if (event.data.type === 'KHALTI_PAYMENT_ERROR') {
          paymentWindow.close();
          reject(new Error(event.data.error));
        } else if (event.data.type === 'KHALTI_PAYMENT_CLOSE') {
          paymentWindow.close();
          reject(new Error('Payment window closed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Check if window is closed periodically
      const checkClosed = setInterval(() => {
        if (paymentWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          reject(new Error('Payment window closed'));
        }
      }, 1000);

      // Timeout after 30 minutes
      setTimeout(() => {
        if (!paymentWindow.closed) {
          paymentWindow.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          reject(new Error('Payment timeout'));
        }
      }, 30 * 60 * 1000);
    });
  }

  /**
   * Handle payment callback from URL parameters
   * @param {URLSearchParams} searchParams - URL search parameters
   * @returns {Object} - Parsed callback data
   */
  parseCallbackParams(searchParams) {
    return {
      pidx: searchParams.get('pidx'),
      status: searchParams.get('status'),
      transaction_id: searchParams.get('transaction_id'),
      tidx: searchParams.get('tidx'),
      amount: searchParams.get('amount'),
      mobile: searchParams.get('mobile'),
      purchase_order_id: searchParams.get('purchase_order_id'),
      purchase_order_name: searchParams.get('purchase_order_name'),
      total_amount: searchParams.get('total_amount')
    };
  }
}

export default new KhaltiService();
