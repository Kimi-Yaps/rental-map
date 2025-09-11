
import React from 'react'; // Added React import as it's good practice
import { IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { Route, Redirect } from 'react-router-dom';
import { compassOutline, personOutline } from 'ionicons/icons'; // Assuming these icons are imported from ionicons/icons
import Profile from '../pages/Profile';


const BottomToolbar: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/profile" component={Profile} exact={true} />
        {/* ...other tab routes remain unchanged... */}
        <Route path="/" render={() => <Redirect to="/explore" />} exact={true} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="explore" href="/explore">
          <IonIcon icon={compassOutline} />
          <IonLabel>Explore</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/profile">
          <IonIcon icon={personOutline} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default BottomToolbar;
