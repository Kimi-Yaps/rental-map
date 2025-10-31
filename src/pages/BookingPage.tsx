import DOMPurify from 'dompurify';
import React, { useEffect, useState ,Fragment} from "react";
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonButton,
  IonImg,
  IonSpinner,
  IonBackButton,
  IonToolbar,
  IonButtons,
  IonItem,
  IonLabel,
  IonRouterLink,
  IonIcon
} from "@ionic/react";
import { useParams } from "react-router-dom";
import "./BookingPage.scss";
import supabase from "../supabaseClient";
import { getAssetUrls, Icons } from "../utils/homeAssets";

interface PackageData {
  id: number;
  numberOfTenant?: number;
  location?: string;
  Contact?: Record<string, unknown> | string | null;
  ammenities?: Record<string, unknown> | string | null;
  price?: number;
  description?: string;
  created_at?: string;
  Title?: string;
  image_urls?: string[] | string | null;
  package_type?: unknown;
}

const scrollItems = Array.from({ length: 7 }, (_, i) => (
  <Fragment key={i}>
    <IonImg className="home-move" src={getAssetUrls().move}></IonImg>
    <IonLabel aria-hidden="true">Book Your Place Now</IonLabel>
  </Fragment>
));

/**
 * BookingPage Component
 * 
 * Displays detailed information about a rental package, including:
 * - Image gallery with main image and thumbnails
 * - Package title, price, and type
 * - Location and guest capacity
 * - Contact information (formatted from JSON/string)
 * - Amenities list (supports HTML from rich editor)
 * - Package description (supports HTML from rich editor)
 * 
 * Data Flow:
 * 1. Loads package data from Supabase using route param :id
 * 2. Handles various data formats:
 *    - Contact info: JSON object or string
 *    - Images: Array, JSON string, or Postgres array
 *    - Rich text: HTML content from editor
 * 3. Sanitizes HTML content before render
 * 
 * Security:
 * - Uses DOMPurify for HTML sanitization
 * - Explicitly selects needed columns from DB
 * - Validates route param before query
 */
