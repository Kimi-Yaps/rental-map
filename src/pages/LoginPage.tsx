import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonInput,
  IonSegment,
  IonSegmentButton,
  IonPage,
  useIonRouter,
  IonToast,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonFooter,
  IonSpinner,
  IonText
} from '@ionic/react';
import { arrowBackOutline, logoGoogle, mailOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import supabase from '../supabaseConfig';
import { useLocation } from 'react-router-dom';
import { Profile } from '../components/DbCrud';

import './Main.css';
import '../theme/variables.css';

declare global {
  interface Window {
    google: any;
  }
}

const LoginPage: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  
  const location = useLocation<{ userType: 'landlord' | 'normal' }>();
  const ionRouter = useIonRouter();

  const userType = location.state?.userType || 'normal';

  const [nonce, setNonce] = useState<string>('');

  useEffect(() => {
    const generateAndSetNonce = () => {
      const newNonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
      setNonce(newNonce);
    };
    generateAndSetNonce();
  }, []);

  useEffect(() => {
    if (!nonce) return;
    const initializeGSI = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
          callback: (window as any).handleSignInWithGoogle,
          nonce: nonce,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      } else {
        setTimeout(initializeGSI, 100);
      }
    };

    initializeGSI();
  }, [nonce]);

  useEffect(() => {
    (window as any).handleSignInWithGoogle = async (response: any) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
          nonce: nonce,
        });

        if (error) {
          setToastMessage(`Authentication error: ${error.message}`);
          setShowToast(true);
        } else {
          // Auth state change listener will handle navigation
        }
      } catch (error) {
        setToastMessage('An unexpected error occurred. Please try again.');
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };

    return () => {
      delete (window as any).handleSignInWithGoogle;
    };
  }, [nonce]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle();

            if (!profile) {
              const profileData: Partial<Profile> = {
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
                avatar_url: session.user.user_metadata?.avatar_url || null,
                user_type: userType === 'landlord' ? 'property_owner' : 'tenant',
              };

              const { error: insertError } = await supabase
                .from('profiles')
                .insert(profileData);

              if (insertError) {
                console.error('Error creating profile:', insertError);
              }
            }
          } catch (error) {
            console.error('Error in onAuthStateChange profile handling:', error);
          }
          
          ionRouter.push('/home', 'forward');
        } else if (event === 'SIGNED_OUT') {
          // console.log('User signed out');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [userType, ionRouter]);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setToastMessage('Please enter both email and password');
      setShowToast(true);
      return;
    }

    setIsLoading(true);

    try {
      let result;
      
      if (selectedSegment === 'login') {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password, options: { data: { user_type: userType } } });
      }

      const { data, error } = result;

      if (error) {
        setToastMessage(error.message);
        setShowToast(true);
      } else if (selectedSegment === 'signup' && data.user && !data.session) {
        setToastMessage('Please check your email to confirm your account');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('An unexpected error occurred. Please try again.');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    ionRouter.goBack();
  };

  const getTitle = () => {
    if (userType === 'landlord') {
        return selectedSegment === 'login' ? 'Landlord Login' : 'Landlord Sign Up';
    }
    return selectedSegment === 'login' ? 'Welcome Back' : 'Create Account';
  }

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBack}>
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonGrid style={{ height: '100%' }}>
          <IonRow className="ion-justify-content-center ion-align-items-center" style={{ height: '100%' }}>
            <IonCol size="12" size-md="6" size-lg="4">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle className="ion-text-center">{getTitle()}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonSegment
                    value={selectedSegment}
                    onIonChange={(e) => setSelectedSegment(e.detail.value as 'login' | 'signup')}
                    style={{ marginBottom: '1.5rem' }}
                  >
                    <IonSegmentButton value="login">
                      Login
                    </IonSegmentButton>
                    <IonSegmentButton value="signup">
                      Sign Up
                    </IonSegmentButton>
                  </IonSegment>

                  <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(); }}>
                    <IonInput
                      className="custom-input"
                      label="Email"
                      labelPlacement="floating"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onIonInput={(e) => setEmail(e.detail.value!)}
                      autocomplete="username"
                      style={{ marginBottom: '1rem' }}
                    />
                    <div style={{ position: 'relative' }}>
                      <IonInput
                        className="custom-input"
                        label="Password"
                        labelPlacement="floating"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Your password"
                        value={password}
                        onIonInput={(e) => setPassword(e.detail.value!)}
                        autocomplete={selectedSegment === 'signup' ? 'new-password' : 'current-password'}
                      />
                      <IonButton fill="clear" size="small" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)' }}>
                        <IonIcon slot="icon-only" icon={showPassword ? eyeOffOutline : eyeOutline} />
                      </IonButton>
                    </div>
                    <IonButton type="submit" expand="block" style={{ marginTop: '1.5rem' }} disabled={isLoading}>
                      <IonIcon icon={mailOutline} slot="start" />
                      {isLoading ? <IonSpinner /> : (selectedSegment === 'login' ? 'Login with Email' : 'Sign Up with Email')}
                    </IonButton>
                  </form>

                  <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                    <IonText color="medium">or</IonText>
                  </div>

                  <IonButton expand="block" color="secondary" onClick={() => window.google.accounts.id.prompt()} disabled={isLoading}>
                    <IonIcon icon={logoGoogle} slot="start" />
                    Continue with Google
                  </IonButton>

                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={4000}
        color="danger"
        position="top"
      />
    </IonPage>
  );
};

export default LoginPage;
