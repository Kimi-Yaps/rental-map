
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
} from '@ionic/react';
import { home, search, heart, list, person, notifications, settings, menu } from 'ionicons/icons';

interface MenuItem {
  title: string;
  url: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { title: 'Home', url: 'home', icon: home },
  { title: 'Search', url: 'search', icon: search },
  { title: 'Favorites', url: 'favorites', icon: heart },
  { title: 'My Bookings', url: 'bookings', icon: list },
  { title: 'Profile', url: 'profile', icon: person },
  { title: 'Notifications', url: 'notifications', icon: notifications },
  { title: 'Settings', url: 'settings', icon: settings },
];

interface BurgerMenuProps {
  selectedPage: string;
  setSelectedPage: (page: string) => void;
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ selectedPage, setSelectedPage }) => {
  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle><IonIcon icon={menu} /></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {menuItems.map((item, index) => (
            <IonMenuToggle key={index} autoHide={true}>
              <IonItem
                button
                onClick={() => setSelectedPage(item.url)}
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
