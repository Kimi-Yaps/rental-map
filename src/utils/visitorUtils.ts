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

// Currency formatter
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  }).format(amount);
