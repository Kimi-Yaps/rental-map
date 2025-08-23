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
  IonSpinner,
  IonText
} from '@ionic/react';

import { arrowBackOutline, mailOutline, eyeOutline, eyeOffOutline, logoGoogle } from 'ionicons/icons';
import supabase from '../supabaseConfig';
import { useLocation } from 'react-router-dom';
import { Profile } from '../components/DbCrud';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import './Main.css';
import '../theme/variables.css';

const LoginPage: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  
  const location = useLocation<{ userType: 'landlord' | 'normal' }>();
  const ionRouter = useIonRouter();

  const userType = location.state?.userType || 'normal';

  // Helper to upsert profile after login/signup
  const upsertProfile = async (session: any) => {
    if (!session?.user) return;
    const profileData: Partial<Profile> = {
      id: session.user.id,
      full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
      avatar_url: session.user.user_metadata?.avatar_url || null,
      user_type: userType === 'landlord' ? 'property_owner' : 'tenant',
    };
    // Upsert profile (insert or update if exists)
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: ['id'] });
    if (upsertError) {
      console.error('Error upserting profile:', upsertError);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            await upsertProfile(session);
          } catch (error) {
            console.error('Error in onAuthStateChange profile handling:', error);
          }
          ionRouter.push('/home', 'forward');
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
      } else if (data.session) {
        await upsertProfile({ user: data.user, session: data.session });
        ionRouter.push('/home', 'forward');
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setGoogleLoading(true);
    try {
      const { credential } = credentialResponse;
      if (!credential) throw new Error('No credential returned');
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
      });
      
      if (error) {
        setToastMessage(`Authentication error: ${error.message}`);
        setShowToast(true);
      } else if (data.session) {
        await upsertProfile({ user: data.user, session: data.session });
        ionRouter.push('/home', 'forward');
      }
    } catch (error) {
      setToastMessage('An unexpected error occurred. Please try again.');
      setShowToast(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleLoading(false);
    setToastMessage('Google login failed. Please try again.');
    setShowToast(true);
  };

  const handleBack = () => {
    ionRouter.goBack();
  };

  const getTitle = () => {
    if (userType === 'landlord') {
        return selectedSegment === 'login' ? 'Landlord Login' : 'Landlord Sign Up';
    }
    return selectedSegment === 'login' ? 'Welcome Back' : 'Create Account';
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID}>
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
                        Sign In
                      </IonSegmentButton>
                      <IonSegmentButton value="signup">
                        Sign Up
                      </IonSegmentButton>
                    </IonSegment>

                    {/* Register suggestion for Sign In */}
                    {selectedSegment === 'login' && (
                      <div style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '15px' }}>
                        Don't have an account?{' '}
                        <span
                          style={{
                            textDecoration: 'underline',
                            color: 'var(--ion-color-primary)',
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedSegment('signup')}
                        >
                          Register
                        </span>
                      </div>
                    )}

                    {/* Google OAuth Button - Moved to top for better UX */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div className="google-auth-btn-container">
                        {googleLoading ? (
                          <IonButton 
                            expand="block" 
                            fill="outline"
                            disabled
                            className="google-auth-btn"
                          >
                            <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                            Signing in...
                          </IonButton>
                        ) : (

                            <GoogleLogin
                              onSuccess={handleGoogleSuccess}
                              onError={handleGoogleError}
                              useOneTap={false}
                              text="continue_with"
                              shape="pill"
                              theme="outline"
                              logo_alignment="left"
                              size="large"
                            />

                        )}
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      margin: '1.5rem 0',
                      gap: '12px'
                    }}>
                      <div style={{ 
                        flex: 1, 
                        height: '1px', 
                        backgroundColor: 'var(--ion-color-medium)',
                        opacity: 0.3
                      }}></div>
                      <IonText color="medium" style={{ fontSize: '14px', fontWeight: '500' }}>
                        or
                      </IonText>
                      <div style={{ 
                        flex: 1, 
                        height: '1px', 
                        backgroundColor: 'var(--ion-color-medium)',
                        opacity: 0.3
                      }}></div>
                    </div>

                    {/* Email Form */}
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
                        style={{ 
                          marginBottom: '1rem',
                          '--border-radius': '12px',
                          '--padding-start': '16px',
                          '--padding-end': '16px',
                        }}
                        fill="outline"
                      />
                      
                      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <IonInput
                          className="custom-input"
                          label="Password"
                          labelPlacement="floating"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Your password"
                          value={password}
                          onIonInput={(e) => setPassword(e.detail.value!)}
                          autocomplete={selectedSegment === 'signup' ? 'new-password' : 'current-password'}
                          style={{
                            '--border-radius': '12px',
                            '--padding-start': '16px',
                            '--padding-end': '48px',
                          }}
                          fill="outline"
                        />
                        <IonButton 
                          fill="clear" 
                          size="small" 
                          onClick={() => setShowPassword(!showPassword)} 
                          style={{ 
                            position: 'absolute', 
                            right: '4px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            '--padding-start': '8px',
                            '--padding-end': '8px',
                            minHeight: '40px',
                            '--color': 'var(--ion-color-medium)'
                          }}
                        >
                          <IonIcon 
                            slot="icon-only" 
                            icon={showPassword ? eyeOffOutline : eyeOutline}
                            style={{ fontSize: '20px' }}
                          />
                        </IonButton>
                      </div>
                      
                      <IonButton 
                        type="submit" 
                        expand="block" 
                        disabled={isLoading || !email || !password}
                        style={{
                          '--border-radius': '12px',
                          height: '48px',
                          fontSize: '16px',
                          fontWeight: '600',
                          textTransform: 'none',
                          '--padding-start': '16px',
                          '--padding-end': '16px',
                        }}
                      >
                        {isLoading ? (
                          <>
                            <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                            {selectedSegment === 'login' ? 'Signing In...' : 'Signing Up...'}
                          </>
                        ) : (
                          <>
                            <IonIcon icon={mailOutline} slot="start" />
                            {selectedSegment === 'login' ? 'Sign In with Email' : 'Sign Up with Email'}
                          </>
                        )}
                      </IonButton>
                    </form>

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
        
        <style>{`
          .google-auth-btn-container {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .google-auth-btn {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            border-radius: var(--custom-border-radius-medium, 12px) !important;
            box-shadow: none !important;
            height: 48px !important;
            font-family: inherit !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            text-transform: none !important;
            transition: all 0.2s ease !important;
            padding: 0 !important;
            background: var(--ion-color-light) !important;
            border: 1px solid var(--ion-color-medium) !important;
            margin-bottom: 0;
          }
          .google-auth-btn [data-testid="google-oauth-button"] {
            width: 100% !important;
            border-radius: var(--custom-border-radius-medium, 12px) !important;
            height: 48px !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            background: var(--ion-color-light) !important;
            border: 1px solid var(--ion-color-medium) !important;
            color: var(--ion-color-primary) !important;
          }
          .google-auth-btn [data-testid="google-oauth-button"]:hover {
            box-shadow: 0 2px 8px rgba(44,95,93,0.08) !important;
            transform: translateY(-1px) !important;
          }
          /* ...existing styles for input, card, segment... */
        `}</style>
      </IonPage>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;