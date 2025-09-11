import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonBackButton,
  useIonRouter,
  IonToast,
  IonSpinner,
  IonText,
  IonIcon
} from '@ionic/react';
import { checkmarkOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import { PersonalInfoForm, PersonalInfo } from '../components/PersonalInfoForm';
import './landlordProfile.css';

const LandlordProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const ionRouter = useIonRouter();

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '',
    email: '',
    phoneNumber: '',
    icNumber: '',
    bankName: '',
    bankAccountNumber: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        ionRouter.push('/login', 'root');
        return;
      }

      const { data: owner, error } = await supabase
        .from('property_owners')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (owner) {
        setPersonalInfo({
          fullName: owner.full_name || '',
          email: owner.email || '',
          phoneNumber: owner.phone_number || '',
          icNumber: owner.ic_number || '',
          bankName: owner.bank_name || '',
          bankAccountNumber: owner.bank_account_number || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setToastMessage('Failed to load profile data');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInfoChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!personalInfo.phoneNumber || !personalInfo.icNumber) {
      setToastMessage('Please fill in all required fields');
      setShowToast(true);
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        ionRouter.push('/login', 'root');
        return;
      }

      const { error } = await supabase
        .from('property_owners')
        .update({
          full_name: personalInfo.fullName,
          email: personalInfo.email,
          phone_number: personalInfo.phoneNumber,
          ic_number: personalInfo.icNumber,
          bank_name: personalInfo.bankName,
          bank_account_number: personalInfo.bankAccountNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setToastMessage('Profile updated successfully');
      setShowToast(true);
      ionRouter.push('/landlord', 'back');
    } catch (error) {
      console.error('Error saving profile:', error);
      setToastMessage('Failed to update profile');
      setShowToast(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/landlord" />
          </IonButtons>
          <IonTitle>Complete Your Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} disabled={saving}>
              {saving ? (
                <IonSpinner name="crescent" />
              ) : (
                <>
                  <IonIcon slot="start" icon={checkmarkOutline} />
                  Save
                </>
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <div className="ion-text-center">
            <IonSpinner />
          </div>
        ) : (
          <>
            <IonText color="medium" className="ion-text-center">
              <h2>Personal Information</h2>
              <p>Please provide your details for account verification</p>
            </IonText>

            <PersonalInfoForm
              info={personalInfo}
              onChange={handleInfoChange}
              showBankDetails
              showIcNumber
            />
          </>
        )}

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default LandlordProfilePage;
