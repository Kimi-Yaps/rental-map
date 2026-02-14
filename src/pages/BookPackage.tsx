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
import { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router";
import "./BookPage.scss";
import ResizableWindow from '../components/ResizableWindow';
import supabase from "../supabaseConfig";
import { Package, WindowState } from "../interfaces/Booking";
import {
  arrowBackOutline,
} from 'ionicons/icons';

// Define Tab interface locally for now
interface OpenWindowState {
  id: number;
  pkg: Package;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

export const Icons = {
  camera: "public/camera.svg",
  noise: "public/rectangle-noise.webp",
  cart: "public/cart.svg",
  browsePage: "public/browsepage.svg",
  malayFlag: "public/flag-malaysia.svg",
  user: "public/profile-fill.svg",
  destroy: "public/destroy.svg",
  max: "public/max.svg",
  mini: "public/mini.svg",
};

const isVideo = (url: string): boolean => {
  const lowercasedUrl = url.toLowerCase();
  return lowercasedUrl.endsWith('.mp4') || lowercasedUrl.endsWith('.mov');
};

const BookPackage: React.FC = () => {
  const history = useHistory();

  const [packages, setPackages] = useState<Package[]>([]);
  const [iconStates, setIconStates] = useState<WindowState[]>([]);
  const [draggingIconId, setDraggingIconId] = useState<number | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>('');
  const saveTimeoutRef = useRef<number | null>(null);
  const [draggedOverPackageId, setDraggedOverPackageId] = useState<number | null>(null);

  const [openWindows, setOpenWindows] = useState<OpenWindowState[]>([]);

  const handleBack = () => {
    history.goBack();
  };

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase.from('Packages').select('*');
      if (error) {
        console.error('Error fetching packages:', error);
      } else {
        if (Array.isArray(data)) {
            const fetchedPackages: Package[] = data.map((pkg: any) => ({
              id: pkg.id,
              numberOfTenant: pkg.numberOfTenant ?? null,
              location: pkg.location ?? null,
      Contact: pkg.Contact ?? null as any,
              ammenities: pkg.ammenities ?? null,
              price: pkg.price ?? null,
              description: pkg.description ?? '',
              created_at: pkg.created_at,
              icon_url: pkg.icon_url ?? null,
              Title: pkg.Title ?? null,
              pulauName: pkg.pulauName ?? null,
              image_urls: pkg.image_urls ?? [],
              icon_style: pkg.icon_style || { position: { x: Math.random() * 500, y: Math.random() * 300 }, zIndex: pkg.id },
            }));
          setPackages(fetchedPackages);
          setIconStates(
            fetchedPackages.map((pkg: Package) => ({
              id: pkg.id,
              position: pkg.icon_style?.position || { x: Math.random() * 500, y: Math.random() * 300 },
              size: { width: 75, height: 75 },
              isMinimized: false,
              isMaximized: false,
              zIndex: pkg.icon_style?.zIndex || pkg.id,
            }))
          );
        } else {
          console.error('Fetched data is not an array:', data);
        }
      }
    };

    fetchPackages();
  }, []);

  const bringToFront = (id: number) => {
    setOpenWindows(currentWindows => {
      const maxZIndex = Math.max(...currentWindows.map(w => w.zIndex));
      return currentWindows.map(w => 
        w.id === id ? { ...w, zIndex: maxZIndex + 1 } : w
      );
    });
  };

  const handleIconClick = (pkg: Package) => {
    const existingWindow = openWindows.find(w => w.id === pkg.id);
    if (existingWindow) {
      bringToFront(pkg.id);
    } else {
      const maxZIndex = openWindows.length > 0 ? Math.max(...openWindows.map(w => w.zIndex)) : 100;
      const newWindow: OpenWindowState = {
        id: pkg.id,
        pkg: pkg,
        position: { x: 100 + openWindows.length * 20, y: 100 + openWindows.length * 20 },
        size: { width: 600, height: 400 },
        zIndex: maxZIndex + 1,
        isMinimized: false,
        isMaximized: false,
      };
      setOpenWindows([...openWindows, newWindow]);
    }
  };

  const closeWindow = (id: number) => {
    setOpenWindows(openWindows.filter(w => w.id !== id));
  };

  const updateWindowState = (id: number, newPosition: {x: number, y: number}, newSize: {width: number, height: number}) => {
    setOpenWindows(openWindows.map(w => w.id === id ? {...w, position: newPosition, size: newSize} : w));
  }

  const handleSavePackage = (updatedPackage: Package) => {
    setPackages(prevPackages =>
        prevPackages.map(p =>
            p.id === updatedPackage.id ? updatedPackage : p
        )
    );
    setOpenWindows(prevWindows => 
        prevWindows.map(w => 
            w.id === updatedPackage.id ? { ...w, pkg: updatedPackage } : w
        )
    );
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
      const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
      if (allowedTypes.includes(file.type)) {
          await uploadIcon(file, pkg);
      } else {
          alert('Only JPG, PNG, MP4, and MOV files are allowed.');
      }
  }
};

const uploadIcon = async (file: File, pkg: Package) => {
  const fileExt = file.name.split('.').pop();
  const baseFileName = file.name.substring(0, file.name.lastIndexOf('.'));
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
          .update({ icon_url: newIconUrl, Title: baseFileName })
          .eq('id', pkg.id);

      if (updateError) {
          console.error('Error updating package icon_url or Title:', updateError);
      } else {
          setPackages(prevPackages =>
              prevPackages.map(p =>
                  p.id === pkg.id ? { ...p, icon_url: newIconUrl, Title: baseFileName } : p
              )
          );
      }
  }
};

  const handleTabButtonClick = () => {
    console.log("Tab button clicked");
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
    setDraggingIconId(id);

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    setOffset({ x: offsetX, y: offsetY });
  };

