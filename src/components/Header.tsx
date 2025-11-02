import React, { Fragment, useState } from "react";
import {
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonItem,
  IonLabel,
  IonIcon,
  IonRouterLink,
  IonImg,
  useIonViewWillEnter,
  IonHeader,
  IonToolbar,
} from "@ionic/react";
import supabase from "../supabaseClient";
import { getAssetUrls, Icons } from "../utils/homeAssets";

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);

  useIonViewWillEnter(() => {
    const checkLoginStatusAndProfile = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          setIsLoggedIn(true);
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("id", session.user.id)
            .single();

          if (profileError) throw profileError;

          let currentUserType = null;

          if (
            profileData &&
            profileData.user_type &&
            profileData.user_type.type
          ) {
            currentUserType = profileData.user_type.type;
          } else {
            currentUserType = "tenant";
            try {
              await supabase
                .from("profiles")
                .update({ user_type: { type: "tenant" } })
                .eq("id", session.user.id);
            } catch (updateError) {
              console.error(
                "Error updating user_type in profiles:",
                updateError
              );
            }
          }
          setUserType(currentUserType);
        } else {
          setIsLoggedIn(false);
          setUserType(null);
        }
      } catch (error) {
        console.error("Error checking login status or profile:", error);
        setIsLoggedIn(false);
        setUserType(null);
      }
    };
    checkLoginStatusAndProfile();
  });

  const scrollItems = Array.from({ length: 7 }, (_, i) => (
    <Fragment key={i}>
      <IonImg className="home-move" src={getAssetUrls().move}></IonImg>
      <IonLabel aria-hidden="true">Book Your Place Now</IonLabel>
    </Fragment>
  ));

  return (
    <IonHeader className="custom-header" style={{ boxShadow: "none" }}>
      <IonToolbar
        className="toolbar-wrapper"
        style={{
          "--background": "rgba(246, 239, 229, 1)",
          "--box-shadow": "none",
          boxShadow: "none",
        }}
      >
        <IonGrid className="nav-grid">
          <IonItem
            lines="none"
            className="infinite-scroll"
            style={{
              "--background": "rgb(231, 223, 213)",
              "--box-shadow": "none",
              boxShadow: "none",
            }}
          >
            <IonCol className="scroll-content ion-no-padding">
              {scrollItems}
            </IonCol>
          </IonItem>

          <IonRow className="ion-justify-content-between ion-align-items-center nav-row">
            <IonCol size="auto" className="ion-no-padding nav-col">
              <div className="nav-items-container">
                <IonRouterLink
                  routerLink="/visitorPackages"
                  className="no-style-link"
                >
                  <IonText className="nav-text ion-margin-end">
                    Explore Packages
                  </IonText>
                </IonRouterLink>

                <IonRouterLink routerLink="/event" className="no-style-link">
                  <IonText className="nav-text">Event</IonText>
                </IonRouterLink>
              </div>
            </IonCol>

            <IonRouterLink routerLink="/home" className="no-style-link">
              <IonCol size="auto" className="brand-col">
                <div className="brand-container ion-text-center">
                  <IonText className="brand-text">
                    <span className="brand-visit">Visit</span>
                    <span className="brand-center">
                      <span className="brand-ampersand">&</span>
                      <span className="brand-travel">Travel</span>
                    </span>
                    <span className="brand-location">Mersing</span>
                  </IonText>
                </div>
              </IonCol>
            </IonRouterLink>

            {/* Right Icons */}
            <IonCol size="auto" className="icon-row icon-col">
              {!isLoggedIn && (
                <IonRouterLink routerLink="/SignIn" className="no-style-link">
                  <IonText className="nav-SignIn ion-margin-end">
                    Sign In
                  </IonText>
                </IonRouterLink>
              )}

              <IonIcon src={Icons.tiktok} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.whatsapp} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.facebook} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.email} className="cust-icon"></IonIcon>

              {isLoggedIn && (
                <IonRouterLink routerLink="/profile" className="no-style-link">
                  <IonIcon src={Icons.user} className="cust-icon"></IonIcon>
                </IonRouterLink>
              )}

              <IonIcon src={Icons.malayFlag} className="cust-icon"></IonIcon>
              <IonRouterLink routerLink="/cart" className="no-style-link">
                <IonIcon src={Icons.cart} className="cust-icon"></IonIcon>
              </IonRouterLink>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonToolbar>
    </IonHeader>
  );
};

export default Header;
