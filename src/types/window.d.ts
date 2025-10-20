interface GoogleId {
  renderButton: (element: HTMLElement, options: IdConfiguration) => void;
}

interface GoogleAccounts {
  id?: GoogleId;
}

interface Window {
  google?: GoogleAccounts;
}

// Type definition for Google Identity Services renderButton options
interface IdConfiguration {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'shortcut';
  type?: 'standard' | 'icon' | 'multi-init';
  text?: string;
  shape?: 'rectangular' | 'pill';
  logo_alignment?: 'left' | 'center';
  click_listener?: () => void;
  callback?: (response: CredentialResponse) => void;
  // Add other relevant options if known
}

// Type definition for CredentialResponse (basic structure)
interface CredentialResponse {
  credential?: string;
  // Add other relevant properties if known
}
