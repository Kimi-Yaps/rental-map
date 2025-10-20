import React, { useState } from "react";
import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonText,
  IonIcon,
  IonButton,
  IonImg,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonCardSubtitle,
  IonRouterLink,
} from "@ionic/react";
import { useHistory } from "react-router";
import "../pages/VisitorPackages.scss";
import { arrowBackOutline } from "ionicons/icons";
import { Icons, formatCurrency } from "../utils/visitorUtils";

// ✅ Static Tourism Packages (example data)
const staticPackages = [
  {
    id: 1,
    Title: "Mersing Island Hopping Adventure",
    description:
      "Explore the pristine islands of Mersing with a guided boat tour. Visit Pulau Rawa, Pulau Besar, and Pulau Tinggi while snorkeling in crystal-clear waters.",
    price: 280.0,
    location: "Mersing Jetty, Johor",
    image_urls: ["public/mersing-island.jpg"],
    numberOfVisitor: 2,
  },
  {
    id: 2,
    Title: "Mersing Eco Waterfall Retreat",
    description:
      "Unwind with nature at a serene eco-resort surrounded by lush rainforest and a natural waterfall. Includes breakfast and jungle walk.",
    price: 350.0,
    location: "Air Papan, Mersing",
    image_urls: ["public/waterfall-retreat.jpg"],
    numberOfVisitor: 4,
  },
  {
    id: 3,
    Title: "Sunset Kayaking & Seafood Dinner",
    description:
      "Enjoy an evening paddle along the coast followed by a local seafood feast at Mersing town's best restaurant.",
    price: 180.0,
    location: "Mersing Beach",
    image_urls: ["public/kayak-sunset.jpg"],
    numberOfVisitor: 2,
  },
];

const VisitorPackages: React.FC = () => {
  const history = useHistory();
  const handleBack = () => history.goBack();
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Set to true by default to ensure the profile link is shown. setIsLoggedIn is unused for now.

  return (
    <IonPage id="main-content">
      <IonContent className="content visitor-packages">
        {/* --- Top Navigation Bar --- */}
        <IonGrid> {/* Removed booking-nav-container */}
          <IonRow className="nav-row ion-justify-content-between ion-align-items-center"> {/* Changed class names */}
            {/* Back Button */}
            <IonCol size="auto">
              <IonButton onClick={handleBack} className="backButton" style={{ '--background': 'transparent', '--color': 'var(--brand-primary-color)' }}>
                <IonIcon icon={arrowBackOutline} />
              </IonButton>
            </IonCol>

            {/* Brand Logo */}
            <IonCol size="auto">
              <div className="brand-container ion-text-center">
                <IonText className="brand-text">
                  <span className="brand-visit">Visit</span>
                  <span className="brand-center">
                    <span className="brand-ampersand">&</span>
                    <span className="brand-travel">Travel</span>
                  </span>
                  <span className="brand-location">Mersing</span>
                </IonText>
              </div>
            </IonCol>

            {/* Right Icons */}
            <IonCol size="auto" className="icon-row">
              <IonIcon src={Icons.tiktok} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.whatsapp} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.facebook} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.email} className="cust-icon"></IonIcon>
              {isLoggedIn && (
                <IonRouterLink routerLink="/profile" className="no-style-link">
                  <IonIcon src={Icons.user} className="cust-icon"></IonIcon>
                </IonRouterLink>
              )}
              <IonIcon src={Icons.malayFlag} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.cart} className="cust-icon"></IonIcon>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* --- Section Title --- */}
        <div className="section-header">
          <IonText color="var(--brand-primary-color)"> {/* Changed color to brown */}
            <h2>Discover Amazing Stays & Adventures in Mersing</h2>
          </IonText>
          <p>Handpicked packages for your next getaway</p>
        </div>

        {/* --- Package Cards --- */}
        <IonGrid className="package-grid">
          <IonRow>
            {staticPackages.map((pkg) => (
              <IonCol key={pkg.id} size="12" sizeMd="4" sizeLg="4">
                <IonCard className="package-card">
                  <IonImg
                    src={pkg.image_urls[0]}
                    alt={pkg.Title}
                    className="package-image"
                  />
                  <IonCardHeader>
                    <IonCardTitle>{pkg.Title}</IonCardTitle>
                    <IonCardSubtitle>{pkg.location}</IonCardSubtitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p className="pkg-desc">{pkg.description}</p>
                    <div className="pkg-meta">
                      <IonText color="dark">
                        <strong>{formatCurrency(pkg.price)}</strong> / package
                      </IonText>
                      <p>{pkg.numberOfVisitor} Visitors</p>
                    </div>
                    <IonButton expand="block" className="book-now-btn">
                      View Details
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default VisitorPackages;
