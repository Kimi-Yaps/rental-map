import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';

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
import LandLordHome from './pages/landlordHome';

/* Theme variables */
import './theme/variables.css';
import PropertyType from './pages/PropertyType';
import HomeBestFit from './pages/HomeBestFIt';
import homeSearched from './pages/HomeSearched';
import AmenitiesStepPage from './pages/AmenitiesStepPage';
import LocationStepPage from './pages/LocationStepPage';
import FinalReviewPage from './pages/FinalReviewPage';
import RoomsStepPage from './pages/RoomsStepPage';
import PricingStepPage from './pages/PricingStepPage';
import PhotosStepPage from './pages/PhotosStepPage';
setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/home" component={Home} />
        <Route exact path="/landlord" component={LandLordHome} />
        <Route exact path="/propertyType" component={PropertyType} />
        <Route exact path="/HomeBestFit" component={HomeBestFit} />
        <Route exact path="/homeSearched" component={homeSearched} />
        <Route exact path="/LocationStepPage" component={LocationStepPage} />
        <Route exact path="/amenities" component={AmenitiesStepPage} />
        <Route exact path="/rooms" component={RoomsStepPage} />
        <Route exact path="/pricing" component={PricingStepPage} />
        <Route exact path="/photos" component={PhotosStepPage} />
        <Route exact path="/finalReview" component={FinalReviewPage} />
        <Redirect exact from="/" to="/home" />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
