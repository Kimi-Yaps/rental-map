import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonText,
  IonLabel,
  IonImg,
  IonItem,
  IonIcon,
  IonRouterLink,
  isPlatform,
} from "@ionic/react";
import { Fragment, useState, useEffect } from "react";
import "../Main.scss";
import "../pages/VisitorPackages.scss";
import supabase from "../supabaseClient";
import { getAssetUrls, Icons } from "../utils/homeAssets";
import Footer from "../components/Footer";

interface PackageTypeObject {
  package_type?: { packageName?: string };
  packageName?: string;
}

interface PackageData {
  id: number;
  numberOfTenant?: number;
  location?: string;
  Contact?: any;
  ammenities?: any;
  price?: number;
  description?: string;
  created_at: string;
  icon_url?: string;
  Title?: string;
  image_urls: string[] | string | null;
  icon_style?: object | null;
  package_type?: object | string | null;
}

const VisitorPackage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [packageGroups, setPackageGroups] = useState<{
    [type: string]: { packages: PackageData[]; count: number };
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializePageData = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);

        const { data: packagesData, error: packagesError } = await supabase
          .from("Packages")
          .select("*")
          .order("created_at", { ascending: false });

        if (packagesError) {
          console.error("Supabase fetch error:", packagesError);
          setError(String(packagesError));
          setLoading(false);
          return;
        }

        if (!packagesData || packagesData.length === 0) {
          setPackageGroups({});
          setLoading(false);
          return;
        }

        const groups: Record<
          string,
          { packages: PackageData[]; count: number }
        > = {};

        for (const pkg of packagesData) {
          // parse image urls
          let imageUrls: any = pkg.image_urls || [];
          if (typeof imageUrls === "string") {
            const t = imageUrls.trim();
            if (t.startsWith("[")) {
              try {
                imageUrls = JSON.parse(t);
              } catch {
                imageUrls = [t];
              }
            } else if (t.startsWith("{") && t.endsWith("}")) {
              imageUrls = t
                .slice(1, -1)
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean);
            } else {
              imageUrls = [t];
            }
          }

          // parse package type
          let packageTypeName = "Unknown";
          const pt = pkg.package_type;
          try {
            if (pt) {
              if (typeof pt === "string") {
                const parsed = JSON.parse(pt);
                packageTypeName =
                  parsed?.package_type?.packageName ||
                  parsed?.packageName ||
                  "Unknown";
              } else if (typeof pt === "object") {
                packageTypeName =
                  (pt as PackageTypeObject)?.package_type?.packageName ||
                  (pt as PackageTypeObject)?.packageName ||
                  "Unknown";
              }
            }
          } catch (e) {
            // fallback
            packageTypeName = String(pt) || "Unknown";
          }

          if (!groups[packageTypeName])
            groups[packageTypeName] = { packages: [], count: 0 };
          groups[packageTypeName].packages.push({
            ...pkg,
            image_urls: imageUrls,
          });
          groups[packageTypeName].count += 1;
        }

        setPackageGroups(groups);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Failed to load packages");
        setLoading(false);
      }
    };

    initializePageData();
  }, []);

  const scrollItems = Array.from({ length: 7 }, (_, i) => (
    <Fragment key={i}>
      <IonImg className="home-move" src={getAssetUrls().move}></IonImg>
      <IonLabel aria-hidden="true">Book Your Place Now</IonLabel>
    </Fragment>
  ));

  const isMobile = isPlatform("mobile");

  return (
    <IonPage
      id="main-content"
      style={{ "--background": "rgba(246, 239, 229, 1)" }}
    >
      <IonContent style={{ "--background": "rgba(246, 239, 229, 1)" }}>
        <IonGrid>
          {!isMobile && (
            <IonItem
              lines="none"
              className="infinite-scroll"
              style={{ "--background": "rgb(231, 223, 213)" }}
            >
              <div className="scroll-content">{scrollItems}</div>
            </IonItem>
          )}

          <IonRow className="ion-justify-content-between ion-align-items-center nav-row">
            <IonCol size="auto" className="ion-no-padding">
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

            <IonCol size="auto">
              <IonRouterLink routerLink="/Home" className="no-style-link">
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
              </IonRouterLink>
            </IonCol>

            <IonCol size="auto" className="icon-row">
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
              <IonIcon src={Icons.cart} className="cust-icon"></IonIcon>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonGrid
          className="ion-text-center ion-padding-top ion-padding-bottom"
          style={{ marginBottom: "2em" }}
        >
          <IonRow>
            <IonCol size="12">
              <IonText
                style={{
                  fontFamily: "'Kaisei Tokumin', serif",
                  fontSize: "1.8em",
                  fontWeight: "bold",
                }}
              >
                Explore, Stay, and Discover
              </IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
              <IonText
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.1em" }}
              >
                Plan your perfect getaway with Visit Mersing. We offer complete
                tourism Mersing packages, specializing in exhilarating Island
                Hopping adventures to stunning destinations
              </IonText>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonGrid>
          {error ? (
            <IonRow>
              <IonCol size="12" className="ion-text-center">
                <IonText color="danger" style={{ fontSize: "1.2em" }}>
                  {error}
                </IonText>
              </IonCol>
            </IonRow>
          ) : loading ? (
            <IonRow>
              <IonCol size="12" className="ion-text-center">
                <IonText style={{ fontSize: "1.2em" }}>
                  Loading packages...
                </IonText>
              </IonCol>
            </IonRow>
          ) : Object.entries(packageGroups).length === 0 ? (
            <IonRow>
              <IonCol size="12" className="ion-text-center">
                <IonText
                  className="section-title"
                  style={{
                    fontSize: "1.5em",
                    marginBottom: "1em",
                    display: "block",
                  }}
                >
                  No Packages Available
                </IonText>
              </IonCol>
            </IonRow>
          ) : (
            Object.entries(packageGroups).map(([type, group]) => (
              <Fragment key={type}>
                <IonRow className="ion-padding">
                  <IonCol size="12">
                    <IonText className="section-title">{type}</IonText>
                  </IonCol>
                  {group.packages.map((pkg) => {
                    const imageUrls = Array.isArray(pkg.image_urls)
                      ? pkg.image_urls
                      : [];
                    return (
                      <IonCol size="12" size-sm="6" size-md="4" key={pkg.id}>
                        <IonRouterLink
                          routerLink={`/booking/${pkg.id}`}
                          className="no-style-link"
                        >
                          <div className="package-card">
                            <div className="image-container">
                              {imageUrls[0] ? (
                                <img
                                  src={imageUrls[0]}
                                  alt={pkg.Title || "Package Image"}
                                  style={{
                                    width: "100%",
                                    height: "8em",
                                    objectFit: "cover",
                                    borderRadius: "0.6em",
                                  }}
                                />
                              ) : (
                                <div className="placeholder-image">
                                  No image available
                                </div>
                              )}
                            </div>
                            <div className="package-details">
                              <IonText className="package-title">
                                {pkg.Title || "Untitled Package"}
                              </IonText>
                              <IonText className="package-price">
                                {pkg.price
                                  ? `RM ${pkg.price}`
                                  : "Price on request"}
                              </IonText>
                            </div>
                          </div>
                        </IonRouterLink>
                      </IonCol>
                    );
                  })}
                </IonRow>
              </Fragment>
            ))
          )}
        </IonGrid>
      </IonContent>
      <Footer />
    </IonPage>
  );
};

export default VisitorPackage;
