import React from "react";
import {
  IonContent,
  IonPage,
} from "@ionic/react";
import "./packageDetails.scss";
import Header from '../components/Header';
import PulauHujungImage from "../assets/pulau-hujung.jpg";

const PackageDetails: React.FC = () => {
  return (
    <IonPage>
      <Header />
      <IonContent fullscreen scrollY={true}>
        <div className="property-page">
          <h1 className="property-title">Pulau Hujung Bilik 2</h1>

          <div className="property-content">
            <div className="property-left">
              <div className="property-images">
                <img
                  src={PulauHujungImage}
                  alt="Pulau Hujung"
                  className="main-image"
                />
                <div className="small-images">
                  <img src={PulauHujungImage} alt="view2" />
                  <img src={PulauHujungImage} alt="view3" />
                  <img src={PulauHujungImage} alt="view4" />
                  <div className="image-overlay">
                    <img src={PulauHujungImage} alt="view5" />
                    <button className="show-all">Show All Photos</button>
                  </div>
                </div>
              </div>

              <div className="property-info">
                <h2>Entire serviced apartment in Pulau Hujung</h2>
                <p>2 guests · 1 bedroom · 1 bed · 1 bath</p>
              </div>
            </div>

            <div className="booking-card">
              <div className="booking-inputs">
                <div className="row">
                  <div className="field">
                    <label>Check-In</label>
                    <input type="date" />
                  </div>
                  <div className="field">
                    <label>Checkout</label>
                    <input type="date" />
                  </div>
                </div>

                <div className="field full">
                  <label>Guest</label>
                  <input type="number" placeholder="2 guests" />
                </div>
              </div>

              <button className="reserve-btn">Reserve</button>
              <p className="note">you won’t be charged yet</p>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PackageDetails;
