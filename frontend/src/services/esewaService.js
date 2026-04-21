import api from './api';

class EsewaService {
  /**
   * eSewa Payment Service for Nepal Tourism Management System
   * Based on official eSewa documentation: https://developer.esewa.com.np/
   */

  /**
   * Initiate eSewa payment for a booking
   * @param {number} bookingId - The booking ID
   * @param {string} successUrl - The success return URL
   * @param {string} failureUrl - The failure return URL
   * @returns {Promise} - Payment initiation response
   */
  async initiatePayment(bookingId, successUrl = null, failureUrl = null) {
    try {
      console.log('Initiating eSewa payment for booking:', bookingId);
      
      const response = await api.post('/payment/esewa/initiate/', {
        booking_id: bookingId,
        success_url: successUrl || `${window.location.origin}/payment/esewa/success`,
        failure_url: failureUrl || `${window.location.origin}/payment/esewa/failure`
      });
      
      console.log('eSewa initiation response:', response.data);
      
      if (response.data.payment_url && response.data.signature) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Invalid payment response');
      }
    } catch (error) {
      console.error('eSewa payment initiation failed:', error);
      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.error || error.message || 'Payment initiation failed';
      throw new Error(errorMessage);
    }
  }

  /**
   * Verify eSewa payment after completion
   * @param {string} transactionUuid - The transaction UUID
   * @param {string} totalAmount - The total amount
   * @param {string} productCode - The product code (merchant ID)
   * @returns {Promise} - Payment verification response
   */
  async verifyPayment(transactionUuid, totalAmount, productCode = null) {
    try {
      const response = await api.post('/payment/esewa/verify/', {
        transaction_uuid: transactionUuid,
        total_amount: totalAmount,
        product_code: productCode
      });
      return response.data;
    } catch (error) {
      console.error('eSewa payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Submit eSewa payment form
   * Creates a hidden form and submits it to eSewa
   * @param {Object} paymentData - Payment data from initiation
   */
  submitPaymentForm(paymentData) {
    // Create a form element
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = paymentData.payment_url;
    
    // Add all payment parameters as hidden inputs
    const fields = [
      'amount',
      'tax_amount',
      'total_amount',
      'transaction_uuid',
      'product_code',
      'product_service_charge',
      'product_delivery_charge',
      'success_url',
      'failure_url',
      'signed_field_names',
      'signature'
    ];
    
    console.log('Creating eSewa payment form with data:', paymentData);
    
    fields.forEach(field => {
      if (paymentData[field] !== undefined) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = field;
        input.value = paymentData[field];
        form.appendChild(input);
        console.log(`Added field ${field}:`, paymentData[field]);
      }
    });
    
    // Append form to body and submit
    document.body.appendChild(form);
    console.log('Submitting eSewa payment form to:', paymentData.payment_url);
    console.log('Form HTML:', form.innerHTML);
    form.submit();
  }

  decodeCallbackPayload(encodedPayload) {
    if (!encodedPayload) {
      return null;
    }

    try {
      const normalizedPayload = encodedPayload
        .replace(/ /g, '+')
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const padding = '='.repeat((4 - (normalizedPayload.length % 4)) % 4);
      const decodedPayload = atob(`${normalizedPayload}${padding}`);

      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Failed to decode eSewa callback payload:', error);
      return null;
    }
  }

  /**
   * Handle payment callback from URL parameters
   * @param {URLSearchParams} searchParams - URL search parameters
   * @returns {Object} - Parsed callback data
   */
  parseCallbackParams(searchParams) {
    const encodedPayload = searchParams.get('data');
    const decodedPayload = this.decodeCallbackPayload(encodedPayload);

    if (decodedPayload) {
      return {
        transaction_uuid: decodedPayload.transaction_uuid || null,
        transaction_code: decodedPayload.transaction_code || null,
        total_amount: decodedPayload.total_amount?.toString() || null,
        product_code: decodedPayload.product_code || null,
        status: decodedPayload.status || null,
        signed_field_names: decodedPayload.signed_field_names || null,
        signature: decodedPayload.signature || null
      };
    }

    return {
      transaction_uuid: searchParams.get('transaction_uuid'),
      transaction_code: searchParams.get('transaction_code'),
      total_amount: searchParams.get('total_amount'),
      product_code: searchParams.get('product_code'),
      status: searchParams.get('status'),
      signed_field_names: searchParams.get('signed_field_names'),
      signature: searchParams.get('signature')
    };
  }

  /**
   * Process eSewa payment
   * Initiates payment and submits the form
   * @param {number} bookingId - The booking ID
   * @param {string} successUrl - Success return URL
   * @param {string} failureUrl - Failure return URL
   * @returns {Promise} - Resolves when form is submitted
   */
  async processPayment(bookingId, successUrl = null, failureUrl = null) {
    try {
      const paymentData = await this.initiatePayment(bookingId, successUrl, failureUrl);
      
      // Submit the form to eSewa
      this.submitPaymentForm(paymentData);
      
      return { success: true };
    } catch (error) {
      console.error('eSewa payment processing failed:', error);
      throw error;
    }
  }
}

export default new EsewaService();
