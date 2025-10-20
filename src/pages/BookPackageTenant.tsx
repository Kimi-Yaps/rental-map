import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonText,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonImg,
} from "@ionic/react";
import { useState, useEffect } from "react";
import { useHistory } from "react-router";
import "../Main.scss"; // Assuming common styles
import supabase from "../supabaseConfig";
import { Package } from "../interfaces/Booking"; // Assuming Booking.ts has Package
import { arrowBackOutline } from 'ionicons/icons'; // For the back button

// Define Icons and isVideo locally, or import if they are in a shared utility file
export const Icons = {
  camera: "public/camera.svg",
  noise: "public/rectangle-noise.webp",
  cart: "public/cart.svg",
  browsePage: "public/browsepage.svg",
  malayFlag: "public/flag-malaysia.svg",
  user: "public/profile-fill.svg",
  destroy: "public/destroy.svg",
  max: "public/max.svg",
  mini: "public/mini.svg",
};

const isVideo = (url: string): boolean => {
  const lowercasedUrl = url.toLowerCase();
  return lowercasedUrl.endsWith('.mp4') || lowercasedUrl.endsWith('.mov');
};

const formatCurrency = (amount: number | null): string => {
  if (amount === null) return "N/A";
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  }).format(amount);
};


// Static package data for demonstration. 
// Replace this with a dynamic fetch from your database.
const staticPackages: Package[] = [
  {
    id: '1',
    Title: 'Cozy Beachfront Bungalow',
    description: 'A beautiful bungalow right on the beach, perfect for a romantic getaway.',
    price: 500,
    location: 'Pulau Perhentian',
    numberOfVisitor: 2,
    ammenities: { wifi: '/path/to/wifi-icon.svg', ac: '/path/to/ac-icon.svg' },
    image_urls: ['/path/to/image1.jpg', '/path/to/image2.jpg'],
    icon_url: '/path/to/icon.svg',
    pulauName: 'Perhentian',
    created_at: new Date().toISOString(),
    Contact: '123-456-7890'
  },
  {
    id: '2',
    Title: 'Luxury Overwater Villa',
    description: 'Experience luxury with our overwater villas with stunning ocean views.',
    price: 1500,
    location: 'Pulau Langkawi',
    numberOfVisitor: 4,
    ammenities: { wifi: '/path/to/wifi-icon.svg', ac: '/path/to/ac-icon.svg', pool: '/path/to/pool-icon.svg' },
    image_urls: ['/path/to/image3.jpg', '/path/to/image4.jpg'],
    icon_url: '/path/to/icon.svg',
    pulauName: 'Langkawi',
    created_at: new Date().toISOString(),
    Contact: '123-456-7890'
  },
];

const BookPackageTenant: React.FC = () => {
  const history = useHistory();
  const [packages, setPackages] = useState<Package[]>(staticPackages);


  const handleBack = () => {
    history.goBack();
  };

  const renderPackageContent = (pkg: Package) => {
    return (
      <div className="package-details-content">
        <div className="package-header">
          {pkg.icon_url && <IonImg src={pkg.icon_url} alt="Package Icon" className="card-package-icon" />}
          <IonText className="window-title">{pkg.Title}</IonText>
          {/* No edit/save buttons or other admin controls for tenant view */}
        </div>
        <div className="package-body">
          <p><strong>Description:</strong></p>
          <div dangerouslySetInnerHTML={{ __html: pkg.description || "" }} />
          <p><strong>Price:</strong> {formatCurrency(pkg.price)}</p>
          <p><strong>Location:</strong> {pkg.location || "N/A"}</p>
          <p><strong>Number of Visitors:</strong> {pkg.numberOfVisitor || "N/A"}</p>
          {pkg.ammenities && typeof pkg.ammenities === "object" && Object.keys(pkg.ammenities).length > 0 && (
            <div className="amenity-icons">
              {Object.entries(pkg.ammenities).map(([key, value]) => (
                <IonImg key={key} src={String(value)} alt={`Amenity: ${key}`} className="amenity-icon" />
              ))}
            </div>
          )}
          {pkg.image_urls && pkg.image_urls.length > 0 && (
            <div className="package-images">
              <h3>Package Images:</h3>
              <IonGrid>
                <IonRow>
                  {pkg.image_urls.map((url, index) => (
                    <IonCol size="auto" key={index}>
                      <IonImg src={url} alt={`Package Image ${index + 1}`} className="package-image" />
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <IonPage id="main-content">
      <IonContent className="content">
        <IonGrid className="booking-nav-container">
          <IonRow className="booking-nav">
            <IonCol size="auto">
              <IonButton onClick={handleBack} className='backButton'>
                <IonIcon icon={arrowBackOutline} />
              </IonButton>
            </IonCol>
            <IonCol className="icon-list">
              {/* Tenant-specific icons or general ones */}
              <IonIcon src={Icons.malayFlag} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.cart} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.user} className="cust-icon"></IonIcon>
            </IonCol>
          </IonRow>
        </IonGrid>

        <div className="package-list-container">
          {isLoading && <p>Loading packages...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!isLoading && !error && packages.length === 0 && <p>No packages available.</p>}
          {!isLoading && !error && packages.length > 0 && (
            packages.map(pkg => (
              <div key={pkg.id} className="package-card">
                {renderPackageContent(pkg)}
              </div>
            ))
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BookPackageTenant;
