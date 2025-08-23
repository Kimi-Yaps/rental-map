import { IonHeader, IonToolbar } from '@ionic/react';
import React from 'react';

interface ConditionalHeaderProps {
  children?: React.ReactNode;
  color?: string;
}

const ConditionalHeader: React.FC<ConditionalHeaderProps> = ({ children, color }) => {
  return (
    <IonHeader>
      <IonToolbar color={color}>
        {children}
      </IonToolbar>
    </IonHeader>
  );
};

export default ConditionalHeader;
