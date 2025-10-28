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
  isPlatform, // Import isPlatform
} from "@ionic/react";
import { Fragment, useState, useEffect } from "react";
import "../Main.scss";
import "../pages/VisitorPackages.scss";
import supabase from "../supabaseClient";
import { getAssetUrls, Icons } from "../utils/homeAssets";

// Define a more specific type for Supabase errors if known
interface SupabaseError {
  message: string;
  // Add other properties if known, e.g., 'code', 'details', 'hint'
}

// Define a type for the expected structure of package_type when it's an object
interface PackageTypeObject {
  package_type?: { packageName?: string };
  packageName?: string;
}

interface PackageData {
  id: number;
  numberOfTenant?: number;
  location?: string;
  Contact?: object | null;
  ammenities?: object | null;
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
  console.log("🚀 VisitorPackage component rendering");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [packageGroups, setPackageGroups] = useState<{
    [type: string]: { packages: PackageData[]; count: number };
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use useEffect instead of useIonViewWillEnter for more reliable execution
  useEffect(() => {
    console.log("🔄 useEffect triggered - Starting data fetch");

    const initializePageData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Step 1: Checking authentication session...");
        // Check login status
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
        console.log("✅ Session status:", !!session);

        console.log("Step 2: Fetching packages from Supabase...");
        // Fetch all packages from Supabase
        const { data: packagesData, error: packagesError }: { data: PackageData[] | null; error: SupabaseError | null } = await supabase
          .from("Packages")
          .select("*")
          .order("created_at", { ascending: false });

        console.log("📦 Supabase Response:");
        console.log("  - Data received:", packagesData);
        console.log("  - Error:", packagesError);
        console.log("  - Number of packages:", packagesData?.length || 0);

        if (packagesError) {
          console.error("❌ Supabase error:", packagesError);
          // Type guard for error message access
          setError(`Database error: ${packagesError instanceof Error ? packagesError.message : String(packagesError)}`);
          setLoading(false);
          return;
        }

        if (!packagesData || packagesData.length === 0) {
          console.warn("⚠️ No packages found in database");
          setPackageGroups({});
          setLoading(false);
          return;
        }

        console.log("Step 3: Processing packages...");
        // Process packages
        const groups: Record<
          string,
          { packages: PackageData[]; count: number }
        > = {};

        packagesData.forEach((pkg: PackageData, index) => { // Added type for pkg
          console.log(`\n--- Processing Package ${index + 1} ---`);
          console.log("ID:", pkg.id);
          console.log("Title:", pkg.Title);
          console.log("Price:", pkg.price);
          console.log("Raw package_type:", pkg.package_type);
          console.log("Type of package_type:", typeof pkg.package_type);
          console.log("Raw image_urls:", pkg.image_urls);
          console.log("Type of image_urls:", typeof pkg.image_urls);

          // === PARSE IMAGE URLS ===
          let imageUrls: string[] = [];

          if (Array.isArray(pkg.image_urls)) {
            console.log("  → image_urls is already an array");
            imageUrls = pkg.image_urls;
          } else if (typeof pkg.image_urls === "string") {
            const trimmed = pkg.image_urls.trim();
            console.log("  → image_urls is a string:", trimmed);

            if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
              // PostgreSQL array format: {url1,url2}
              console.log("  → Detected PostgreSQL array format");
              imageUrls = trimmed
                .slice(1, -1)
                .split(",")
                .map((url: string) => url.trim()) // Added type for url
                .filter((url: string) => url.length > 0); // Added type for url
            } else if (trimmed.startsWith("[")) {
              // JSON array string
              console.log("  → Detected JSON array format");
              try {
                imageUrls = JSON.parse(trimmed);
              } catch (e) {
                console.error("  ✗ Error parsing JSON image_urls:", e);
              }
            } else {
              // Single URL string
              console.log("  → Single URL string");
              imageUrls = [trimmed];
            }
          }

          console.log("  ✓ Final parsed image_urls:", imageUrls);

          // === PARSE PACKAGE TYPE ===
          let packageTypeName = "Unknown";

          if (pkg.package_type) {
            const pt = pkg.package_type;
            console.log("  → Processing package_type:", pt);

            if (typeof pt === "object" && pt !== null) {
              // Cast to PackageTypeObject to access properties safely
              const packageTypeObj = pt as PackageTypeObject;
              console.log("  → package_type is an object");
              console.log("  → Keys:", Object.keys(packageTypeObj));

              // Handle nested: {package_type: {packageName: "..."}}
              if (
                packageTypeObj.package_type &&
                typeof packageTypeObj.package_type === "object" &&
                packageTypeObj.package_type.packageName
              ) {
                packageTypeName = packageTypeObj.package_type.packageName;
                console.log("  → Found nested packageName:", packageTypeName);
              }
              // Handle flat: {packageName: "..."}
              else if (packageTypeObj.packageName) {
                packageTypeName = packageTypeObj.packageName;
                console.log("  → Found direct packageName:", packageTypeName);
              }
            } else if (typeof pt === "string") {
              console.log("  → package_type is a string, attempting to parse");
              try {
                const parsed = JSON.parse(pt);
                // Ensure parsed is treated as PackageTypeObject for safety
                const parsedPackageTypeObj = parsed as PackageTypeObject;
                if (parsedPackageTypeObj.package_type && typeof parsedPackageTypeObj.package_type === "object" && parsedPackageTypeObj.package_type.packageName) {
                  packageTypeName = parsedPackageTypeObj.package_type.packageName;
                } else if (parsedPackageTypeObj.packageName) {
                  packageTypeName = parsedPackageTypeObj.packageName;
                }
                console.log("  → Parsed packageName:", packageTypeName);
              } catch (e) {
                console.error("  ✗ Error parsing package_type string:", e);
              }
            }
          }

          console.log("  ✓ Final package type:", packageTypeName);

          // === CREATE OR UPDATE GROUP ===
          if (!groups[packageTypeName]) {
            groups[packageTypeName] = { packages: [], count: 0 };
            console.log("  📁 Created new group:", packageTypeName);
          }

          groups[packageTypeName].packages.push({
            ...pkg,
            image_urls: imageUrls,
          });
          groups[packageTypeName].count += 1;
          console.log("  ✓ Added to group:", packageTypeName);
        });

        console.log("\n✅ PROCESSING COMPLETE");
        console.log("📊 Final grouped packages:", groups);
        console.log("📊 Total groups:", Object.keys(groups).length);
        console.log("📊 Group names:", Object.keys(groups));

        setPackageGroups(groups);
        setLoading(false);
      } catch (error) {
        console.error("💥 FATAL ERROR:", error);
        setError(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        setPackageGroups({});
        setLoading(false);
      }
    };

    initializePageData();
  }, []); // Empty dependency array - runs once on mount

  // Scrolling items
  const scrollItems = Array.from({ length: 7 }, (_, i) => (
    <Fragment key={i}>
      <IonImg className="home-move" src={getAssetUrls().move}></IonImg>
      <IonLabel aria-hidden="true">Book Your Place Now</IonLabel>
    </Fragment>
  ));

  // Platform detection for conditional rendering
  const isMobile = isPlatform('mobile');
  const isDesktopWeb = !isMobile; // Assuming anything not mobile is desktop web for this context

  console.log("📺 Current render state:", {
    loading,
    error,
    groupCount: Object.keys(packageGroups).length,
    isLoggedIn,
    isMobile,
    isDesktopWeb,
  });

  return (
    <IonPage
      id="main-content"
      style={{ "--background": "rgba(246, 239, 229, 1)" }}
    >
      <IonContent style={{ "--background": "rgba(246, 239, 229, 1)" }}>
        <IonGrid>
          {/* Infinite Scroll Section - Conditionally rendered */}
          {isDesktopWeb && (
            <IonItem
              lines="none"
              className="infinite-scroll"
              style={{ "--background": "rgb(231, 223, 213)" }}
            >
              <div className="scroll-content">{scrollItems}</div>
            </IonItem>
          )}

          {/* Navigation Row */}
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

            <IonRouterLink routerLink="/Home" className="no-style-link">
              <IonCol size="auto">
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

        {/* Title Section */}
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

        {/* Package Groups Section */}
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
                <IonText
                  style={{ display: "block", marginTop: "1em", color: "#666" }}
                >
                  Open browser console (F12) to see detailed debug information
                </IonText>
              </IonCol>
            </IonRow>
          ) : (
            Object.entries(packageGroups).map(([type, group]) => (
              <Fragment key={type}>
                
                <IonRow className="ion-padding">
                  <IonCol size="12">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <IonText
                        className="section-title"
                        style={{
                          color:"#503216",
                          fontSize: "1.4em",
                          fontWeight: "bold",
                          fontFamily: "'Kaisei Tokumin', serif",
                          // marginBottom: "1em", // Removed to improve alignment with icon
                        }}
                      >
                        {type}
                      </IonText>
                      <IonIcon src={Icons.arrowForward} style={{ color: '#503216', marginLeft: '8px', fontSize: '1.4em' }}></IonIcon>
                    </div>
                  </IonCol>
                  {group.packages.map((pkg) => (
                    <IonCol size="12" size-sm="4.8" size-md="2.8" key={pkg.id}>
                      <div
                        className="package-card"
                        style={{ marginBottom: "2em" }}
                      >
                        <div className="image-container">
                          {pkg.image_urls && Array.isArray(pkg.image_urls) && pkg.image_urls.length > 0 ? (
                            <img
                              src={pkg.image_urls[0]}
                              alt={pkg.Title || "Package Image"}
                              style={{
                                width: "100%",
                                height: "8em",
                                objectFit: "cover",
                                borderRadius: "0.6em",
                              }}
                              onError={(e) => {
                                console.error(
                                  "Image failed to load:",
                                  pkg.image_urls[0]
                                );
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              className="placeholder-image"
                              style={{
                                width: "100%",
                                height: "8em",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#e0e0e0",
                                borderRadius: "0.6em",
                                color: "#666",
                              }}
                            >
                              No image available
                            </div>
                          )}
                        </div>
                        <div className="package-details">
                          <IonText
                            className="package-title"
                            style={{
                              fontSize: "1.05em",
                              fontWeight: "700",
                              display: "block",
                              marginBottom: "0.4em",
                            }}
                          >
                            {pkg.Title || "Untitled Package"}
                          </IonText>
                          <IonText
                            className="package-price"
                            style={{
                              fontSize: "0.95em",
                              color: "#2c3e50",
                              fontWeight: "600",
                            }}
                          >
                            {pkg.price ? `RM ${pkg.price}` : "Price on request"}
                          </IonText>
                        </div>
                      </div>
                    </IonCol>
                  ))}
                </IonRow>
              </Fragment>
            ))
          )}
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default VisitorPackage;
