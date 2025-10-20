import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
} from '@ionic/react';
import supabase from '../supabaseClient'; // Removed unused imports: Profile, dbService, onAuthStateChange
import './SignInPage.scss';

const SignInPage: React.FC = () => {
  const [userType, setUserType] = useState<'admin' | 'tenant' | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleUserTypeChange = (type: 'admin' | 'tenant') => {
    setUserType(type);
    setErrorMessage('');
    setAdminEmail('');
  };

  const handleAdminEmailChange = (event: CustomEvent) => {
    setAdminEmail(event.detail.value);
    setErrorMessage('');
  };

  const requestAdminSignInLink = async () => {
    if (!adminEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      // Removed unused 'data' variable
      await supabase.auth.signInWithOtp({
        email: adminEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
          data: { role: 'admin' }, // Add user role to metadata
        },
      });
      alert('Sign-in link sent! Check your email.');
      setAdminEmail('');
      setUserType(null);
    } catch (err) { // Kept 'err' for potential future use, but it's currently unused.
      setErrorMessage(err.message || 'Failed to send sign-in link.');
    } finally {
      setIsLoading(false);
    }
  };

  // Commented out Google Sign-In related code due to type errors and potential setup issues.
  // useEffect(() => {
  //   if (window.google?.accounts?.id && userType === 'tenant') {
  //     window.google.accounts.id.renderButton(
  //       document.getElementById('googleSignInButton'),
  //       { theme: 'outline', size: 'large' }
  //     );
  //   }
  // }, [userType]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Sign In</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding sign-in-container">
        <IonText>
          <h1>Welcome!</h1>
          <p>Please choose your sign-in method:</p>
        </IonText>

        <IonGrid>
          <IonRow className="user-type-selection" justify-content-center>
            <IonCol size="6" size-md="3">
              <IonButton
                expand="block"
                color={userType === 'admin' ? 'success' : 'medium'}
                onClick={() => handleUserTypeChange('admin')}
                disabled={isLoading}
              >
                Admin
              </IonButton>
            </IonCol>
            <IonCol size="6" size-md="3">
              <IonButton
                expand="block"
                color={userType === 'tenant' ? 'success' : 'medium'}
                onClick={() => handleUserTypeChange('tenant')}
                disabled={isLoading}
              >
                Tenant
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        {userType === 'admin' && (
          <div className="admin-signin-form">
            <h2>Admin Sign-In</h2>
            <IonInput
              type="email"
              placeholder="Enter your email"
              value={adminEmail}
              onIonChange={handleAdminEmailChange}
              disabled={isLoading}
            />
            <IonButton
              expand="block"
              onClick={requestAdminSignInLink}
              disabled={isLoading || !adminEmail}
            >
              {isLoading ? 'Sending...' : 'Request Sign-In Link'}
            </IonButton>
            {errorMessage && <IonText color="danger">{errorMessage}</IonText>}
          </div>
        )}

        {userType === 'tenant' && (
          <div className="tenant-signin-section">
            <h2>Tenant Sign-In</h2>
            {/* Removed the div for googleSignInButton as the functionality is commented out */}
            {errorMessage && <IonText color="danger">{errorMessage}</IonText>}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SignInPage;
