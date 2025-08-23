
import Profile from '../pages/Profile';
import { useIonRouter } from '@ionic/react';


const BottomToolbar: React.FC = () => {
  const ionRouter = useIonRouter();
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
