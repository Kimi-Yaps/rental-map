// src/pages/PricingStepPage.tsx
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonList,
  IonCard,
  IonCardContent,
  IonText,
  IonIcon,
  IonToast,
  IonInput,
  IonAlert,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import {
  addCircleOutline,
  removeCircleOutline,
  cashOutline,
  add,
  chevronBackOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import supabase from '../../supabaseConfig';
import Stepper from '../components/Stepper';
import NavigationButtons from '../components/NavigationButtons';

// Interface for pricing details
interface PricingDetails {
  price_type: 'monthly_rent' | 'security_deposit' | 'utilities_deposit' | 'other';
  amount: number;
  currency: string;
}

// Helper to get or initialize a rental draft from localStorage
const getProperty = (): any => {
  const saved = localStorage.getItem('Property');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.pricing || !Array.isArray(parsed.pricing)) {
        parsed.pricing = [];
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse Property from localStorage, initializing new.", e);
    }
  }
  return {
    id: '',
    pricing: [],
    created_at: new Date().toISOString(),
    updated_at: null,
  };
};

const PricingStepPage: React.FC = () => {
  const history = useHistory();
  const [pricing, setPricing] = useState<PricingDetails[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showBackAlert, setShowBackAlert] = useState(false);

  useEffect(() => {
    const draft = getProperty();
    setPricing(draft.pricing || []);
  }, []);

  const savePricingToDraft = async (updatedPricing: PricingDetails[]) => {
    const draft = getProperty();
    const updatedDraft = {
      ...draft,
      pricing: updatedPricing,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem('Property', JSON.stringify(updatedDraft));

    setToastMessage('Pricing details saved locally!');
    setShowToast(true);
  };

  const handlePricingChange = (index: number, key: keyof PricingDetails, value: any) => {
    setPricing(prevPricing => {
      const newPricing = [...prevPricing];
      if (newPricing[index]) {
        (newPricing[index] as any)[key] = value;
      }
      savePricingToDraft(newPricing);
      return newPricing;
    });
  };

  const handleAddPrice = () => {
    const newPrice: PricingDetails = {
      price_type: 'monthly_rent',
      amount: 0,
      currency: 'MYR',
    };
    const updatedPricing = [...pricing, newPrice];
    setPricing(updatedPricing);
    savePricingToDraft(updatedPricing);
  };

  const handleRemovePrice = (index: number) => {
    const updatedPricing = pricing.filter((_, i) => i !== index);
    setPricing(updatedPricing);
    savePricingToDraft(updatedPricing);
  };

  const handleNext = () => {
    savePricingToDraft(pricing);
    history.push('/photos');
  };

  const handleBack = () => {
    setShowBackAlert(true);
  };

  const confirmBack = async () => {
    setShowBackAlert(false);
    history.push('/rooms');
  };

  const cancelBack = () => {
    setShowBackAlert(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Property Pricing</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonGrid>
          <IonRow className="ion-align-items-center ion-margin-bottom">
            <IonCol size="auto">
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--ion-color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ion-color-primary-contrast)',
                fontWeight: 'bold',
                marginRight: '10px'
              }}>
                4
              </div>
            </IonCol>
            <IonCol>
              <IonText color="primary">
                <h2>Pricing Details</h2>
              </IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
              <IonText color="medium">
                <p>Please provide the pricing details for your property.</p>
              </IonText>
            </IonCol>
          </IonRow>

          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonList lines="full" className="ion-no-padding">
                {pricing.map((price, index) => (
                  <IonCard key={index} className="ion-margin-top ion-no-margin-horizontal">
                    <IonCardContent>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <IonItem lines="none" className="ion-no-padding">
                          <IonIcon icon={cashOutline} slot="start" color="primary" />
                          <IonLabel position="stacked">Price Item {index + 1}</IonLabel>
                        </IonItem>
                        <IonButton
                          fill="clear"
                          color="danger"
                          onClick={() => handleRemovePrice(index)}
                          size="small"
                        >
                          <IonIcon icon={removeCircleOutline} slot="icon-only" />
                        </IonButton>
                      </div>
                      <IonItem lines="none">
                        <IonLabel position="stacked">Price Type</IonLabel>
                        <IonSelect
                          value={price.price_type}
                          onIonChange={(e) => handlePricingChange(index, 'price_type', e.detail.value)}
                        >
                          <IonSelectOption value="monthly_rent">Monthly Rent</IonSelectOption>
                          <IonSelectOption value="security_deposit">Security Deposit</IonSelectOption>
                          <IonSelectOption value="utilities_deposit">Utilities Deposit</IonSelectOption>
                          <IonSelectOption value="other">Other</IonSelectOption>
                        </IonSelect>
                      </IonItem>
                      <IonItem>
                        <IonLabel position="stacked">Amount</IonLabel>
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <IonText style={{ marginRight: '8px', fontWeight: 'bold' }}>{price.currency}</IonText>
                          <IonInput
                            type="number"
                            value={price.amount}
                            onIonChange={(e) => handlePricingChange(index, 'amount', parseFloat(e.detail.value || '0'))}
                            placeholder="0"
                            min="0"
                            style={{ flexGrow: 1 }}
                          />
                        </div>
                      </IonItem>
                      <IonItem>
                        <IonLabel position="stacked">Currency</IonLabel>
                        <IonInput
                          value={price.currency}
                          readonly
                        />
                      </IonItem>
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>
            </IonCol>
          </IonRow>

          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleAddPrice}
                className="ion-margin-top"
              >
                <IonIcon icon={add} slot="start" />
                Add Price
              </IonButton>
            </IonCol>
          </IonRow>

          </IonGrid>
      </IonContent>
      <NavigationButtons
        onNext={handleNext}
        onBack={handleBack}
        backPath="/rooms"
        nextPath="/photos"
      />
        <IonAlert
          isOpen={showBackAlert}
          onDidDismiss={cancelBack}
          header="Go Back?"
          message="Are you sure you want to go back? Your changes on this page will not be saved."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: cancelBack
            },
            {
              text: 'Yes, Go Back',
              role: 'confirm',
              handler: confirmBack
            }
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
    </IonPage>
  );
};

export default PricingStepPage;