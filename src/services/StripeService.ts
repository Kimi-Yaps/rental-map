import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

class StripeService {
  private static instance: StripeService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }
      this.initialized = true;
    } catch (error) {
      console.error('Stripe initialization error:', error);
      throw error;
    }
  }

  public async createPaymentIntent(amount: number): Promise<string> {
    try {
      // In a real application, you would call your backend to create a PaymentIntent
      // For now, we'll simulate this with a mock response
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'myr',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return data.clientSecret;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  public async confirmPayment(clientSecret: string): Promise<boolean> {
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      const result = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: window.location.origin + '/payment-success',
        },
      });

      // Check if there was an error
      if ('error' in result && result.error) {
        throw result.error;
      }

      // Check if paymentIntent exists and succeeded
      if ('paymentIntent' in result && result.paymentIntent) {
        const paymentIntent = result.paymentIntent as any; // Type assertion for now
        return paymentIntent.status === 'succeeded';
      }
      
      return false;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }
}

export default StripeService;