import React from 'react';
import { IonButton, IonIcon, IonLabel } from '@ionic/react';
import { add, remove } from 'ionicons/icons';

interface StepperProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  label: string;
}

const Stepper: React.FC<StepperProps> = ({ value, onIncrement, onDecrement, min, max, label }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
      <IonLabel style={{ whiteSpace: 'nowrap' }}>{label}</IonLabel>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <IonButton onClick={onDecrement} disabled={min !== undefined && value <= min} fill="clear">
          <IonIcon icon={remove} />
        </IonButton>
        <IonLabel style={{ padding: '0 16px', minWidth: '20px', textAlign: 'center' }}>{value}</IonLabel>
        <IonButton onClick={onIncrement} disabled={max !== undefined && value >= max} fill="clear">
          <IonIcon icon={add} />
        </IonButton>
      </div>
    </div>
  );
};

export default Stepper;
