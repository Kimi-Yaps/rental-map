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
  IonRouterLink,
  IonChip,
  IonLabel,
  IonBadge,
  IonSearchbar,
  IonPopover,
} from "@ionic/react";
import { useHistory, useLocation } from "react-router";
import {
  homeOutline,
  mapOutline,
  cubeOutline,
  calendarOutline,
  callOutline,
  informationCircleOutline,
  sunnyOutline,
  searchOutline,
  personCircleOutline,
  cartOutline,
} from "ionicons/icons";
import { Icons } from "../utils/visitorUtils";
import "../pages/VisitorPackages.scss";

const ImprovedNavigation: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  // Navigation items with descriptions for better UX
  const navItems = [
    {
      path: "/home",
      label: "Home",
      icon: homeOutline,
    },
    {
      path: "/booking",
      label: "Book Now",
      icon: mapOutline,
    },
    {
      path: "/visitorPackages",
      label: "Tour Packages",
      icon: cubeOutline,
    },
    {
      path: "/events",
      label: "Events",
      icon: calendarOutline,
    },
  ];

  // Quick info items
  const quickInfo = [
    { icon: callOutline, label: "Emergency", value: "+60 7-799 1234" },
    { icon: informationCircleOutline, label: "Info Center", value: "8AM-6PM" },
    { icon: sunnyOutline, label: "Ferry Status", value: "Check Schedule" },
  ];

  const isActivePage = (path: string) => location.pathname === path;

  return (
    <>
      {/* Top Info Bar */}
      <IonGrid className="info-bar">
        <IonRow className="ion-align-items-center ion-justify-content-between">
          <IonCol size="auto">
            <div className="quick-info-container">
              {quickInfo.map((info, idx) => (
                <IonChip key={idx} className="info-chip" outline>
                  <IonIcon icon={info.icon} />
                  <IonLabel>
                    <span className="info-label">{info.label}:</span>
                    <strong>{info.value}</strong>
                  </IonLabel>
                </IonChip>
              ))}
            </div>
          </IonCol>
          <IonCol size="auto">
            <div className="help-section">
              <IonText className="help-text">Need help planning?</IonText>
              <IonButton size="small" className="contact-btn" fill="solid">
                Contact Us
              </IonButton>
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>

      {/* Main Navigation */}
      <IonGrid className="main-nav">
        <IonRow className="ion-align-items-center ion-justify-content-between">
          {/* Logo */}
          <IonCol size="12" sizeMd="auto">
            <IonRouterLink routerLink="/home" className="no-style-link">
              <div className="brand-container">
                <IonText className="brand-text">
                  <span className="brand-visit">Visit</span>
                  <span className="brand-center">
                    <span className="brand-ampersand">&</span>
                    <span className="brand-travel">Travel</span>
                  </span>
                  <span className="brand-location">Mersing</span>
                </IonText>
              </div>
            </IonRouterLink>
          </IonCol>

          {/* Navigation Items */}
          <IonCol size="12" sizeMd="auto" className="ion-hide-md-down">
            <div className="nav-items-enhanced">
              {navItems.map((item) => (
                <IonRouterLink
                  key={item.path}
                  routerLink={item.path}
                  className="no-style-link"
                >
                  <div
                    className={`nav-item-card ${
                      isActivePage(item.path) ? "active" : ""
                    }`}
                  >
                    <IonIcon icon={item.icon} className="nav-icon" />
                    <div className="nav-text-group">
                      <IonText className="nav-label">{item.label}</IonText>
                      <IonText className="nav-description">
                        {item.description}
                      </IonText>
                    </div>
                    {isActivePage(item.path) && (
                      <IonBadge className="active-badge">Current</IonBadge>
                    )}
                  </div>
                </IonRouterLink>
              ))}
            </div>
          </IonCol>

          {/* Right Side Icons */}
          <IonCol size="auto" className="icon-row">
            {/* Search */}
            <IonButton
              fill="clear"
              className="icon-button"
              onClick={() => setShowSearch(!showSearch)}
            >
              <IonIcon slot="icon-only" icon={searchOutline} />
            </IonButton>

            {/* Social Icons */}
            <IonButton fill="clear" className="icon-button">
              <IonIcon slot="icon-only" src={Icons.whatsapp} />
            </IonButton>
            <IonButton fill="clear" className="icon-button">
              <IonIcon slot="icon-only" src={Icons.facebook} />
            </IonButton>

            {/* User Profile or Sign In */}
            {isLoggedIn ? (
              <IonRouterLink routerLink="/profile" className="no-style-link">
                <IonButton fill="clear" className="icon-button">
                  <IonIcon slot="icon-only" icon={personCircleOutline} />
                </IonButton>
              </IonRouterLink>
            ) : (
              <IonRouterLink routerLink="/SignIn" className="no-style-link">
                <IonButton fill="solid" size="small" className="signin-btn">
                  Sign In
                </IonButton>
              </IonRouterLink>
            )}

            {/* Language Selector */}
            <IonButton fill="clear" className="icon-button">
              <IonIcon slot="icon-only" src={Icons.malayFlag} />
            </IonButton>

            {/* Cart */}
            <IonButton fill="clear" className="icon-button cart-button">
              <IonIcon slot="icon-only" icon={cartOutline} />
              <IonBadge className="cart-badge">0</IonBadge>
            </IonButton>
          </IonCol>
        </IonRow>

        {/* Search Bar (Collapsible) */}
        {showSearch && (
          <IonRow className="search-row">
            <IonCol>
              <IonSearchbar
                placeholder="Search packages, locations, activities..."
                className="custom-searchbar"
                animated
              />
            </IonCol>
          </IonRow>
        )}

        {/* Mobile Navigation */}
        <IonRow className="ion-hide-md-up mobile-nav-row">
          <IonCol>
            <div className="mobile-nav-items">
              {navItems.map((item) => (
                <IonRouterLink
                  key={item.path}
                  routerLink={item.path}
                  className="no-style-link"
                >
                  <div
                    className={`mobile-nav-item ${
                      isActivePage(item.path) ? "active" : ""
                    }`}
                  >
                    <IonIcon icon={item.icon} />
                    <IonText>{item.label}</IonText>
                  </div>
                </IonRouterLink>
              ))}
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>
    </>
  );
};

export default ImprovedNavigation;