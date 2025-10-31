import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonText,
  IonIcon
} from '@ionic/react';
import { logoGoogle } from 'ionicons/icons';
import supabase from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import { useIonRouter, isPlatform } from '@ionic/react';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const VisitorLoginPage: React.FC = () => {
  const ionRouter = useIonRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Initialize GoogleAuth for native platforms
    if (isPlatform('android') || isPlatform('ios')) {
      GoogleAuth.initialize({
        clientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID, // Use Web Client ID for native plugin
        scopes: ['profile', 'email'],
        // You might need to add a serverClientId here if you are using a backend to verify tokens
        // serverClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
      });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Define the handler with explicit types
    const handleAuthStateChange = (event: import('@supabase/supabase-js').AuthChangeEvent, session: Session | null) => {
      setSession(session);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    if (isPlatform('android') || isPlatform('ios')) {
      // Use native Google Auth plugin for Android/iOS
      try {
        const result = await GoogleAuth.signIn();
        const { authentication } = result;

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: authentication.idToken,
        });

        if (error) {
          console.error('Native Google Auth error:', error.message);
          // Provide user feedback about the error
          // setToastMessage(`Google Sign-In failed: ${error.message}`);
          // setShowToast(true);
        } else {
          console.log('Native Google Auth success:', data);
          ionRouter.push('/tenant-home', 'forward');
        }
      } catch (error) {
        console.error('Native Google Auth error:', error);
        // Provide user feedback about the error
        // setToastMessage(`Google Sign-In failed: ${error.message}`);
        // setShowToast(true);
      }
    } else {
      // Fallback to Supabase's signInWithOAuth for web
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/tenant-home', // Redirect to tenant home after login
        },
      });
      if (error) {
        console.error('Error signing in with Google:', error.message);
        // Provide user feedback about the error
        // setToastMessage(`Google Sign-In failed: ${error.message}`);
        // setShowToast(true);
      }
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    } else {
      setSession(null);
      ionRouter.push('/loginselector', 'back'); // Go back to login selector after sign out
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--ion-background-color': '#FEFEFE', 'color': '#1A1A1A' }}>
        <IonGrid style={{ height: '100%' }}>
          <IonRow className="ion-justify-content-center ion-align-items-center" style={{ height: '100%' }}>
            <IonCol size="12" size-md="8" size-lg="6">
              <IonText className="ion-text-center" color="dark">
                <h1>Tenant Login</h1>
                <p>Sign in or register to find your perfect home.</p>
              </IonText>

              <IonRow className="ion-justify-content-center ion-margin-top">
                <IonCol size="12">
                  {!session ? (
                    <IonButton expand="block" onClick={handleGoogleSignIn} className="ion-margin-top">
                      <IonIcon slot="start" icon={logoGoogle} />
                      Sign In / Register with Google
                    </IonButton>
                  ) : (
                    <IonButton expand="block" color="danger" onClick={handleSignOut} className="ion-margin-top">
                      Sign Out
                    </IonButton>
                  )}
                </IonCol>
              </IonRow>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default VisitorLoginPage;
