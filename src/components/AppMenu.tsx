import React from 'react';
import {
  IonMenu,
  IonMenuToggle,
  IonMenuButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonCol,
  IonGrid,
  IonRow,
  IonText,
  // IonRouterLink, // Removed unused import
} from '@ionic/react';
import { menuOutline } from 'ionicons/icons'; // Burger icon
// import { Icons } from '../utils/visitorUtils'; // Removed unused import

interface AppMenuProps {
  isLoggedIn: boolean;
  menuId: string;
  contentId: string;
  brandParts: { visit: string; ampersand: string; travel: string; location: string };
  rightIcons?: React.ReactNode;
}

const AppMenu: React.FC<AppMenuProps> = ({ isLoggedIn, menuId, contentId, brandParts, rightIcons }) => {
  return (
    <>
      <IonMenu side="start" menuId={menuId} contentId={contentId}>
        <IonContent>
          <IonList>
            <IonMenuToggle autoHide={false}>
              <IonItem routerLink="/home">
                <IonLabel>Home</IonLabel>
              </IonItem>
            </IonMenuToggle>
            {isLoggedIn && (
              <IonMenuToggle autoHide={false}>
                <IonItem routerLink="/profile">
                  <IonLabel>Profile</IonLabel>
                </IonItem>
              </IonMenuToggle>
            )}
            <IonMenuToggle autoHide={false}>
              <IonItem routerLink="/cart">
                <IonLabel>Cart</IonLabel>
              </IonItem>
            </IonMenuToggle>
            {/* Add other links as needed */}
          </IonList>
        </IonContent>
      </IonMenu>

      {/*Navbar section */}
      <IonGrid>
        <IonRow className="nav-row ion-justify-content-between ion-align-items-center">
          {/* Burger Menu */}
          <IonCol size="auto">
            <IonMenuButton autoHide={false} menu={menuId}>
              <IonIcon icon={menuOutline} style={{ '--color': 'var(--brand-primary-color)' }}></IonIcon>
            </IonMenuButton>
          </IonCol>

          {/* Brand Logo */}
          <IonCol size="auto">
            <div className="brand-container ion-text-center">
              <IonText className="brand-text">
                <span className="brand-visit">{brandParts.visit}</span>
                <span className="brand-center">
                  <span className="brand-ampersand">{brandParts.ampersand}</span>
                  <span className="brand-travel">{brandParts.travel}</span>
                </span>
                <span className="brand-location">{brandParts.location}</span>
              </IonText>
            </div>
          </IonCol>

          {/* Right Icons */}
          {rightIcons && (
            <IonCol size="auto" className="icon-row">
              {rightIcons}
            </IonCol>
          )}
        </IonRow>
      </IonGrid>
    </>
  );
};

export default AppMenu;
