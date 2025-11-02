import React from 'react';
import {
  IonPage,
} from '@ionic/react';
import './Cart.scss';
import Header from "../components/Header";


const Cart: React.FC = () => {
    return (
        <IonPage>
            <Header />
            <div>hello this is cart</div>
        </IonPage>
  );
};

export default Cart;