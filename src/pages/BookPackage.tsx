import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonImg,
} from "@ionic/react";
import { useState, useEffect, useRef } from "react"; // Import useRef
import { useHistory } from "react-router"; // Import useHistory
import "./BookPage.scss";
import ResizableWindow from '../components/ResizableWindow';
import supabase from "../supabaseConfig";
import { Package, WindowState } from "../interfaces/Booking"; // Import the Package and WindowState interfaces
import {
  arrowBackOutline,
} from 'ionicons/icons';

// Define Tab interface locally for now
interface Tab {
  id: number;
  title: string;
  isActive: boolean;
  isMinimized: boolean;
}

export const Icons = {
  camera: "public/camera.svg",
  noise: "public/rectangle-noise.webp",
  cart: "public/cart.svg",
  browsePage: "public/browsepage.svg",
  malayFlag: "public/flag-malaysia.svg",
  user: "public/profile-fill.svg",
};

// Define the structure of an enhanced suggestion
const isVideo = (url: string): boolean => {
  const lowercasedUrl = url.toLowerCase();
  return lowercasedUrl.endsWith('.mp4') || lowercasedUrl.endsWith('.mov');
};


// Main component - removed the props that don't belong here
const BookPackage: React.FC = () => {
  const history = useHistory(); // Get the history object

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [draggedOverPackageId, setDraggedOverPackageId] = useState<number | null>(null);
  // New states for icon dragging
  const [iconStates, setIconStates] = useState<WindowState[]>([]);
  const [draggingIconId, setDraggingIconId] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // State for editing package titles
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>('');

  // Ref for the save layout timeout
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State for tab management
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);


  const handleBack = () => {
    history.goBack(); // Use history.goBack()
  };

  // Removed unused useEffect for isDesktop

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase.from('Packages').select('*');
      if (error) {
        console.error('Error fetching packages:', error);
      } else {
        // Explicitly type the data to ensure it conforms to Package interface
        if (Array.isArray(data)) {
            const fetchedPackages: Package[] = data.map((pkg: any) => ({
              id: pkg.id,
              numberOfTenant: pkg.numberOfTenant ?? null,
              location: pkg.location ?? null,
      Contact: pkg.Contact ?? null as any,
              ammenities: pkg.ammenities ?? null,
              price: pkg.price ?? null,
              description: pkg.description ?? '' as string, // Explicitly cast to string to satisfy type checker
              created_at: pkg.created_at,
              icon_url: pkg.icon_url ?? null,
              Title: pkg.Title ?? null,
              pulauName: pkg.pulauName ?? null,
              image_urls: pkg.image_urls ?? [],
              // Initialize icon_style from fetched data or default
              icon_style: pkg.icon_style || { position: { x: Math.random() * 500, y: Math.random() * 300 }, zIndex: pkg.id },
            }));
          setPackages(fetchedPackages);
          // Initialize iconStates based on fetched packages and their icon_style
          setIconStates(
            fetchedPackages.map((pkg: Package) => ({
              id: pkg.id,
              position: pkg.icon_style?.position || { x: Math.random() * 500, y: Math.random() * 300 }, // Use fetched or random position
              size: { width: 75, height: 75 }, // Increased icon size by 1.5x (50 * 1.5)
              isMinimized: false,
              isMaximized: false,
              zIndex: pkg.icon_style?.zIndex || pkg.id, // Use fetched or pkg.id as zIndex
            }))
          );
        } else {
          console.error('Fetched data is not an array:', data);
        }
      }
    };

    fetchPackages();
  }, []);

  const handleIconClick = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsWindowOpen(true);
    // Potentially open a new tab or activate an existing one for this package
    // For now, just opening the window. Tab management logic will follow.
  };

  const handleCloseWindow = () => {
    setIsWindowOpen(false);
    setSelectedPackage(null);
    // Potentially close the associated tab if it exists
  };

  const handleSavePackage = (updatedPackage: Package) => {
    setPackages(prevPackages =>
        prevPackages.map(p =>
            p.id === updatedPackage.id ? updatedPackage : p
        )
    );
    if (selectedPackage && selectedPackage.id === updatedPackage.id) {
        setSelectedPackage(updatedPackage);
    }
};

const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, pkgId: number) => {
  e.preventDefault();
  e.stopPropagation();
  setDraggedOverPackageId(pkgId);
};

const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.stopPropagation();
  setDraggedOverPackageId(null);
};

const handleIconDrop = async (e: React.DragEvent<HTMLDivElement>, pkg: Package) => {
  e.preventDefault();
  e.stopPropagation();
  setDraggedOverPackageId(null);
  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
      const file = files[0];
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime']; // Added video types
      if (allowedTypes.includes(file.type)) {
          await uploadIcon(file, pkg);
      } else {
          alert('Only JPG, PNG, MP4, and MOV files are allowed.'); // Updated alert message
      }
  }
};

