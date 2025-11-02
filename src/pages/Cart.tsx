import React, { useState } from 'react';
import { IonPage } from '@ionic/react';
import './Cart.scss';
import Header from '../components/Header';
import PulauHujungImage from '../assets/pulau-hujung.jpg';

const Cart: React.FC = () => {
  const [quantity, setQuantity] = useState(1);
  const [isSelected, setIsSelected] = useState(false);
  const pricePerNight = 260;
  const totalPrice = quantity * pricePerNight;

  const selectedItemCount = isSelected ? 1 : 0;
  const selectedTotalPrice = isSelected ? totalPrice : 0;

  return (
    <IonPage>
      <Header />
      <div className="cart-wrapper">
        <div className="booking-section">
          <table className="booking-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={isSelected} onChange={(e) => setIsSelected(e.target.checked)} /></th>
                <th>Property</th>
                <th>Pricing Type</th>
                <th>Number of Visitor</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => setIsSelected(e.target.checked)}
                  />
                </td>
                <td className="property-info">
                  <img
                    src={PulauHujungImage}
                    alt="Pulau Hujung"
                    className="property-image"
                  />
                  <span>Pulau Hujung Island Resort</span>
                </td>
                <td>Per Night</td>
                <td>
                  <div className="quantity-control">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)}>+</button>
                  </div>
                </td>
                <td>RM{totalPrice}</td>
              </tr>
            </tbody>
          </table>

          <div className="booking-footer">
            <label>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => setIsSelected(e.target.checked)}
              />
              Select All (1)
            </label>
            <button className="delete-btn">Delete</button>
            <div className="total-price">
              Total ({selectedItemCount} item{selectedItemCount !== 1 ? 's' : ''}): RM{selectedTotalPrice.toFixed(2)}
            </div>
            <button className="checkout-btn">Check Out</button>
          </div>
        </div>

        <div className="trips-section">
          <div className="tabs">
            <button className="tab active">Upcoming</button>
            <button className="tab">Completed</button>
            <button className="tab">Cancelled</button>
          </div>
          <div className="trips-content">
            <h3>Upcoming trips</h3>
            <div className="empty-trips">No upcoming trips</div>
          </div>
        </div>
      </div>
    </IonPage>
  );
};

export default Cart;
