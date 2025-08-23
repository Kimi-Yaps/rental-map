import React from "react";
import { IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";

const MoneyButton: React.FC = () => {
  const history = useHistory();
  // function bila button ditekan
  const handleClick = () => {
    history.push('/paymentInsert');
  };

  return (
    <IonButton onClick={handleClick}>Payment</IonButton>
  );
};

export default MoneyButton;
