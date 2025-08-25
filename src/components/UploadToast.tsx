import { IonToast } from '@ionic/react';

interface UploadToastProps {
  isOpen: boolean;
  message: string;
  onDidDismiss: () => void;
}

export const UploadToast: React.FC<UploadToastProps> = ({ isOpen, message, onDidDismiss }) => (
  <IonToast
    isOpen={isOpen}
    onDidDismiss={onDidDismiss}
    message={message}
    duration={3000}
    position="top"
    color="primary"
  />
);

export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
  }

  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB');
  }

  return true;
};
