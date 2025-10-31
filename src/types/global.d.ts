declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '@ionic/react/css/*' {
  const content: any;
  export default content;
}

// Add support for import.meta.env
interface ImportMeta {
  env: {
    [key: string]: string | boolean | undefined;
    MODE: string;
    BASE_URL: string;
    PROD: boolean;
    DEV: boolean;
  };
}