const uploadIcon = async (file: File, pkg: Package) => {
  const fileExt = file.name.split('.').pop();
  // Extract filename without extension for the Title
  const baseFileName = file.name.substring(0, file.name.lastIndexOf('.'));
  // Use a unique name for storage to avoid conflicts
  const uniqueFileName = `${Date.now()}.${fileExt}`;
  const filePath = `public/packages/${pkg.id}/icon/${uniqueFileName}`;

  const { error: uploadError } = await supabase.storage.from('imgvideo-bucket1').upload(filePath, file);

  if (uploadError) {
      console.error('Error uploading icon:', uploadError);
      return;
  }

  const { data: publicUrlData } = supabase.storage.from('imgvideo-bucket1').getPublicUrl(filePath);
  const newIconUrl = publicUrlData?.publicUrl;

  if (newIconUrl) {
      const { error: updateError } = await supabase
          .from('Packages')
          .update({ icon_url: newIconUrl, Title: baseFileName }) // Added Title update
          .eq('id', pkg.id);

      if (updateError) {
          console.error('Error updating package icon_url or Title:', updateError);
      } else {
          setPackages(prevPackages =>
              prevPackages.map(p =>
                  p.id === pkg.id ? { ...p, icon_url: newIconUrl, Title: baseFileName } : p // Added Title update
              )
          );
      }
  }
};

  // Handler for the tab button
  const handleTabButtonClick = () => {
    console.log("Tab button clicked");
  };

  // Handler for starting to drag an icon
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
    setDraggingIconId(id);

    // Calculate offset from the mouse pointer to the element's top-left corner
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setOffset({ x: offsetX, y: offsetY });
  };

  // Handler for dragging over the canvas
const handleCanvasDragOver = (e: React.DragEvent<HTMLIonContentElement>) => {
  e.preventDefault();
  e.stopPropagation();
};

