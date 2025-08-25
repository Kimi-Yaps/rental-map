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
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import { useIonRouter } from '@ionic/react';

const LandlordLoginPage: React.FC = () => {
  const ionRouter = useIonRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/landlord-home', // Redirect to landlord home after login
      },
    });
    if (error) {
      console.error('Error signing in with Google:', error.message);
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
                <h1>Landlord Login</h1>
                <p>Sign in or register to manage your properties.</p>
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

export default LandlordLoginPage;
