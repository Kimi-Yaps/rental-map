import type { CapacitorConfig } from '@capacitor/cli';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: 'rental-map/.env' });

const config: CapacitorConfig = {
  appId: 'your.app.id',
  appName: 'RentalBookingSystem',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: process.env.VITE_GOOGLE_WEB_CLIENT_ID,
      serverClientId: process.env.VITE_GOOGLE_ANDROID_CLIENT_ID,
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