const BookingPage: React.FC = () => {
  // Route and state
  const { id } = useParams<{ id: string }>();
  const [pkg, setPkg] = useState<PackageData | null>(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packageGroups, setPackageGroups] = useState<Record<string, { packages: PackageData[]; count: number }>>({});

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

        // Process each package and group them by package type
        for (const pkg of packagesData) {
          // Parse image URLs - handles multiple formats:
          // 1. Array of strings
          // 2. JSON string containing array
          // 3. Postgres array literal {url1,url2}
          // 4. Single URL string
          let imageUrls: string[] = [];
          try {
            if (pkg.image_urls) {
              if (Array.isArray(pkg.image_urls)) {
                imageUrls = pkg.image_urls;
              } else if (typeof pkg.image_urls === "string") {
                const t = pkg.image_urls.trim();
                if (t.startsWith("[")) {
                  try {
                    const parsed = JSON.parse(t);
                    imageUrls = Array.isArray(parsed) ? parsed : [t];
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
            }
          } catch (parseError) {
            console.warn("Error parsing image URLs:", parseError);
            imageUrls = [];
          }

          // Update the package with parsed image URLs and add to groups
          const updatedPkg = { ...pkg, image_urls: imageUrls };
          const type = parsePackageType(pkg.package_type);
          if (!groups[type]) {
            groups[type] = { packages: [], count: 0 };
          }
          groups[type].packages.push(updatedPkg);
          groups[type].count += 1;
        }
      } catch (e) {
        console.error(e);
        setError("Unexpected error during initial data load");
        setLoading(false);
      }
    };

    initializePageData();
  }, []); // Empty dependency array to run only once on mount

  // Effect to load individual package details based on ID
  useEffect(() => {
    const loadPackage = async () => {
      try {
        setLoading(true);
        const pkgId = Number(id);
        if (!pkgId) {
          setError("Invalid package id");
          setLoading(false);
          return;
        }

        // Request only the columns we need — avoids exposing other fields unintentionally
        const { data, error } = await supabase
          .from("Packages")
          .select(
            `id, numberOfTenant, location, Contact, ammenities, price, description, created_at, Title, image_urls, package_type`
          )
          .eq("id", pkgId)
          .limit(1)
          .single();

        if (error) {
          console.error(error);
          setError("Failed to load package");
          setLoading(false);
          return;
        }

        setPkg(data as PackageData);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Unexpected error");
        setLoading(false);
      }
    };

    loadPackage();
  }, [id]);

  /**
   * Parses package type information from various formats:
   * 1. String containing JSON
   * 2. Object with nested structure { package_type: { packageName: string } }
   * 3. Object with flat structure { packageName: string }
   * 4. Raw string value
   * 
   * @param pt - Raw package type value from database
   * @returns Formatted package type name or "Unknown"
   */
  const parsePackageType = (pt: unknown): string => {
    if (!pt) return "Unknown";
    try {
      if (typeof pt === "string") {
        const parsed = JSON.parse(pt);
        // parsed may be an object or primitive
        return (
          (parsed &&
            (parsed.package_type?.packageName || parsed.packageName)) ||
          String(parsed) ||
          "Unknown"
        );
      }
      if (typeof pt === "object" && pt !== null) {
        // Use a type-unsafe access but guarded above
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return pt.package_type?.packageName || pt.packageName || "Unknown";
      }
      return String(pt);
    } catch {
      return String(pt);
    }
  };

  /**
   * Converts various image URL formats to a string array:
   * 1. Array of strings
   * 2. JSON string containing array "[url1, url2]"
   * 3. Postgres array literal "{url1,url2}"
   * 4. Single URL string
   * 
   * @param imgField - Raw image URLs value from database
   * @returns Array of image URLs
   */
  const getImageArray = (imgField: unknown): string[] => {
    if (!imgField) return [];
    if (Array.isArray(imgField)) return imgField as string[];
    if (typeof imgField === "string") {
      const t = imgField.trim();
      if (t.startsWith("[")) {
        try {
          const parsed = JSON.parse(t);
          return Array.isArray(parsed) ? parsed.map(String) : [t];
        } catch {
          return [t];
        }
      }
      if (t.startsWith("{") && t.endsWith("}")) {
        // postgres array style
        return t
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [t];
    }
    return [];
  };

  // Use DOMPurify for robust HTML sanitization
  const sanitizeHtml = (html: string | undefined | null): string => {
    if (!html) return "";
    // DOMPurify.sanitize returns a string
    return DOMPurify.sanitize(html);
  };

  const tryParseJson = (v: unknown): unknown => {
    if (!v) return v;
    if (typeof v === "string") {
      const t = v.trim();
      if (
        (t.startsWith("{") && t.endsWith("}")) ||
        (t.startsWith("[") && t.endsWith("]"))
      ) {
        try {
          return JSON.parse(t);
        } catch {
          return v;
        }
      }
    }
    return v;
  };

  if (loading) {
    return (
      <IonPage id="booking-page">
        <IonGrid className="event-header">
          {/* Include the standard navigation layout from Main.scss */}
          <IonRow className="ion-justify-content-between ion-align-items-center nav-row">
            <IonCol size="auto" className="ion-no-padding">
              <div className="nav-items-container">
                <IonBackButton defaultHref="/visitorPackages" className="nav-text ion-margin-end" />
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonContent>
          <div className="loading-wrap ion-text-center" style={{ padding: '2em' }}>
            <IonSpinner name="crescent" style={{ '--color': 'var(--brand-primary-color, #503216)' }} />
            <IonText style={{ 
              display: 'block', 
              marginTop: '1em',
              fontFamily: 'Kaisei Tokumin, serif',
              color: 'var(--brand-text-dark, #333)'
            }}>
              Loading package...
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error || !pkg) {
    return (
      <IonPage id="booking-page">
        <IonGrid className="event-header">
          {/* Include the standard navigation layout from Main.scss */}
          <IonRow className="ion-justify-content-between ion-align-items-center nav-row">
            <IonCol size="auto" className="ion-no-padding">
              <div className="nav-items-container">
                <IonBackButton defaultHref="/visitorPackages" className="nav-text ion-margin-end" />
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonContent>
          <div className="error-wrap ion-text-center" style={{ padding: '2em' }}>
            <IonText color="danger" style={{
              fontFamily: 'Kaisei Tokumin, serif',
              fontSize: '1.2em',
              color: '#d32f2f'
            }}>
              {error || "Package not found"}
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const images = getImageArray(pkg.image_urls);
  const packageTypeName = parsePackageType(pkg.package_type);

  const renderContact = (c: unknown) => {
    if (!c) return <div>—</div>;
    const parsed = tryParseJson(c);
    if (typeof parsed === "string") {
      return (
        <div className="contact-block">
          <div className="contact-name">{parsed}</div>
        </div>
      );
    }
    if (typeof parsed === "object" && parsed !== null) {
      const obj = parsed as Record<string, unknown>;
      const entries = Object.entries(obj);
      if (entries.length === 1) {
        const [name, phone] = entries[0];
        return (
          <div className="contact-block">
            <div className="contact-name">{name}</div>
            <div className="contact-phone">{String(phone)}</div>
          </div>
        );
      }
      return (
        <ul className="contact-list">
          {entries.map(([k, v]) => (
            <li key={k}>
              <strong>{k}</strong>: {String(v)}
            </li>
          ))}
        </ul>
      );
    }
    return <div>{String(parsed)}</div>;
  };

  return (
    <IonPage id="booking-page">
      <IonContent>
      <IonGrid className="event-header">
      
              <IonItem
                  lines="none"
                  className="infinite-scroll"
                  style={{ "--background": "rgb(231, 223, 213)" }}
                >
                  <IonCol className="scroll-content">{scrollItems}</IonCol>
                </IonItem>
      
                {/* Navigation Row */}
                <IonRow className="ion-justify-content-between ion-align-items-center nav-row">
                  <IonCol size="auto" className="ion-no-padding">
                    <div className="nav-items-container">
                      <IonRouterLink routerLink="/visitorPackages" className="no-style-link">
                        <IonText className="nav-text ion-margin-end">Explore Packages</IonText>
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
                        <IonText className="nav-SignIn ion-margin-end">Sign In</IonText>
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
        <IonGrid className="booking-grid">
          
          <IonRow>
            <IonCol size="12" size-md="7" className="images-col">
              <div className="images-wrap">
                <div className="main-wrap">
                  {images[mainImageIndex] ? (
                    <img
                      src={images[mainImageIndex]}
                      alt={pkg.Title || ""}
                      className="main-image"
                    />
                  ) : (
                    <div className="placeholder-main">No image available</div>
                  )}
                </div>

                {images.length > 0 && (
                  <div className="thumbs-grid" role="list">
                    {images.slice(0, 4).map((src, i) => (
                      <button
                        key={i}
                        role="listitem"
                        className={`thumb ${
                          i === mainImageIndex ? "active" : ""
                        }`}
                        onClick={() => setMainImageIndex(i)}
                        aria-label={`Show image ${i + 1}`}
                      >
                        <img src={src} alt={`thumb-${i}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </IonCol>

            <IonCol size="12" size-md="5" className="details-col">
              <div className="details-inner">
                <h1 className="title">{pkg.Title || "Untitled Package"}</h1>
                <div className="meta">
                  <span className="price">
                    {pkg.price ? `RM ${pkg.price}` : "Price on request"}
                  </span>
                  <span className="type">{packageTypeName}</span>
                </div>

                <div className="specs">
                  <div>
                    <strong>Location</strong>
                    <div>{pkg.location || "—"}</div>
                  </div>
                  <div>
                    <strong>Guests</strong>
                    <div>{pkg.numberOfTenant ?? "—"}</div>
                  </div>
                  <div>
                    <strong>Contact</strong>
                    <div>{renderContact(pkg.Contact)}</div>
                  </div>
                </div>

                <div className="amenities">
                  <h3>Amenities</h3>
                  {pkg.ammenities ? (
                    (() => {
                      const parsed = tryParseJson(pkg.ammenities) as unknown;
                      if (typeof parsed === "string") {
                        // sanitize and render HTML entered by editor
                        return (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(parsed),
                            }}
                          />
                        );
                      }
                      if (typeof parsed === "object" && parsed !== null) {
                        const parsedObj = parsed as Record<string, unknown>;
                        const entries = Object.entries(parsedObj);
                        if (entries.length === 0) return <div>—</div>;
                        return (
                          <ul>
                            {entries.map(([k, v]) => (
                              <li key={k}>
                                {k}: {String(v)}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      // fallback
                      return <div>{String(parsed)}</div>;
                    })()
                  ) : (
                    <div>—</div>
                  )}
                </div>

                <div className="description">
                  <h3>Description</h3>
                  {pkg.description ? (
                    <div
                      className="description-html"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(String(pkg.description)),
                      }}
                    />
                  ) : (
                    <div>No description provided.</div>
                  )}
                </div>

                <div className="booking-actions">
                  <IonButton expand="block" color="primary">
                    Book Now
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </IonButton>
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default BookingPage;
