import React from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonButtons,
  IonButton,
} from '@ionic/react';
import { menuController } from '@ionic/core';
import { home, search, heart, list, person, notifications, settings, menu, close } from 'ionicons/icons';

// Define the shape of a single menu item
interface MenuItem {
  title: string;
  url: string;
  icon: string;
}

// Array of all menu items and their associated icons
const menuItems: MenuItem[] = [
  { title: 'Home', url: 'home', icon: home },
  { title: 'Search', url: 'search', icon: search },
  { title: 'Favorites', url: 'favorites', icon: heart },
  { title: 'My Bookings', url: 'bookings', icon: list },
  { title: 'Profile', url: 'profile', icon: person },
  { title: 'Notifications', url: 'notifications', icon: notifications },
  { title: 'Settings', url: 'settings', icon: settings },
];

// Define the props for our BurgerMenu component
interface BurgerMenuProps {
  selectedPage: string;
  setSelectedPage: (page: string) => void;
}

// The main BurgerMenu component
const BurgerMenu: React.FC<BurgerMenuProps> = ({ selectedPage, setSelectedPage }) => {
  return (
    // IonMenu is the main container for the side menu
    <IonMenu contentId="main-content" type="overlay">
      {/* Header of the menu */}
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Menu</IonTitle>
          {/* Close button for the menu */}
          <IonButtons slot="end">
            <IonMenuToggle> 
              <IonButton>
                <IonIcon icon={close} />
              </IonButton>
            </IonMenuToggle>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Content area of the menu */}
      <IonContent>
        <IonList>
          {/* Map over the menuItems array to render each item */}
          {menuItems.map((item, index) => (
            // IonMenuToggle automatically closes the menu when the item is clicked
            <IonMenuToggle key={index} autoHide={false}>
              <IonItem
                button
                // The onClick handler sets the selected page and explicitly closes the menu
                onClick={() => {
                  setSelectedPage(item.url);
                  menuController.close(); 
                }}
                // Highlight the active page with a primary color
                color={selectedPage === item.url ? 'primary' : ''}
              >
                <IonIcon slot="start" icon={item.icon} />
                <IonLabel>{item.title}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default BurgerMenu;
