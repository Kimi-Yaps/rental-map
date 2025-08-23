import React from "react";
import { IonButton, useIonRouter } from "@ionic/react";

const MoneyButton: React.FC = () => {
  const router = useIonRouter();

  return (
    <IonButton
      expand="block"
      onClick={() => {
        router.push("/payment", "forward", "replace");
      }}
    >
      Payment
    </IonButton>
  );
};

export default MoneyButton;
