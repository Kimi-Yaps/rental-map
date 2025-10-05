import React, { Suspense } from 'react';
import { Redirect, Route } from 'react-router-dom'; // Corrected import: back to react-router-dom
import { 
  IonApp, 
  IonRouterOutlet, 
  setupIonicReact, 
  IonSpinner,
  IonContent,
  IonPage
} from '@ionic/react';

import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
const BookPackage =  React.lazy(() => import('./pages/BookPackage'));
const Home = React.lazy(() => import('./pages/Home'));
const SignInPage = React.lazy(() => import('./pages/SignInPage'));
const Profile = React.lazy(() => import('./pages/Profile'));
const PaymentInsert = React.lazy(() => import('./pages/PaymentInsert'));

// Enhanced setup with better performance
setupIonicReact({
  rippleEffect: true,
  mode: 'md' // or 'md' for Material Design, helps with consistent animations
});

// Loading component for better UX
const LoadingFallback: React.FC = () => (
  <IonPage>
    <IonContent className="ion-padding">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
      }}>
        <IonSpinner name="crescent" />
      </div>
    </IonContent>
  </IonPage>
);

const App: React.FC = () => {

  return (
    <IonApp>
      <IonReactRouter>

        <Suspense fallback={<LoadingFallback />}>
          <IonRouterOutlet 
            id="main-content" 
            animated={false}
          >
            {/* Default redirect for root path */}
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>

            {/* Authentication */}
            <Route exact path="/SignIn" component={SignInPage} />

            {/* payment Gateway */}
            <Route exact path="/payment" component={PaymentInsert} />

            {/* Main routes */}
            <Route exact path="/home" component={Home} />
            <Route exact path="/bookpackage" component={BookPackage} />

        
            
            {/* Profile Routes */}
            <Route exact path="/profile" component={Profile} />
 
            
            

          </IonRouterOutlet>
        </Suspense>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
