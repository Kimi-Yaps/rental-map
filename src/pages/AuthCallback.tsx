import React, { useEffect } from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import supabase from '../supabaseClient';

const AuthCallback: React.FC = () => {
  const router = useIonRouter();

  useEffect(() => {
    const handleSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (data.session) {
        // ✅ Logged in successfully
        router.push('/home', 'forward', 'replace');
      } else {
        // ❌ No session, redirect back to login
        router.push('/signin', 'back', 'replace');
      }
    };

    handleSession();
  }, [router]);

  return (
    <IonPage>
      <IonContent className="ion-text-center ion-padding">
        <IonSpinner name="crescent" />
        <p>Signing you in...</p>
      </IonContent>
    </IonPage>
  );
};

export default AuthCallback;
