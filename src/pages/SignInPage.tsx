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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonAlert
} from '@ionic/react';

import { 
  arrowBackOutline, 
  mailOutline, 
  eyeOutline, 
  eyeOffOutline, 
  logoGoogle,
  personOutline,
  businessOutline
} from 'ionicons/icons';
import supabase from '../supabaseConfig';
import { Profile, UserType } from '../components/DbCrud'; 
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Session } from '@supabase/supabase-js';
import './SignInPage.scss';

interface SignInPageProps {}

const SignInPage: React.FC<SignInPageProps> = () => {
  const ionRouter = useIonRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<UserType | null>({ type: 'tenant' });

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        return;
      }
      setSession(sessionData.session);

      if (sessionData.session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', sessionData.session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        } else if (profileData && profileData.user_type) {
          setUserType(profileData.user_type);
          if (profileData.user_type.type === 'admin') {
            ionRouter.push('/admin-home', 'forward');
          } else {
            ionRouter.push('/home', 'forward');
          }
        }
      }
    };
    fetchSessionAndProfile();
  }, [ionRouter]);

  const [selectedSegment, setSelectedSegment] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [showAdminRequestAlert, setShowAdminRequestAlert] = useState<boolean>(false);

  const handleUserTypeChange = (value: string) => {
    if (value === 'tenant' || value === 'admin') {
      setUserType({ type: value });
      if (value === 'admin') {
        setSelectedSegment('login');
      }
    }
  };

  const handleRequestAccess = (e: React.MouseEvent) => {
    e.preventDefault();
    // Here you would typically trigger a call to your backend to handle the request
    // For now, we'll just show the alert.
    setShowAdminRequestAlert(true);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const googleUser = await GoogleAuth.signIn();
      if (!googleUser) {
        throw new Error('Google sign-in failed');
      }

      if (!googleUser.authentication || !googleUser.authentication.idToken) {
        throw new Error('Google sign-in failed: No ID token received');
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: googleUser.authentication.idToken,
      });

      if (sessionError) {
        throw sessionError;
      }

      if (sessionData.session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_type')
          .eq('id', sessionData.session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (!profileData) {
          if (!userType) {
            throw new Error("User type not selected. Please select a user type before signing in.");
          }
          const { error: insertError } = await supabase.from('profiles').insert([
            {
              id: sessionData.session.user.id,
              user_id: sessionData.session.user.id,
              user_type: userType,
              full_name: googleUser.name,
              avatar_url: googleUser.imageUrl,
            },
          ]);
          if (insertError) {
            throw insertError;
          }
        }
        
        const { data: finalProfileData } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', sessionData.session.user.id)
          .single();

        if (finalProfileData?.user_type?.type === 'admin') {
          ionRouter.push('/admin-home', 'forward');
        } else {
          ionRouter.push('/home', 'forward');
        }
      } else {
        setToastMessage('Login successful, but could not retrieve session.');
        setShowToast(true);
      }

    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      setToastMessage(`Google Sign-In failed: ${error.message}`);
      setShowToast(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setIsLoading(true);
    try {
      if (selectedSegment === 'signup') {
        if (userType?.type === 'admin') {
            // This case should not happen due to the UI changes, but as a safeguard:
            setToastMessage('Admin sign up is not allowed.');
            setShowToast(true);
            setIsLoading(false);
            return;
        }
        if (!userType) {
          setToastMessage('Please select a user type before signing up.');
          setShowToast(true);
          setIsLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          throw error;
        }
        setToastMessage('Account created successfully. Please check your email to verify.');
        setShowToast(true);
        setSelectedSegment('login');
        setEmail('');
        setPassword('');
        setIsLoading(false);
        return;
      } else { // login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          throw error;
        }

        const sessionData = data.session;
        if (!sessionData?.user) {
          setToastMessage('Login failed. Please check your email and password.');
          setShowToast(true);
          setIsLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_type')
          .eq('id', sessionData.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        if (!profileData) {
          if (!userType) {
            throw new Error("User type not selected. Please select a user type before signing in.");
          }
           if (userType.type === 'admin') {
             throw new Error("Admin profile does not exist. Please request access.");
           }
          const { error: insertError } = await supabase.from('profiles').insert([
            {
              id: sessionData.user.id,
              user_id: sessionData.user.id,
              user_type: userType,
            },
          ]);
          if (insertError) {
            throw insertError;
          }
        }

        const { data: finalProfileData } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', sessionData.user.id)
          .single();

        if (finalProfileData?.user_type?.type === 'admin') {
          ionRouter.push('/admin-home', 'forward');
        } else {
          ionRouter.push('/home', 'forward');
        }
      }

    } catch (error: any) {
      console.error('Email Auth Error:', error);
      setToastMessage(`Authentication failed: ${error.message}`);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (userType?.type === 'admin') {
        return 'Admin Sign In';
    }
    if (selectedSegment === 'signup') {
      return 'Create Account';
    }
    return 'Welcome Back';
  };

  const getSubtitle = () => {
    if (userType?.type === 'admin') {
        return 'Enter your admin credentials';
    }
    if (selectedSegment === 'signup') {
      return 'Please fill in the information below';
    }
    return 'Sign in to access your account';
  };

  return (
    <IonPage className="login-page">
      <IonHeader className="login-header">
        <IonToolbar className="login-toolbar">
          <IonButton onClick={() => ionRouter.goBack()} className='backButton'>
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="login-content">
        <div className="background-container">
          <div className="background-overlay" />
        </div>

        <div className="portal-wrapper">
          <div className="login-container">
            
            <div className="user-type-switcher">
              <IonSegment 
                value={userType?.type ?? ''}
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
                  {userType?.type !== 'admin'  && <div className="auth-segments">
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
                    
                  </div>}

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

                  <div className="auth-divider">
                    <div className="divider-line"></div>
                    <IonText className="divider-text">or</IonText>
                    <div className="divider-line"></div>
                  </div>

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

                    {userType?.type === 'admin' && selectedSegment === 'login' && (
                     <div className="auth-links" style={{textAlign: 'center', marginBottom: '1rem'}}>
                        <a href="#" onClick={handleRequestAccess} style={{ color: 'white' }}>Request admin access</a>
                    </div>
                  )}
                  
                  </form>

                  <div className="auth-links">
                    {selectedSegment === 'login' && userType?.type === 'tenant' && (
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
      <IonAlert
        isOpen={showAdminRequestAlert}
        onDidDismiss={() => setShowAdminRequestAlert(false)}
        header={'Request Sent'}
        message={'Please check your email inbox (and spam folder) for a response.'}
        buttons={['OK']}
      />
    </IonPage>
  );
};

export default SignInPage;