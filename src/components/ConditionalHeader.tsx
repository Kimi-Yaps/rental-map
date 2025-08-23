import { IonHeader, IonToolbar } from '@ionic/react';
import React from 'react';

interface ConditionalHeaderProps {
  children?: React.ReactNode;
  color?: string;
}


// Helper to detect if running in a web browser (mobile or desktop)
function isWeb() {
  // Capacitor apps set window.Capacitor, Cordova sets window.cordova
  // We want to show header only in web browsers
  const isCapacitor = typeof (window as unknown as { Capacitor?: unknown }).Capacitor !== 'undefined';
  const isCordova = typeof (window as unknown as { cordova?: unknown }).cordova !== 'undefined';
  return !isCapacitor && !isCordova;
}

const ConditionalHeader: React.FC<ConditionalHeaderProps> = ({ children, color }) => {
  if (!isWeb()) return null;
  return (
    <IonHeader>
      <IonToolbar color={color}>
        {children}
      </IonToolbar>
    </IonHeader>
  );
};

export default ConditionalHeader;
