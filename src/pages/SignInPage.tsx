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
  IonImg,
  isPlatform,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/react';

import { 
  arrowBackOutline, 
  mailOutline, 
  eyeOutline, 
  eyeOffOutline, 
  logoGoogle,
  personOutline,
  homeOutline,
  businessOutline
} from 'ionicons/icons';
import supabase from '../supabaseConfig';
import { useLocation } from 'react-router-dom';
import { Profile } from '../components/DbCrud';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Session } from '@supabase/supabase-js';
import './SignInPage.scss';

interface SignInPageProps {}

// Initialize Google Auth outside component
if (isPlatform('android') || isPlatform('ios')) {
  GoogleAuth.initialize({
    clientId: import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['profile', 'email'],
  });
} else {
  GoogleAuth.initialize({
    clientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });
}

const SignInPage: React.FC<SignInPageProps> = () => {
  const location = useLocation<{ userType: 'admin' | 'tenant' }>();
  const ionRouter = useIonRouter();
  
  // State for user type switching
  const [userType, setUserType] = useState<'admin' | 'tenant'>(
    location.state?.userType || 'tenant'
  );
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        // Redirect if already logged in
        if (userType === 'admin') {
          ionRouter.push('/admin-home', 'forward');
        } else {
          ionRouter.push('/home', 'forward');
        }
      }
    });
  }, [userType, ionRouter]);

  const [selectedSegment, setSelectedSegment] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [backgroundImage, setBackgroundImage] = useState<string>('');


  // Helper to upsert profile after login/signup
  const upsertProfile = async (session: Session) => {
    if (!session?.user) return;
    const user = session.user;

    if (userType === 'admin') {
      const adminData = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        email: user.email,
        phone_number: user.phone || '',
        ic_number: '',
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
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
        const { error: ownerError } = await supabase
          .from('property_owners')
          .insert([adminData]);
        
        if (ownerError) {
          console.error('Error creating property owner:', ownerError);
          throw ownerError;
        }
      } else {
        // Update existing owner record
        const { error: updateError } = await supabase
          .from('property_owners')
          .update({
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || existingOwner.full_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error updating property owner:', updateError);
          throw updateError;
        }
      }
    } else {
      const profileData: Partial<Profile> = {
        id: user.id,
        user_id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        nickname: user.user_metadata?.name || user.email,
        user_type: { type: userType },
        updated_at: new Date().toISOString()
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
          
          if (userType === 'admin') {
            ionRouter.push('/admin-home', 'forward');
          } else {
            ionRouter.push('/home', 'forward');
          }
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
        result = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { data: { user_type: userType } } 
        });
      }
      
      const { data, error: authError } = result;
      
      if (authError) {
        if (selectedSegment === 'signup' && authError.message.includes('User already registered')) {
          setToastMessage('An account with this email already exists. Please sign in.');
        } else {
          setToastMessage(authError.message);
        }
        setShowToast(true);
      } else if (data.session) {
        await upsertProfile(data.session);
        if (userType === 'admin') {
          ionRouter.push('/admin-home', 'forward');
        } else {
          ionRouter.push('/home', 'forward');
        }
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    
    try {
      if (isPlatform('android') || isPlatform('ios')) {
        const result = await GoogleAuth.signIn();
        const { authentication } = result;

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: authentication.idToken,
        });

        if (error) {
          console.error('Native Google Auth error:', error.message);
          setToastMessage(`Google Sign-In failed: ${error.message}`);
          setShowToast(true);
        } else if (data.session) {
          await upsertProfile(data.session);
          if (userType === 'admin') {
            ionRouter.push('/admin-home', 'forward');
          } else {
            ionRouter.push('/home', 'forward');
          }
        } else {
          setToastMessage('Failed to get user session after Google Sign-In.');
          setShowToast(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + (userType === 'admin' ? '/admin-home' : '/home'),
          },
        });
        
        if (error) {
          console.error('Web Google Auth error:', error.message);
          setToastMessage(`Google Sign-In failed: ${error.message}`);
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error('Google auth flow error:', error);
      setToastMessage('An unexpected error occurred during Google Sign-In. Please try again.');
      setShowToast(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleBack = () => {
    ionRouter.goBack();
  };

  const handleUserTypeChange = (value: string) => {
    setUserType(value as 'admin' | 'tenant');
  };

  const getTitle = () => {
    if (userType === 'admin') {
      return selectedSegment === 'login' ? 'Welcome Back, Admin' : 'Join as Admin';
    }
    return selectedSegment === 'login' ? 'Welcome Back' : 'Start Your Journey';
  };

  const getSubtitle = () => {
    if (userType === 'admin') {
      return selectedSegment === 'login' 
        ? 'Manage your properties with ease' 
        : 'Create your admin account';
    }
    return selectedSegment === 'login' 
      ? 'Find your perfect home today' 
      : 'Discover amazing rental opportunities';
  };

  const getUserTypeIcon = () => {
    return userType === 'admin' ? businessOutline : personOutline;
  };

  return (
    <IonPage className="login-page">
      <IonHeader className="login-header">
        <IonToolbar className="login-toolbar">
          <IonButton onClick={handleBack} className='backButton'>
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="login-content">
        {/* Background Image Container */}
        <div className="background-container">
          {backgroundImage && (
            <IonImg 
              src={backgroundImage} 
              className="background-image"
            />
          )}
          <div className="background-overlay" />
        </div>

        <div className="portal-wrapper">
          <div className="login-container">
            
            {/* User Type Switcher */}
            <div className="user-type-switcher">
              <IonSegment 
                value={userType} 
                onIonChange={e => handleUserTypeChange(e.detail.value!)}
                className="user-type-segment"
              >
                <IonSegmentButton value="tenant" className="user-type-button">
                  <IonIcon icon={personOutline} />
                  <IonLabel>Tenant</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="admin" className="user-type-button">
                  <IonIcon icon={businessOutline} />
                  <IonLabel>Admin</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </div>

            <div className="login-card-wrapper">
              <IonCard className="login-card">
                <IonCardHeader className="login-card-header">
                  <IonCardTitle className="login-title">
                    {getTitle()}
                  </IonCardTitle>
                  <IonText className="login-subtitle">
                    <h3>{getSubtitle()}</h3>
                  </IonText>
                </IonCardHeader>
                
                <IonCardContent className="login-card-content">
                  {/* Auth Segments Toggle */}
                  <div className="auth-segments">
                    <button
                      className={`segment-button ${selectedSegment === 'login' ? 'active' : ''}`}
                      onClick={() => setSelectedSegment('login')}
                    >
                      Sign In
                    </button>
                    <button
                      className={`segment-button ${selectedSegment === 'signup' ? 'active' : ''}`}
                      onClick={() => setSelectedSegment('signup')}
                    >
                      Sign Up
                    </button>
                  </div>

                  {/* Google OAuth Button */}
                  <div className="google-auth-section">
                    <IonButton 
                      expand="block" 
                      fill="outline"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      className="google-auth-button"
                    >
                      {googleLoading ? (
                        <>
                          <IonSpinner name="crescent" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <IonIcon icon={logoGoogle} slot="start" />
                          <span>Continue with Google</span>
                        </>
                      )}
                    </IonButton>
                  </div>

                  {/* Divider */}
                  <div className="auth-divider">
                    <div className="divider-line"></div>
                    <IonText className="divider-text">or</IonText>
                    <div className="divider-line"></div>
                  </div>

                  {/* Email Form */}
                  <form onSubmit={(e) => { e.preventDefault(); handleEmailAuth(); }} className="auth-form">
                    <div className="input-group">
                      <IonInput
                        className="auth-input"
                        label="Email Address"
                        labelPlacement="floating"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onIonInput={(e) => setEmail(e.detail.value!)}
                        autocomplete="username"
                        fill="outline"
                      />
                    </div>
                    
                    <div className="input-group password-group">
                      <IonInput
                        className="auth-input"
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
                        className="password-toggle"
                      >
                        <IonIcon 
                          icon={showPassword ? eyeOffOutline : eyeOutline}
                        />
                      </IonButton>
                    </div>
                    
                    <IonButton 
                      type="submit" 
                      expand="block" 
                      disabled={isLoading || !email || !password}
                      className="auth-submit-button"
                    >
                      {isLoading ? (
                        <>
                          <IonSpinner name="crescent" />
                          <span>{selectedSegment === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                        </>
                      ) : (
                        <>
                          <IonIcon icon={mailOutline} slot="start" />
                          <span>{selectedSegment === 'login' ? 'Sign In' : 'Create Account'}</span>
                        </>
                      )}
                    </IonButton>
                  </form>

                  {/* Additional Links */}
                  <div className="auth-links">
                    {selectedSegment === 'login' && (
                      <IonText className="forgot-password">
                        Forgot your password?
                      </IonText>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            </div>  
          </div>
        </div>
      </IonContent>
      
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={4000}
        position="top"
        className="auth-toast"
      />
    </IonPage>
  );
};

export default SignInPage;