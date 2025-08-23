import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonToast,
  IonButtons,
  IonBackButton
} from '@ionic/react';

// This would typically be in a secure environment variable, e.g., import.meta.env.VITE_PAYMENT_API_KEY
const PAYMENT_API_KEY = 'YOUR_API_KEY_HERE';

/**
 * Mocks a call to a payment gateway API.
 * In a real application, this would be a call to your backend,
 * which then securely communicates with the payment provider.
 * @param paymentDetails - The payment information to process.
 */
const processPayment = async (paymentDetails: any) => {
  console.log('Processing payment with details:', paymentDetails);
  console.log('Using API Key:', PAYMENT_API_KEY);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate a successful payment based on simple validation
  if (paymentDetails.cardNumber && paymentDetails.cardHolderName && paymentDetails.amount > 0) {
    return { success: true, transactionId: `txn_${Date.now()}` };
  } else {
    // Simulate a failure
    return { success: false, message: 'Invalid card details or amount.' };
  }
};

const PaymentInsert: React.FC = () => {
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const handlePayment = async () => {
    if (!cardHolderName || !cardNumber || !expiryDate || !cvc || !amount) {
      setToastMessage('Please fill all fields.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setIsProcessing(true);

    const paymentDetails = {
      cardHolderName,
      cardNumber,
      expiryDate,
      cvc,
      amount: parseFloat(amount)
    };

    try {
      const response = await processPayment(paymentDetails);
      if (response.success) {
        setToastMessage(`Payment successful! Transaction ID: ${response.transactionId}`);
        setToastColor('success');
        // Clear form on success
        setCardHolderName('');
        setCardNumber('');
        setExpiryDate('');
        setCvc('');
        setAmount('');
      } else {
        setToastMessage(`Payment failed: ${response.message}`);
        setToastColor('danger');
      }
    } catch (error: any) {
      setToastMessage(`An error occurred: ${error.message}`);
      setToastColor('danger');
    } finally {
      setIsProcessing(false);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Make a Payment</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Payment Details</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonInput label="Cardholder Name" labelPlacement="floating" value={cardHolderName} onIonInput={(e) => setCardHolderName(e.detail.value!)} placeholder="John Doe" />
                  </IonItem>
                  <IonItem>
                    <IonInput label="Card Number" labelPlacement="floating" type="tel" value={cardNumber} onIonInput={(e) => setCardNumber(e.detail.value!)} placeholder="0000 0000 0000 0000" maxlength={19} />
                  </IonItem>
                  <IonRow>
                    <IonCol size="6">
                      <IonItem>
                        <IonInput label="Expiry (MM/YY)" labelPlacement="floating" value={expiryDate} onIonInput={(e) => setExpiryDate(e.detail.value!)} placeholder="MM/YY" maxlength={5} />
                      </IonItem>
                    </IonCol>
                    <IonCol size="6">
                      <IonItem>
                        <IonInput label="CVC" labelPlacement="floating" type="tel" value={cvc} onIonInput={(e) => setCvc(e.detail.value!)} placeholder="123" maxlength={4} />
                      </IonItem>
                    </IonCol>
                  </IonRow>
                  <IonItem>
                    <IonInput label="Amount (MYR)" labelPlacement="floating" type="number" value={amount} onIonInput={(e) => setAmount(e.detail.value!)} placeholder="e.g., 50.00" />
                  </IonItem>
                  <IonButton expand="block" onClick={handlePayment} disabled={isProcessing} className="ion-margin-top">
                    {isProcessing ? <IonSpinner name="crescent" /> : `Pay ${amount ? `MYR ${amount}` : ''}`}
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          color={toastColor}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

export default PaymentInsert;