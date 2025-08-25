import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonInput,
  IonPage,
  useIonRouter,
  IonToast,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonText,
  isPlatform // Import isPlatform
} from '@ionic/react';

import { arrowBackOutline, mailOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import supabase from '../supabaseConfig';
import { useLocation } from 'react-router-dom';
import { Profile } from '../components/DbCrud'; // UserType is used in Profile interface
import { GoogleLogin, GoogleOAuthProvider, CredentialResponse } from '@react-oauth/google';
import { Session } from '@supabase/supabase-js'; // User is not directly used here
import './Main.css';
import '../theme/variables.css';
import './login.css';

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
  const upsertProfile = async (session: Session) => {
    if (!session?.user) return;
    const user = session.user; // user is now of type User

    if (userType === 'landlord') {
      // Create property owner profile
      const propertyOwnerData = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        email: user.email,
        phone_number: user.phone || '',
        ic_number: '',
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // First check if the profile already exists
      const { data: existingOwner, error: checkError } = await supabase
        .from('property_owners')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing owner:', checkError);
        throw checkError;
      }

      if (!existingOwner) {
        // Only create if doesn't exist
        const { error: ownerError } = await supabase
          .from('property_owners')
          .insert([propertyOwnerData]);
        
        if (ownerError) {
          console.error('Error creating property owner:', ownerError);
          throw ownerError;
        }
      }
    } else {
      // Create regular tenant profile
      const profileData: Partial<Profile> = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        userType: { type: 'tenant' },
      };
      
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });
      
      if (upsertError) {
        console.error('Error upserting profile:', upsertError);
        throw upsertError;
      }
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
      const { data, error: authError } = result; // Renamed 'error' to 'authError'
      if (authError) {
        if (selectedSegment === 'signup' && authError.message.includes('User already registered')) {
          setToastMessage('An account with this email already exists. Please sign in.');
        } else {
          setToastMessage(authError.message);
        }
        setShowToast(true);
      } else if (data.session) {
        await upsertProfile(data.session); // Pass the session directly
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

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setGoogleLoading(true);
    try {
      const { credential } = credentialResponse;
      if (!credential) throw new Error('No credential returned');
      
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
      });
      
      if (error) {
        console.error('Google auth error:', error);
        setToastMessage(`Authentication error: ${error.message}`);
        setShowToast(true);
        return;
      }

      if (!data.session || !data.user) {
        setToastMessage('Failed to get user session');
        setShowToast(true);
        return;
      }

      try {
        await upsertProfile(data.session); // Pass the session directly
        // For landlords, redirect to landlord home
        if (userType === 'landlord') {
          ionRouter.push('/landlord', 'forward');
        } else {
          ionRouter.push('/home', 'forward');
        }
      } catch (profileError) {
        console.error('Profile creation error:', profileError);
        setToastMessage('Failed to create user profile. Please try again.');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Google auth flow error:', error);
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

  const getSubtitle = () => {
    if (userType === 'landlord') {
      return selectedSegment === 'login' ? 'Sign in to manage your properties' : 'Start your landlord journey';
    }
    return selectedSegment === 'login' ? 'Sign in to find your perfect home' : 'Join thousands of happy renters';
  };

  const googleClientId = isPlatform('android')
    ? import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID
    : import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <IonPage>
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={handleBack} fill="clear">
                <IonIcon icon={arrowBackOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent fullscreen className="login-content">
          <div className="login-container">
            <div className="login-card-wrapper">
              <IonCard className="login-card">
                <IonCardHeader className="login-header">
                  <IonCardTitle className="login-title">
                    {getTitle()}
                  </IonCardTitle>
                  <IonText color="medium" className="login-subtitle">
                    {getSubtitle()}
                  </IonText>
                </IonCardHeader>
                
                <IonCardContent className="login-card-content">

                  {/* Google OAuth Button */}
                  <div className="google-auth-section">
                    {googleLoading ? (
                      <IonButton 
                        expand="block" 
                        fill="outline"
                        disabled
                        className="google-loading-btn"
                      >
                        <IonSpinner name="crescent" className="loading-spinner" />
                        Signing in with Google...
                      </IonButton>
                    ) : (
                      <div className="google-login-wrapper">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={handleGoogleError}
                          useOneTap={false}
                          text="continue_with"
                          shape="pill"
                          theme="outline"
                          logo_alignment="left"
                          size="large"
                          width="100%"
                          ux_mode="popup"
                          cancel_on_tap_outside={false}
                        />
                      </div>
                    )}
                  </div>

                  <div className="divider-section">
                    <div className="divider-line"></div>
                    <IonText color="medium" className="divider-text">
                      or continue with email
                    </IonText>
                    <div className="divider-line"></div>
                  </div>

                  {/* Email Form */}
                  <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(); }} className="email-form">
                    <div className="input-group">
                      <IonInput
                        className="custom-input"
                        label="Email Address"
                        labelPlacement="floating"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onIonInput={(e) => setEmail(e.detail.value!)}
                        autocomplete="username"
                        fill="outline"
                      />
                    </div>
                    
                    <div className="password-input-wrapper">
                      <IonInput
                        className="custom-input password-input"
                        label="Password"
                        labelPlacement="floating"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onIonInput={(e) => setPassword(e.detail.value!)}
                        autocomplete={selectedSegment === 'signup' ? 'new-password' : 'current-password'}
                        fill="outline"
                      />
                      <IonButton 
                        fill="clear" 
                        size="small" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="password-toggle-btn"
                      >
                        <IonIcon 
                          slot="icon-only" 
                          icon={showPassword ? eyeOffOutline : eyeOutline}
                        />
                      </IonButton>
                    </div>
                    
                    <IonButton 
                      type="submit" 
                      expand="block" 
                      disabled={isLoading || !email || !password}
                      className="submit-btn"
                    >
                      {isLoading ? (
                        <>
                          <IonSpinner name="crescent" className="loading-spinner" />
                          {selectedSegment === 'login' ? 'Signing In...' : 'Creating Account...'}
                        </>
                      ) : (
                        <>
                          <IonIcon icon={mailOutline} slot="start" />
                          {selectedSegment === 'login' ? 'Sign In with Email' : 'Create Account'}
                        </>
                      )}
                    </IonButton>

                    {/* Sign In suggestion for Sign Up */}
                  {selectedSegment === 'signup' && (
                    <div className="register-suggestion">
                      Already have an account?{' '}
                      <span
                        className="register-link"
                        onClick={() => setSelectedSegment('login')}
                      >
                        Sign In here
                      </span>
                    </div>
                  )}

                    {/* Register suggestion for Sign In */}
                  {selectedSegment === 'login' && (
                    <div className="register-suggestion">
                      Don't have an account?{' '}
                      <span
                        className="register-link"
                        onClick={() => setSelectedSegment('signup')}
                      >
                        Register here
                      </span>
                    </div>
                  )}
                  </form>

                </IonCardContent>
              </IonCard>
            </div>
          </div>
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
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
