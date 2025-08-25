import React from 'react';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonCard,
  IonCardContent,
  IonText,
  IonIcon
} from '@ionic/react';
import { personOutline, callOutline, mailOutline, cardOutline, businessOutline } from 'ionicons/icons';

export interface PersonalInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  icNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
}

interface PersonalInfoFormProps {
  info: PersonalInfo;
  onChange: (field: keyof PersonalInfo, value: string) => void;
  showBankDetails?: boolean;
  showIcNumber?: boolean;
  readOnly?: boolean;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  info,
  onChange,
  showBankDetails = false,
  showIcNumber = false,
  readOnly = false
}) => {
  return (
    <IonCard>
      <IonCardContent>
        <IonItem className="ion-margin-bottom">
          <IonIcon icon={personOutline} slot="start" color="medium" />
          <IonLabel position="floating">Full Name</IonLabel>
          <IonInput
            type="text"
            value={info.fullName}
            onIonInput={e => onChange('fullName', e.detail.value!)}
            readonly={readOnly}
            autocomplete="name"
          />
        </IonItem>

        <IonItem className="ion-margin-bottom">
          <IonIcon icon={mailOutline} slot="start" color="medium" />
          <IonLabel position="floating">Email</IonLabel>
          <IonInput
            type="email"
            value={info.email}
            onIonInput={e => onChange('email', e.detail.value!)}
            readonly={readOnly}
            autocomplete="email"
          />
        </IonItem>

        <IonItem className="ion-margin-bottom">
          <IonIcon icon={callOutline} slot="start" color="medium" />
          <IonLabel position="floating">Phone Number</IonLabel>
          <IonInput
            type="tel"
            value={info.phoneNumber}
            onIonInput={e => onChange('phoneNumber', e.detail.value!)}
            readonly={readOnly}
            autocomplete="tel"
          />
        </IonItem>

        {showIcNumber && (
          <IonItem className="ion-margin-bottom">
            <IonIcon icon={cardOutline} slot="start" color="medium" />
            <IonLabel position="floating">IC Number</IonLabel>
            <IonInput
              type="text"
              value={info.icNumber}
              onIonInput={e => onChange('icNumber', e.detail.value!)}
              readonly={readOnly}
            />
          </IonItem>
        )}

        {showBankDetails && (
          <>
            <IonText color="medium" className="ion-margin-bottom">
              <h3>Bank Details</h3>
            </IonText>
            
            <IonItem className="ion-margin-bottom">
              <IonIcon icon={businessOutline} slot="start" color="medium" />
              <IonLabel position="floating">Bank Name</IonLabel>
              <IonInput
                type="text"
                value={info.bankName}
                onIonInput={e => onChange('bankName', e.detail.value!)}
                readonly={readOnly}
              />
            </IonItem>

            <IonItem className="ion-margin-bottom">
              <IonIcon icon={cardOutline} slot="start" color="medium" />
              <IonLabel position="floating">Bank Account Number</IonLabel>
              <IonInput
                type="text"
                value={info.bankAccountNumber}
                onIonInput={e => onChange('bankAccountNumber', e.detail.value!)}
                readonly={readOnly}
                autocomplete="off"
              />
            </IonItem>
          </>
        )}
      </IonCardContent>

      <style>{`
        ion-item {
          --padding-start: 0;
          --inner-padding-end: 0;
          --highlight-height: 2px;
          --highlight-color-focused: var(--ion-color-primary);
          --border-color: var(--ion-color-medium);
          --border-radius: 8px;
          --background: transparent;
        }

        ion-input {
          --padding-start: 12px;
          --padding-end: 12px;
          --padding-top: 12px;
          --padding-bottom: 12px;
          --border-radius: 8px;
          --background: var(--ion-color-light);
        }

        ion-icon {
          font-size: 20px;
          margin-right: 8px;
        }
      `}</style>
    </IonCard>
  );
};
