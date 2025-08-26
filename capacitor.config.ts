import type { CapacitorConfig } from '@capacitor/cli';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const config: CapacitorConfig = {
  appId: 'your.app.id',
  appName: 'RentalBookingSystem',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: process.env.VITE_GOOGLE_ANDROID_CLIENT_ID,
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
