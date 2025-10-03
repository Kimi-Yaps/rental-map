import { storageService } from "../services/storage";

export const getAssetUrls = () => ({
  move: storageService.getPublicUrl('Asset/moving.webp'),
  elips: storageService.getPublicUrl('Asset/ellipse_bg.webp'),
  polygon: storageService.getPublicUrl('Asset/polygon_bg.webp'),
  homeBackground: storageService.getPublicUrl('Asset/PulauHarimau09.webp')
})

export const Icons = {
  cart: "public/cart.svg",
  email:"public/email.svg",
  facebook:"public/facebook.svg",
  malayFlag:"public/flag-malaysia.svg",
  instagram:"public/instagram.svg",
  user: "public/profile-fill.svg",
  tiktok:"public/tiktok-circle.svg",
  whatsapp:"public/whatsapp-filled.svg",
  home: "public/home.svg",
};

// Define the structure of an enhanced suggestion
export interface EnhancedSuggestion {
  text: string;
  type: "recent" | "database" | "geocoded";
  source: string;
  property_type?: string;
  HomeType?: string;
}
