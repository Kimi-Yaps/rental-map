import React from 'react';
import { IonFooter, IonToolbar, IonTitle, IonGrid, IonRow, IonCol } from '@ionic/react';
import './Footer.scss';

const Footer: React.FC = () => {
  return (
    <IonFooter>
          <div className="body">
              <div className="row">
                  <div className="column column-1">
                      <div>Home</div>
                      <div>Packages</div>
                      <div>Event</div>
                      <div>Privacy policy</div>
                      <div>Terms</div>
                  </div>
                  <div className="column column-2">Visit Mersing <br />Now !!!</div>
              </div>
          </div>
    </IonFooter>
  );
};

export default Footer;