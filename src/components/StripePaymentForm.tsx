import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonToast,
  IonLoading,
} from '@ionic/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import StripeService from '../services/StripeService';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentFormProps {
  clientSecret: string;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const card = elements.getElement(CardElement);
      if (!card) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            name: 'Customer Name', // In a real app, this would come from form input
          },
        },
      });

      if (error) {
        setMessage(error.message || 'An error occurred');
        setShowToast(true);
      } else if (paymentIntent?.status === 'succeeded') {
        setMessage('Payment successful!');
        setShowToast(true);
        // Redirect to success page or update UI
      }
    } catch (error) {
      console.error('Payment error:', error);
      setMessage('Payment failed. Please try again.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Payment</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <form onSubmit={handleSubmit}>
              <IonText>
                <h3>Enter your payment information</h3>
              </IonText>
              
              <div style={{ marginBottom: '20px' }}>
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                />
              </div>

              <IonButton
                expand="block"
                type="submit"
                disabled={!stripe || loading}
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </IonButton>
            </form>

            {message && (
              <IonText color={message.includes('successful') ? 'success' : 'danger'}>
                <p>{message}</p>
              </IonText>
            )}
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={message || ''}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

interface StripePaymentFormWrapperProps {
  clientSecret: string;
}

const StripePaymentFormWrapper: React.FC<StripePaymentFormWrapperProps> = ({ clientSecret }) => {
  return (
    <Elements stripe={stripePromise}>
      <StripePaymentForm clientSecret={clientSecret} />
    </Elements>
  );
};

export default StripePaymentFormWrapper;