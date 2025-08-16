import React, { Suspense } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, IonSpinner } from '@ionic/react';
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

// Page Imports
const AmenitiesStepPage = React.lazy(() => import('./pages/AmenitiesStepPage'));
const FinalReviewPage = React.lazy(() => import('./pages/FinalReviewPage'));
const Home = React.lazy(() => import('./pages/Home'));
const HomeBestFit = React.lazy(() => import('./pages/HomeBestFIt'));
const homeSearched = React.lazy(() => import('./pages/HomeSearched'));
const LandLordHome = React.lazy(() => import('./pages/landlordHome'));
const LocationStepPage = React.lazy(() => import('./pages/LocationStepPage'));
const PhotosStepPage = React.lazy(() => import('./pages/PhotosStepPage'));
const PricingStepPage = React.lazy(() => import('./pages/PricingStepPage'));
const PropertyType = React.lazy(() => import('./pages/PropertyType'));
const RoomsStepPage = React.lazy(() => import('./pages/RoomsStepPage'));

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <Suspense fallback={<IonSpinner />}>
        <IonRouterOutlet id="main-content" animated={true}>
          <Route exact path="/home" component={Home} />
          <Route exact path="/landlord" component={LandLordHome} />
          <Route exact path="/propertyType" component={PropertyType} />
          <Route exact path="/homeBestFit" component={HomeBestFit} />
          <Route exact path="/homeSearched" component={homeSearched} />
          <Route exact path="/LocationStepPage" component={LocationStepPage} />
          <Route exact path="/amenities" component={AmenitiesStepPage} />
          <Route exact path="/rooms" component={RoomsStepPage} />
          <Route exact path="/pricing" component={PricingStepPage} />
          <Route exact path="/photos" component={PhotosStepPage} />
          <Route exact path="/finalReview" component={FinalReviewPage} />
          <Redirect exact from="/" to="/home" />
        </IonRouterOutlet>
      </Suspense>
    </IonReactRouter>
  </IonApp>
);

export default App;