const handleCanvasDragOver = (e: React.DragEvent<HTMLIonContentElement>) => {
  e.preventDefault();
  e.stopPropagation();
};

const handleCanvasDrop = (e: React.DragEvent<HTMLIonContentElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggingIconId === null) return;

    const canvasRect = e.currentTarget.getBoundingClientRect();
    const iconState = iconStates.find(state => state.id === draggingIconId);

    if (!iconState) {
      setDraggingIconId(null);
      return;
    }

    let newX = e.clientX - canvasRect.left - offset.x;
    let newY = e.clientY - canvasRect.top - offset.y;

    const iconWidth = iconState.size.width;
    const iconHeight = iconState.size.height;

    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    newX = Math.min(canvasRect.width - iconWidth, newX);
    newY = Math.min(canvasRect.height - iconHeight, newY);

    setIconStates(prevStates => {
      const updatedStates = prevStates.map(state =>
        state.id === draggingIconId
          ? {
              ...state,
              position: { x: newX, y: newY },
              zIndex: Math.max(...prevStates.map(s => s.zIndex)) + 1,
            }
          : state
      );

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveLayout(updatedStates);
      }, 1000);

      return updatedStates;
    });

    setDraggingIconId(null);
  };

  const handleTitleEditStart = (pkg: Package) => {
    setEditingTitleId(pkg.id);
    setEditedTitle(pkg.Title || 'Untitled Package');
  };

  const handleTitleBlur = async (pkgId: number) => {
    if (editingTitleId === pkgId) {
      const updatedPackages = packages.map(p =>
        p.id === pkgId ? { ...p, Title: editedTitle } : p
      );
      setPackages(updatedPackages);

      const { error } = await supabase
        .from('Packages')
        .update({ Title: editedTitle })
        .eq('id', pkgId);

      if (error) {
        console.error('Error updating package title:', error);
      }

      setEditingTitleId(null);
      setEditedTitle('');
    }
  };

  const saveLayout = async (currentIconStates: WindowState[]) => {
    try {
      const updates = currentIconStates.map(state => ({
        id: state.id,
        icon_style: {
          position: state.position,
          zIndex: state.zIndex,
        },
      }));

      const { error } = await supabase.from('Packages').upsert(updates, {
        onConflict: 'id',
      });

      if (error) {
        console.error('Error saving layout:', error);
      } else {
        console.log('Layout saved successfully!');
      }
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  return (
    <IonPage id="main-content">
        <IonContent className="content" onDragOver={handleCanvasDragOver} onDrop={handleCanvasDrop}>
          <IonImg src={Icons.noise} className="background-noise"></IonImg>
          <IonImg src={Icons.camera} className="centered-icon"></IonImg>

          <IonGrid className="booking-nav-container">
          <IonRow className="booking-nav">

            <IonCol size="auto">
            </IonCol>

            <IonCol className="icon-list">

              <IonCol>
                <IonButton onClick={handleBack} className='backButton'>
                  <IonIcon icon={arrowBackOutline} />
                </IonButton>
              </IonCol>

              <IonIcon src={Icons.malayFlag} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.cart} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.user} className="cust-icon"></IonIcon>

              <IonButton
                fill="clear"
                className="custom-tab-button"
                onClick={handleTabButtonClick}
                disabled={false}
              >
                <div className="tab-accent-strip" />
                <span className="tab-counter">
                  {openWindows.length}
                </span>
              </IonButton>

            </IonCol>

          </IonRow>
        </IonGrid>

        {openWindows.map(win => (
          <ResizableWindow
            key={win.id}
            windowState={win}
            onClose={() => closeWindow(win.id)}
            onSavePackage={handleSavePackage}
            onFocus={() => bringToFront(win.id)}
            onStateChange={(newState) => {
              const newWindows = openWindows.map(w => w.id === win.id ? {...w, ...newState} : w);
              setOpenWindows(newWindows);
            }}
          />
        ))}

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
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
                  border: draggedOverPackageId === pkg.id ? '2px dashed blue' : 'none',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                  textAlign: 'center',
                }}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, pkg.id)}
                onClick={() => handleIconClick(pkg)}
                onDrop={(e) => handleIconDrop(e, pkg)}
                onDragEnter={(e) => handleDragEnter(e, pkg.id)}
                onDragLeave={(e) => handleDragLeave(e)}
              >
                <div style={{ width: '100%', height: '80%', overflow: 'hidden' }}>
                  {pkg.icon_url && (
                    isVideo(pkg.icon_url) ? (
                      <video src={pkg.icon_url} style={{ width: '100%', height: '100%', cursor: 'pointer' }} autoPlay loop muted />
                    ) : (
                      <IonImg src={pkg.icon_url} style={{ width: '100%', height: '100%', cursor: 'pointer' }} />
                    )
                  )}
                </div>
                {editingTitleId === pkg.id ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={() => handleTitleBlur(pkg.id)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTitleBlur(pkg.id);
                      }
                    }}
                    style={{ width: '100%', height: '20%', textAlign: 'center', color: 'black', backgroundColor: 'white', border: 'none', outline: 'none' }}
                  />
                ) : (
                  <div
                    style={{ width: '100%', height: '20%', cursor: 'pointer', color: 'black' }}
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