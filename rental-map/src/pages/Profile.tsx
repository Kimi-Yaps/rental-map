import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonText, IonSpinner } from '@ionic/react';
import ProfileDropdown from '../components/ProfileDropdown';
import { supabase } from '../supabaseClient';

const Profile: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserEmail(session.user.email);
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserEmail();
  }, []);

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
          <ProfileDropdown />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '50px' }}>
          <IonCard style={{ width: '100%', maxWidth: '500px' }}>
            <IonCardContent className="ion-text-center">
              <h2>Welcome to your Profile</h2>
              {loading ? (
                <IonSpinner />
              ) : userEmail ? (
                <div className="ion-margin-top">
                  <IonText color="medium">
                    <p>Logged in as:</p>
                  </IonText>
                  <IonText>
                    <h3>{userEmail}</h3>
                  </IonText>
                </div>
              ) : (
                <IonText color="danger">
                  <p>Unable to load user email</p>
                </IonText>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
