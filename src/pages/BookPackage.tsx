import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonImg,
} from "@ionic/react";
import { useState, useEffect } from "react";
import { useHistory } from "react-router"; // Import useHistory
import "./BookPage.scss";
import ResizableWindow from '../components/ResizableWindow';
import supabase from "../supabaseConfig";
import { Package } from "../interfaces/Booking"; // Import the Package interface
import { 
  arrowBackOutline, 
} from 'ionicons/icons';

export const Icons = {
  camera: "public/camera.svg",
  noise: "public/rectangle-noise.webp",
  cart: "public/cart.svg",
  browsePage: "public/browsepage.svg",
  malayFlag: "public/flag-malaysia.svg",
  user: "public/profile-fill.svg",
};

// Define the structure of an enhanced suggestion
export interface EnhancedSuggestion {
  text: string;
  type: "recent" | "database" | "geocoded";
  source: string;
  property_type?: string;
  HomeType?: string;
}

// Define TabButtonProps interface at the top level
interface TabButtonProps {
  count?: number;
  onClick?: () => void;
  disabled?: boolean;
}

// Main component - removed the props that don't belong here
const BookPackage: React.FC = () => {
  const history = useHistory(); // Get the history object

    

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isWindowOpen, setIsWindowOpen] = useState(false);

  const handleBack = () => {
    history.goBack(); // Use history.goBack()
  };

  // Removed unused useEffect for isDesktop

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase.from('Packages').select('*');
      if (error) {
        console.error('Error fetching packages:', error);
      } else {
        setPackages(data as Package[]);
      }
    };

    fetchPackages();
  }, []);

  const handleIconClick = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsWindowOpen(true);
  };

  const handleCloseWindow = () => {
    setIsWindowOpen(false);
    setSelectedPackage(null);
  };

  // Handler for the tab button
  const handleTabButtonClick = () => {
    console.log("Tab button clicked");
    // Add your logic here
  };

  return (
    <IonPage id="main-content">
        <IonContent className="content">
          {/* Moved camera icon to be a sibling of background-noise */}
          <IonImg src={Icons.noise} className="background-noise"></IonImg>
          <IonImg src={Icons.camera} className="centered-icon"></IonImg>

          <IonGrid className="booking-nav-container">
          <IonRow className="booking-nav">
            
            {/* Empty column for spacing if needed */}
            <IonCol size="auto">
              {/* Add logo or other elements here if needed */}
            </IonCol>

            {/* Main navigation icons */}
            <IonCol className="icon-list">

              <IonCol>
                <IonButton onClick={handleBack} className='backButton'>
                  <IonIcon icon={arrowBackOutline} />
                </IonButton>
              </IonCol>
              
              <IonIcon src={Icons.malayFlag} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.cart} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.user} className="cust-icon"></IonIcon>
              
              {/* Tab Button */}
              <IonButton
                fill="clear"
                className="custom-tab-button"
                onClick={handleTabButtonClick}
                disabled={false}
              >
                {/* top accent strip */}
                <div className="tab-accent-strip" />
                
                {/* counter */}
                <span className="tab-counter">
                  0
                </span>
              </IonButton>
              
            </IonCol>
            
          </IonRow>
        </IonGrid>

        {isWindowOpen && selectedPackage && (
          <ResizableWindow
            title="Package"
            onClose={handleCloseWindow}
            content={
              <div>
                <h2>{selectedPackage.description}</h2>
                <p>Price: {selectedPackage.price}</p>
                <p>Location: {selectedPackage.location}</p>
                <p>Number of Tenants: {selectedPackage.numberOfTenant}</p>
                {/* Add more details as needed */}
              </div>
            }
          />
        )}

        {/* Rest of your page content goes here */}
        <IonGrid>
          <IonRow>
            {packages.map((pkg) => (
              <IonCol key={pkg.id} size="auto" onClick={() => handleIconClick(pkg)}>
                {pkg.icon_url && <IonImg src={pkg.icon_url} style={{ width: '50px', height: '50px', cursor: 'pointer' }} />}
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

      </IonContent>
    </IonPage>
  );
};

export default BookPackage;
