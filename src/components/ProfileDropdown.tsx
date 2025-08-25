import { useState, useEffect, useCallback, useRef } from "react";
import {
  IonButton,
  IonIcon,
  IonLabel,
  IonItem,
  useIonRouter,
  isPlatform
} from "@ionic/react";
import { chevronDownOutline, checkmarkOutline } from "ionicons/icons";
import { supabase } from '../supabaseClient';
import gsap from "gsap";

const ProfileDropdown: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [userType, setUserType] = useState<'tenant' | 'landlord'>('tenant');
  const profileRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ionRouter = useIonRouter();
  const isMobile = isPlatform('mobile');

  const toggleDropdown = useCallback(() => {
    if (!isDropdownOpen) {
      // Open animation
      gsap.set(dropdownRef.current, {
        visibility: 'visible',
        opacity: 0,
        scale: 0.95,
      });
      gsap.to(dropdownRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    } else {
      // Close animation
      gsap.to(dropdownRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          if (dropdownRef.current) {
            dropdownRef.current.style.visibility = 'hidden';
          }
        }
      });
    }
    setIsDropdownOpen(!isDropdownOpen);
  }, [isDropdownOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && 
          dropdownRef.current && 
          !profileRef.current.contains(event.target as Node) && 
          !dropdownRef.current.contains(event.target as Node)) {
        if (isDropdownOpen) {
          toggleDropdown();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, toggleDropdown]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        
        const { data: profile } = session.user.id ? await supabase
          .from('profiles')
          .select('avatar_url, full_name, user_type')
          .eq('id', session.user.id)
          .maybeSingle() : { data: null };
        
        setProfileAvatar(profile?.avatar_url || null);
        setUserType(profile?.user_type || 'tenant');

        if (profile?.full_name) {
          const names = profile.full_name.split(' ').filter((n: string) => n.length > 0);
          setUserDisplayName(names.slice(0, 2).join(' '));
        } else {
          setUserDisplayName(null);
        }
      } else {
        setIsLoggedIn(false);
        setProfileAvatar(null);
        setUserDisplayName(null);
      }
    };

    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUserTypeSwitch = async (newUserType: 'tenant' | 'landlord') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newUserType })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error updating user type:', error);
        return;
      }

      setUserType(newUserType);
      setIsDropdownOpen(false);
      
      // Navigate to appropriate profile page
      ionRouter.push(`/profile/${newUserType}`, 'forward');
    } catch (error) {
      console.error('Error switching user type:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    ionRouter.push("/login", "forward");
  };

  if (!isLoggedIn) {
    return (
      <IonButton
        onClick={() => ionRouter.push("/login", "forward")}
        fill="clear"
        color="light"
      >
        Sign In
      </IonButton>
    );
  }

  return (
    <div ref={profileRef} style={{ position: 'relative' }}>
      <IonButton
        onClick={toggleDropdown}
        fill="clear"
        color="light"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          padding: '8px 12px'
        }}
      >
        {profileAvatar ? (
          <img 
            src={profileAvatar} 
            alt="Profile" 
            style={{ 
              width: 32, 
              height: 32, 
              borderRadius: '50%',
              objectFit: 'cover'
            }} 
          />
        ) : (
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: '50%', 
            backgroundColor: 'var(--ion-color-tertiary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {userDisplayName?.charAt(0) || '?'}
          </div>
        )}
        <span style={{ fontSize: '14px' }}>
          {userDisplayName || 'User'}
        </span>
        <IonIcon 
          icon={chevronDownOutline} 
          style={{ 
            fontSize: '16px',
            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </IonButton>
      
      <div 
        ref={dropdownRef}
        style={{ 
          position: 'absolute',
          top: '100%',
          right: 0,
          backgroundColor: 'var(--ion-background-color)',
          border: '1px solid var(--ion-color-light)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          minWidth: isMobile ? '100vw' : '220px',
          opacity: 0,
          visibility: 'hidden',
          transformOrigin: 'top right',
          zIndex: 1000,
          overflow: 'hidden',
          ...(isMobile && {
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '16px 16px 0 0',
          })
        }}
      >
        <div style={{ 
          padding: '16px', 
          borderBottom: '1px solid var(--ion-color-light)',
          backgroundColor: 'var(--ion-color-light-tint)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            {userDisplayName || 'User'}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--ion-color-medium)',
            textTransform: 'capitalize'
          }}>
            {userType} Account
          </div>
        </div>

        <div style={{ padding: '8px 0' }}>
          <div style={{ 
            padding: '8px 16px', 
            fontSize: '12px', 
            color: 'var(--ion-color-medium)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Switch Account Type
          </div>
          
          <IonItem 
            button 
            onClick={() => handleUserTypeSwitch('tenant')}
            style={{ 
              '--padding-start': '16px',
              '--padding-end': '16px',
              '--inner-padding-end': '0px',
              cursor: 'pointer'
            }}
          >
            <IonLabel>
              <div style={{ fontSize: '14px' }}>Tenant</div>
              <div style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                Browse and book properties
              </div>
            </IonLabel>
            {userType === 'tenant' && (
              <IonIcon 
                icon={checkmarkOutline} 
                color="success" 
                slot="end"
                style={{ fontSize: '18px' }}
              />
            )}
          </IonItem>

          <IonItem 
            button 
            onClick={() => handleUserTypeSwitch('landlord')}
            style={{ 
              '--padding-start': '16px',
              '--padding-end': '16px',
              '--inner-padding-end': '0px',
              cursor: 'pointer'
            }}
          >
            <IonLabel>
              <div style={{ fontSize: '14px' }}>Landlord</div>
              <div style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                Manage properties and users
              </div>
            </IonLabel>
            {userType === 'landlord' && (
              <IonIcon 
                icon={checkmarkOutline} 
                color="success" 
                slot="end"
                style={{ fontSize: '18px' }}
              />
            )}
          </IonItem>
        </div>

        <div style={{ borderTop: '1px solid var(--ion-color-light)' }}>
          <IonItem 
            button 
            onClick={() => {
              ionRouter.push(`/profile/${userType}`, "forward");
              setIsDropdownOpen(false);
            }}
            style={{ 
              '--padding-start': '16px',
              '--padding-end': '16px',
              cursor: 'pointer'
            }}
          >
            <IonLabel style={{ fontSize: '14px' }}>Profile Settings</IonLabel>
          </IonItem>

          <IonItem 
            button 
            onClick={handleSignOut}
            style={{ 
              '--padding-start': '16px',
              '--padding-end': '16px',
              cursor: 'pointer',
              '--color': 'var(--ion-color-danger)'
            }}
          >
            <IonLabel style={{ fontSize: '14px', color: 'var(--ion-color-danger)' }}>
              Sign Out
            </IonLabel>
          </IonItem>
        </div>

        {isMobile && (
          <div style={{ padding: '8px 16px' }}>
            <IonButton 
              expand="block"
              onClick={() => setIsDropdownOpen(false)}
              color="medium"
            >
              Cancel
            </IonButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDropdown;
