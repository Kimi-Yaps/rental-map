import React from 'react';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/react';
import { personOutline, chatbubbleOutline, compassOutline, briefcaseOutline } from 'ionicons/icons';
import { Route, Redirect } from 'react-router';

// Placeholder components for each tab
const ProfileTab: React.FC = () => <div>Profile Content</div>;
const MessagesTab: React.FC = () => <div>Messages Content</div>;
const ExploreTab: React.FC = () => <div>Explore Content</div>;
const TripsTab: React.FC = () => <div>Trips Content</div>;

const BottomToolbar: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        {/* Define routes for each tab content */}
        <Route path="/profile" component={ProfileTab} exact={true} />
        <Route path="/messages" component={MessagesTab} exact={true} />
        <Route path="/explore" component={ExploreTab} exact={true} />
        <Route path="/trips" component={TripsTab} exact={true} />
        {/* Redirect to a default tab if no specific tab route is matched */}
        <Route path="/" render={() => <Redirect to="/explore" />} exact={true} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="profile" href="/profile">
          <IonIcon icon={personOutline} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>

        <IonTabButton tab="messages" href="/messages">
          <IonIcon icon={chatbubbleOutline} />
          <IonLabel>Messages</IonLabel>
        </IonTabButton>

        <IonTabButton tab="explore" href="/explore">
          <IonIcon icon={compassOutline} />
          <IonLabel>Explore</IonLabel>
        </IonTabButton>

        <IonTabButton tab="trips" href="/trips">
          <IonIcon icon={briefcaseOutline} />
          <IonLabel>Trips</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default BottomToolbar;
