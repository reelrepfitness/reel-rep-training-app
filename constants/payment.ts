export interface PaymentAPIConfig {
  baseURL: string;
  apiKey?: string;
  environment: 'sandbox' | 'production';
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName: string;
  orderId: string;
  metadata?: Record<string, string>;
  callbackURL?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
  redirectURL?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export interface CreditCardDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

export const PAYMENT_CONFIG: PaymentAPIConfig = {
  baseURL: process.env.EXPO_PUBLIC_PAYMENT_API_URL || 'https://api.payment-provider.com',
  environment: 'sandbox',
};

export async function processPayment(
  request: PaymentRequest,
  cardDetails?: CreditCardDetails
): Promise<PaymentResponse> {
  console.log('Processing payment...', { request, cardDetails });
  
  try {
    const response = await fetch(`${PAYMENT_CONFIG.baseURL}/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYMENT_CONFIG.apiKey || 'demo'}`,
      },
      body: JSON.stringify({
        ...request,
        cardDetails,
      }),
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      transactionId: data.transactionId,
      errorMessage: data.error,
      status: data.status || 'pending',
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      errorMessage: (error as Error).message,
      status: 'failed',
    };
  }
}

export async function verifyPayment(transactionId: string): Promise<PaymentResponse> {
  console.log('Verifying payment...', transactionId);
  
  try {
    const response = await fetch(`${PAYMENT_CONFIG.baseURL}/verify/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${PAYMENT_CONFIG.apiKey || 'demo'}`,
      },
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      transactionId: data.transactionId,
      status: data.status,
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      errorMessage: (error as Error).message,
      status: 'failed',
    };
  }
}
