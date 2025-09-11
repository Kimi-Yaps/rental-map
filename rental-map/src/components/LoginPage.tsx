import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonContent,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonInput,
  IonSegment,
  IonSegmentButton,
  IonTitle,
} from '@ionic/react';
import { closeOutline, mailOutline, logoGoogle, logoApple } from 'ionicons/icons';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'landlord' | 'normal';
}

const LoginPage: React.FC<LoginModalProps> = ({ isOpen, onClose, userType }) => {
  const [selectedSegment, setSelectedSegment] = useState<'login' | 'signup'>('login');
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  const getTitleText = () => {
    if (userType === 'landlord') {
      return selectedSegment === 'login' ? 'Landlord Login' : 'Landlord Sign Up';
    } else {
      return selectedSegment === 'login' ? 'Login to PlaceHolder' : 'Sign Up to PlaceHolder';
    }
  };

  const getButtonText = () => {
    return selectedSegment === 'login' ? 'Continue to Login' : 'Continue to Sign Up';
  };

  const handleContinue = () => {
    // Add your authentication logic here
    console.log('Phone number:', phoneNumber);
    console.log('User type:', userType);
    console.log('Action:', selectedSegment);
  };

  const handleSocialLogin = (provider: string) => {
    // Add your social login logic here
    console.log('Social login with:', provider);
  };

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={onClose}
      // Remove breakpoints to make it full screen
      // breakpoints={[0, 0.75, 1]}
      // initialBreakpoint={0.75}
      className="login-modal-overlay" // New class for glassmorphism overlay
    >
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{getTitleText()}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon
                icon={closeOutline}
                style={{ fontSize: '24px', color: 'black' }}
              />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="login-modal-content-container">
          <div className="login-form-card">
            
            {/* Login/Sign Up Segment */}
            <IonSegment
              value={selectedSegment}
              onIonChange={(e) => setSelectedSegment(e.detail.value as 'login' | 'signup')}
              style={{ marginBottom: '24px' }}
            >
              <IonSegmentButton value="login">
                Login
              </IonSegmentButton>
              <IonSegmentButton value="signup">
                Sign Up
              </IonSegmentButton>
            </IonSegment>

            {/* Country/Region Input */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                marginBottom: '4px',
                margin: '0 0 4px 0'
              }}>
                Country/Region
              </p>
              <div style={{
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '12px',
                backgroundColor: '#f9fafb'
              }}>
                <span style={{ color: '#374151' }}>Malaysia (+60)</span>
              </div>
            </div>

            {/* Phone Number Input */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                marginBottom: '4px',
                margin: '0 0 4px 0'
              }}>
                Phone Number
              </p>
              <IonInput
                type="tel"
                placeholder="+60"
                value={phoneNumber}
                onIonInput={(e) => setPhoneNumber(e.detail.value!)}
                style={{
                  '--background': 'white',
                  '--border-color': '#d1d5db',
                  '--border-radius': '6px',
                  '--padding-start': '12px',
                  '--padding-end': '12px',
                  '--padding-top': '12px',
                  '--padding-bottom': '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>

            <p style={{ 
              fontSize: '12px', 
              color: '#6b7280', 
              marginBottom: '24px',
              textAlign: 'center',
              margin: '0 0 24px 0'
            }}>
              We'll call or text to confirm your number. Standard messages and
              data rates apply.
            </p>

            {/* Continue Button */}
            <IonButton
              expand="block"
              onClick={handleContinue}
              style={{
                '--background': 'black',
                '--background-activated': '#333',
                '--background-hover': '#333',
                '--color': 'white',
                '--border-radius': '6px',
                height: '48px',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'none',
                marginBottom: '32px'
              }}
            >
              {getButtonText()}
            </IonButton>

            {/* 'or' divider */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              margin: '32px 0'
            }}>
              <div style={{ 
                flexGrow: 1, 
                height: '1px', 
                backgroundColor: '#d1d5db'
              }}></div>
              <span style={{ 
                margin: '0 16px', 
                color: '#6b7280', 
                fontSize: '14px'
              }}>
                or
              </span>
              <div style={{ 
                flexGrow: 1, 
                height: '1px', 
                backgroundColor: '#d1d5db'
              }}></div>
            </div>

            {/* Social Login Buttons */}
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => handleSocialLogin('email')}
              style={{
                '--border-color': '#d1d5db',
                '--color': 'black',
                '--border-radius': '6px',
                height: '48px',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'none',
                marginBottom: '12px'
              }}
            >
              <IonIcon 
                slot="start" 
                icon={mailOutline} 
                style={{ fontSize: '20px', marginRight: '8px', color: 'black' }}
              />
              Continue with Email
            </IonButton>
            
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => handleSocialLogin('google')}
              style={{
                '--border-color': '#d1d5db',
                '--color': 'black',
                '--border-radius': '6px',
                height: '48px',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'none',
                marginBottom: '12px'
              }}
            >
              <IonIcon
                slot="start"
                icon={logoGoogle}
                style={{ fontSize: '20px', marginRight: '8px', color: 'black' }}
              />
              Continue with Google
            </IonButton>
            
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => handleSocialLogin('apple')}
              style={{
                '--border-color': '#d1d5db',
                '--color': 'black',
                '--border-radius': '6px',
                height: '48px',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'none',
                marginBottom: '12px'
              }}
            >
              <IonIcon 
                slot="start" 
                icon={logoApple} 
                style={{ fontSize: '20px', marginRight: '8px', color: 'black' }}
              />
              Continue with Apple
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default LoginPage;