// Handler for dropping the icon onto the canvas
const handleCanvasDrop = (e: React.DragEvent<HTMLIonContentElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggingIconId === null) return;

    const canvasRect = e.currentTarget.getBoundingClientRect();
    const iconState = iconStates.find(state => state.id === draggingIconId);

    if (!iconState) {
      setDraggingIconId(null); // Reset if icon state not found
      return;
    }

    // Calculate new position based on mouse position and offset
    let newX = e.clientX - canvasRect.left - offset.x;
    let newY = e.clientY - canvasRect.top - offset.y;

    // Boundary checks
    const iconWidth = iconState.size.width;
    const iconHeight = iconState.size.height;

    // Prevent icon from going off-screen left/top
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    // Prevent icon from going off-screen right/bottom
    newX = Math.min(canvasRect.width - iconWidth, newX);
    newY = Math.min(canvasRect.height - iconHeight, newY);

    // Update iconStates and set a timeout to save the layout
    setIconStates(prevStates => {
      const updatedStates = prevStates.map(state =>
        state.id === draggingIconId
          ? {
              ...state,
              position: { x: newX, y: newY },
              zIndex: Math.max(...prevStates.map(s => s.zIndex)) + 1, // Bring to front
            }
          : state
      );

      // Clear any existing timeout to avoid multiple saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set a new timeout to save the layout
      saveTimeoutRef.current = setTimeout(() => {
        saveLayout(updatedStates); // Pass updatedStates to saveLayout
      }, 1000); // 1 second delay

      return updatedStates;
    });

    setDraggingIconId(null); // Reset dragging state
  };

  // Handler for starting title edit
  const handleTitleEditStart = (pkg: Package) => {
    setEditingTitleId(pkg.id);
    setEditedTitle(pkg.Title || 'Untitled Package');
  };

  // Handler for saving title edit (on blur or Enter key)
  const handleTitleBlur = async (pkgId: number) => {
    if (editingTitleId === pkgId) {
      // Update local state first
      const updatedPackages = packages.map(p =>
        p.id === pkgId ? { ...p, Title: editedTitle } : p
      );
      setPackages(updatedPackages);

      // Update in Supabase
      const { error } = await supabase
        .from('Packages')
        .update({ Title: editedTitle })
        .eq('id', pkgId);

      if (error) {
        console.error('Error updating package title:', error);
        // Optionally revert changes or show error message
      }

      setEditingTitleId(null); // Exit edit mode
      setEditedTitle('');
    }
  };

  // Function to save the layout of icons
  // Modified to accept updatedIconStates and remove alerts
  const saveLayout = async (currentIconStates: WindowState[]) => {
    try {
      // Prepare data for bulk update
      const updates = currentIconStates.map(state => ({
        id: state.id,
        icon_style: {
          position: state.position,
          zIndex: state.zIndex,
        },
      }));

      // Perform bulk update in Supabase
      const { error } = await supabase.from('Packages').upsert(updates, {
        onConflict: 'id', // Specify the conflict resolution strategy
      });

      if (error) {
        console.error('Error saving layout:', error);
        // Removed alert
      } else {
        console.log('Layout saved successfully!');
        // Removed alert
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      // Removed alert
    }
  };

  return (
    <IonPage id="main-content">
        <IonContent className="content" onDragOver={handleCanvasDragOver} onDrop={handleCanvasDrop}>
          {/* Moved camera icon to be a sibling of background-noise */}
          <IonImg src={Icons.noise} className="background-noise"></IonImg>
          <IonImg src={Icons.camera} className="centered-icon"></IonImg>

          <IonGrid className="booking-nav-container">
          <IonRow className="booking-nav">

            {/* Empty column for spacing if needed */}
            <IonCol size="auto">
              {/* Add logo or other elements here if needed */}
            </IonCol>

            {/* Main navigation icons */}
            <IonCol className="icon-list">

              <IonCol>
                <IonButton onClick={handleBack} className='backButton'>
                  <IonIcon icon={arrowBackOutline} />
                </IonButton>
              </IonCol>

              <IonIcon src={Icons.malayFlag} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.cart} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.user} className="cust-icon"></IonIcon>

              {/* Tab Button */}
              <IonButton
                fill="clear"
                className="custom-tab-button"
                onClick={handleTabButtonClick}
                disabled={false}
              >
                {/* top accent strip */}
                <div className="tab-accent-strip" />

                {/* counter */}
                <span className="tab-counter">
                  {tabs.length} {/* Display the count of open tabs */}
                </span>
              </IonButton>

            </IonCol>

          </IonRow>
        </IonGrid>

        {isWindowOpen && selectedPackage && (
          <ResizableWindow
            selectedPackage={selectedPackage}
            title="Package"
            onClose={handleCloseWindow}
            onSavePackage={handleSavePackage}
          />
        )}

        {/* Canvas for draggable icons */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%', // Ensure it takes up available space
            overflow: 'hidden', // To keep icons within bounds visually
          }}
        >
          {/* Save Layout Button - Removed as saving is now automatic */}
          {/* <div className="save-layout-button-container">
            <IonButton onClick={saveLayout} color="primary">Save Layout</IonButton>
          </div> */}
          {packages.map((pkg) => {
            const state = iconStates.find(s => s.id === pkg.id);
            if (!state) return null;

            return (
              <div
                key={pkg.id}
                style={{
                  position: 'absolute',
                  left: `${state.position.x}px`,
                  top: `${state.position.y}px`,
                  width: `${state.size.width}px`,
                  height: `${state.size.height}px`,
                  cursor: 'grab',
                  zIndex: state.zIndex,
                  // Visual feedback for file drop target on the icon itself
                  border: draggedOverPackageId === pkg.id ? '2px dashed blue' : 'none',
                  display: 'flex', // To center content if needed
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column', // Stack icon and title vertically
                  textAlign: 'center', // Center text
                }}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, pkg.id)}
                onClick={() => handleIconClick(pkg)}
                onDrop={(e) => handleIconDrop(e, pkg)}
                onDragEnter={(e) => handleDragEnter(e, pkg.id)}
                onDragLeave={(e) => handleDragLeave(e)}
              >
                {/* Icon/Video */}
                <div style={{ width: '100%', height: '80%', overflow: 'hidden' }}> {/* Allocate space for icon */}
                  {pkg.icon_url && (
                    isVideo(pkg.icon_url) ? (
                      <video src={pkg.icon_url} style={{ width: '100%', height: '100%', cursor: 'pointer' }} autoPlay loop muted />
                    ) : (
                      <IonImg src={pkg.icon_url} style={{ width: '100%', height: '100%', cursor: 'pointer' }} />
                    )
                  )}
                </div>
                {/* Title */}
                {editingTitleId === pkg.id ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={() => handleTitleBlur(pkg.id)} // Save on blur
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTitleBlur(pkg.id); // Save on Enter key
                      }
                    }}
                    style={{ width: '100%', height: '20%', textAlign: 'center', color: 'black', backgroundColor: 'white', border: 'none', outline: 'none' }} // Basic styling for input
                  />
                ) : (
                  <div
                    style={{ width: '100%', height: '20%', cursor: 'pointer', color: 'black' }} // Changed color to black as requested
                    onClick={() => handleTitleEditStart(pkg)}
                  >
                    {pkg.Title || 'Untitled Package'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </IonContent>
    </IonPage>
  );
};

export default BookPackage;
