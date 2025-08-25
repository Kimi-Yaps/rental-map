import React, { useState, useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
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
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import {
  addCircleOutline,
  cashOutline,
  add,
} from 'ionicons/icons';
import NavigationButtons from '../components/NavigationButtons';
import { Property, PriceType } from '../components/DbCrud';

const Pricing: React.FC = () => {
  const ionRouter = useIonRouter();
  const [priceData, setPriceData] = useState<PriceType>({
    monthly_rent: 0,
    security_deposit: 0,
    utilities_deposit: 0,
    other_fees: [],
    currency: 'MYR'
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('Property');
    if (saved) {
      try {
        const parsed: Property = JSON.parse(saved);
        if (parsed.pricetype) {
          setPriceData(parsed.pricetype);
        }
      } catch (error) {
        console.error("Failed to parse Property from localStorage", error);
      }
    }
  }, []);

  const savePricingToDraft = (updatedPricing: PriceType) => {
    try {
      const saved = localStorage.getItem('Property');
      const draft: Property = saved ? JSON.parse(saved) : {};
      const updatedDraft = {
        ...draft,
        pricetype: {
          ...updatedPricing,
          last_updated: new Date().toISOString()
        }
      };
      localStorage.setItem('Property', JSON.stringify(updatedDraft));
      setToastMessage('Pricing details saved');
      setShowToast(true);
    } catch (error) {
      console.error('Error saving pricing to localStorage:', error);
      setToastMessage('Error saving pricing details');
      setShowToast(true);
    }
  };

  const handlePriceChange = (field: keyof PriceType, value: number) => {
    setPriceData(prev => {
      const updated = { ...prev, [field]: value };
      savePricingToDraft(updated);
      return updated;
    });
  };

  const handleAddOtherFee = () => {
    setPriceData(prev => {
      const updated = {
        ...prev,
        other_fees: [...(prev.other_fees || []), { name: '', amount: 0 }]
      };
      savePricingToDraft(updated);
      return updated;
    });
  };

  const handleOtherFeeChange = (index: number, field: 'name' | 'amount', value: string | number) => {
    setPriceData(prev => {
      const otherFees = [...(prev.other_fees || [])];
      otherFees[index] = {
        ...otherFees[index],
        [field]: value
      };
      const updated = { ...prev, other_fees: otherFees };
      savePricingToDraft(updated);
      return updated;
    });
  };

  const handleNext = () => {
    if (!priceData.monthly_rent || priceData.monthly_rent <= 0) {
      setToastMessage('Please enter a valid monthly rent');
      setShowToast(true);
      return;
    }
    savePricingToDraft(priceData);
    ionRouter.push('/photos', 'forward');
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
              <IonCard>
                <IonCardContent>
                  <IonList lines="full">
                    <IonItem>
                      <IonLabel position="stacked">Monthly Rent*</IonLabel>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <IonIcon icon={cashOutline} slot="start" />
                        <IonText className="ion-margin-end">MYR</IonText>
                        <IonInput
                          type="number"
                          value={priceData.monthly_rent}
                          onIonChange={e => handlePriceChange('monthly_rent', Number(e.detail.value))}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Security Deposit</IonLabel>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <IonIcon icon={cashOutline} slot="start" />
                        <IonText className="ion-margin-end">MYR</IonText>
                        <IonInput
                          type="number"
                          value={priceData.security_deposit}
                          onIonChange={e => handlePriceChange('security_deposit', Number(e.detail.value))}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </IonItem>

                    <IonItem>
                      <IonLabel position="stacked">Utilities Deposit</IonLabel>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <IonIcon icon={cashOutline} slot="start" />
                        <IonText className="ion-margin-end">MYR</IonText>
                        <IonInput
                          type="number"
                          value={priceData.utilities_deposit}
                          onIonChange={e => handlePriceChange('utilities_deposit', Number(e.detail.value))}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>

              {/* Other Fees Section */}
              {priceData.other_fees && priceData.other_fees.map((fee, index) => (
                <IonCard key={index}>
                  <IonCardContent>
                    <IonItem>
                      <IonLabel position="stacked">Fee Name</IonLabel>
                      <IonInput
                        value={fee.name}
                        onIonChange={e => handleOtherFeeChange(index, 'name', e.detail.value || '')}
                        placeholder="e.g., Maintenance Fee"
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Amount</IonLabel>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <IonIcon icon={cashOutline} slot="start" />
                        <IonText className="ion-margin-end">MYR</IonText>
                        <IonInput
                          type="number"
                          value={fee.amount}
                          onIonChange={e => handleOtherFeeChange(index, 'amount', Number(e.detail.value))}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </IonItem>
                  </IonCardContent>
                </IonCard>
              ))}

              <IonButton
                expand="block"
                fill="outline"
                onClick={handleAddOtherFee}
                className="ion-margin-top"
              >
                <IonIcon icon={add} slot="start" />
                Add Other Fee
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
      <NavigationButtons
        onNext={handleNext}
        onBack={() => ionRouter.push('/rooms', 'back')}
        nextDisabled={!priceData.monthly_rent || priceData.monthly_rent <= 0}
        backPath="/rooms"
      />
    </IonPage>
  );
};

export default Pricing;
