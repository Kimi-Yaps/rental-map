import React, { Suspense } from 'react'; // Removed unused useEffect import
import { Redirect, Route } from 'react-router-dom';
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
const BookingPage = React.lazy(() => import('./pages/BookingPage'));
const VisitorPackages = React.lazy(() => import('./pages/VisitorPackages'));
// Direct import for AuthCallback to potentially resolve context issue
import AuthCallback from './pages/AuthCallback';

// Import the new EventPage component
import EventPage from './pages/Event';

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
  // Removed session state and related useEffect as it's not used in this routing setup.
  // Authentication logic is handled by SignInPage and AuthCallback routes.

  return (
    <IonApp>
      <Suspense fallback={<LoadingFallback />}>
        <IonReactRouter>
          <IonRouterOutlet 
            id="main-content" 
            animated={false}
          >



             {/* Visitor / Normal user page view & edit personal data */}
            {/* Default redirect for root path */}
            <Route exact path="/">
              <Redirect to="/home" />
            </Route>

            {/* Authentication */}
            <Route exact path="/SignIn" component={SignInPage} />
            {/* Using component prop directly for AuthCallback */}
            <Route path="/auth/callback" component={AuthCallback} exact />

            {/* payment Gateway */}
            <Route exact path="/payment" component={PaymentInsert} />

            {/* Main routes */}
            <Route exact path="/home" component={Home} />
            <Route exact path="/bookpackage" component={BookPackage} />
            <Route exact path="/booking/:id" component={BookingPage} />

            {/* Profile Routes */}
            <Route exact path="/profile" component={Profile} />

            {/* Visitor Packages Route */}
            <Route exact path="/visitorPackages" component={VisitorPackages} />

            {/* Event Route */}
            <Route exact path="/event" component={EventPage} />

          </IonRouterOutlet>
        </IonReactRouter>
      </Suspense>
    </IonApp>
  );
};

export default App;
