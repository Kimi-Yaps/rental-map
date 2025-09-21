import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonImg,
  IonText,
} from '@ionic/react';
import './ResizableWindow.scss'; // We will create this SCSS file next
import { Package } from '../interfaces/Package'; // Import Package interface
import { WindowState, WindowPosition, WindowSize } from '../interfaces/Booking'; // Keep these types if they are used elsewhere and not defined locally
import { Icons } from '../pages/BookPackage'; // Import Icons from BookPackage
import supabase from '../supabaseConfig';

// Actual data fetching function using Supabase
const fetchPackages = async (): Promise<Package[]> => {
  try {
    const { data, error } = await supabase
      .from('Packages') // Changed table to 'Packages'
      .select('*'); // Select all columns

    if (error) {
      console.error("Supabase error fetching packages:", error);
      throw error;
    }

    // Supabase typically returns JSONB fields as parsed objects and dates as strings.
    const formattedData = data?.map((pkg: Package) => ({ // Use Package type
      ...pkg,
      // No date formatting needed for packages based on schema, but keep if created_at is relevant
      created_at: pkg.created_at ? new Date(pkg.created_at).toISOString() : '',
      // 'Contact' and 'ammenities' are JSONB, Supabase should parse them correctly into JS objects.
      // Spreading pkg should handle these if they are parsed correctly.
    })) || [];

    return formattedData;
  } catch (err: unknown) {
      // Type guard for error object
      if (err instanceof Error) {
        console.error("Failed to fetch packages:", err.message);
        throw new Error(`Failed to fetch packages: ${err.message}`);
      } else {
        console.error("Failed to fetch packages: An unknown error occurred");
        throw new Error("Failed to fetch packages: An unknown error occurred");
      }
    }
};

// Helper to format currency
const formatCurrency = (amount: number | null): string => { // Allow null for amount
  if (amount === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // Assuming USD, adjust if needed
  }).format(amount);
};

interface ResizableWindowProps {
  initialPosition?: WindowPosition;
  initialSize?: WindowSize;
  title?: string;
  onClose?: () => void;
  // Add other props as needed, e.g., for initial state
}

const ResizableWindow: React.FC<ResizableWindowProps> = ({
  initialPosition = { x: 0, y: 0 }, // Default to top-left, will be centered later
  initialSize = { width: 600, height: 400 },
  title = "Packages", // Changed title to "Packages"
  onClose,
}) => {
  const [windowState, setWindowState] = useState<WindowState>({
    position: initialPosition,
    size: initialSize,
    isMinimized: false,
    isMaximized: false,
    zIndex: 1, // Initial z-index
  });

  const [packages, setPackages] = useState<Package[]>([]); // Changed state from bookings to packages
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeHandlesRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Centering the window on mount
  useEffect(() => {
    if (!windowRef.current) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const currentWidth = windowRef.current.offsetWidth;
    const currentHeight = windowRef.current.offsetHeight;

    const centeredPosition = {
      x: Math.max(0, (screenWidth - currentWidth) / 2),
      y: Math.max(0, (screenHeight - currentHeight) / 2),
    };

    setWindowState(prevState => ({
      ...prevState,
      position: centeredPosition,
      size: {
        width: Math.min(initialSize.width, screenWidth * 0.9),
        height: Math.min(initialSize.height, screenHeight * 0.9),
      },
    }));
  }, [initialSize.width, initialSize.height]); // Re-center if initial size changes

  // Data fetching
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedPackages = await fetchPackages(); // Call the new fetch function
        setPackages(fetchedPackages); // Update the new state variable
      } catch (err) {
        console.error("Failed to fetch packages:", err);
        setError("Failed to load packages. Please try again later."); // Update error message
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Dragging logic (remains the same)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!headerRef.current || !windowRef.current) return;

    // Check if the click was on the header
    if (headerRef.current.contains(e.target as Node)) {
      setIsDragging(true);
      const rect = windowRef.current.getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      // Bring to front on click
      setWindowState(prevState => ({ ...prevState, zIndex: prevState.zIndex + 1 }));
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !windowRef.current) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let newX = e.clientX - offset.x;
    let newY = e.clientY - offset.y;

    // Boundary constraints
    newX = Math.max(0, Math.min(newX, screenWidth - windowState.size.width));
    newY = Math.max(0, Math.min(newY, screenHeight - windowState.size.height));

    setWindowState(prevState => ({
      ...prevState,
      position: { x: newX, y: newY },
    }));
  }, [isDragging, offset, windowState.size.width, windowState.size.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Resizing logic (remains the same)
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handleName: string) => {
    e.preventDefault(); // Prevent default drag behavior
    e.stopPropagation(); // Stop propagation to avoid triggering drag
    setIsResizing(true);
    setResizeHandle(handleName);
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    // Bring to front on click
    setWindowState(prevState => ({ ...prevState, zIndex: prevState.zIndex + 1 }));
  }, []);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeHandle || !windowRef.current) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const rect = windowRef.current.getBoundingClientRect();

    let newWidth = windowState.size.width;
    let newHeight = windowState.size.height;
    let newX = windowState.position.x;
    let newY = windowState.position.y;

    // Minimum sizes
    const minWidth = 300;
    const minHeight = 200;

    // Maximum sizes (90% of viewport)
    const maxWidth = screenWidth * 0.9;
    const maxHeight = screenHeight * 0.9;

    // Aspect ratio preservation (optional, requires shift key)
    const maintainAspectRatio = e.shiftKey;
    let aspectRatio = 1;
    if (maintainAspectRatio) {
      aspectRatio = windowState.size.width / windowState.size.height;
    }

    switch (resizeHandle) {
      case 'top-left':
        newX = e.clientX - offset.x;
        newY = e.clientY - offset.y;
        newWidth = rect.right - e.clientX + offset.x;
        newHeight = rect.bottom - e.clientY + offset.y;
        break;
      case 'top-right':
        newX = rect.left;
        newY = e.clientY - offset.y;
        newWidth = e.clientX - rect.left - offset.x;
        newHeight = rect.bottom - e.clientY + offset.y;
        break;
      case 'bottom-left':
        newX = e.clientX - offset.x;
        newY = rect.top;
        newWidth = rect.right - e.clientX + offset.x;
        newHeight = e.clientY - rect.top - offset.y;
        break;
      case 'bottom-right':
        newX = rect.left;
        newY = rect.top;
        newWidth = e.clientX - rect.left - offset.x;
        newHeight = e.clientY - rect.top - offset.y;
        break;
      case 'top':
        newY = e.clientY - offset.y;
        newHeight = rect.bottom - e.clientY + offset.y;
        break;
      case 'bottom':
        newY = rect.top;
        newHeight = e.clientY - rect.top - offset.y;
        break;
      case 'left':
        newX = e.clientX - offset.x;
        newWidth = rect.right - e.clientX + offset.x;
        break;
      case 'right':
        newX = rect.left;
        newWidth = e.clientX - rect.left - offset.x;
        break;
      default:
        break;
    }

    // Apply aspect ratio if maintained
    if (maintainAspectRatio) {
      if (resizeHandle.includes('width')) { // If resizing width
        newHeight = newWidth / aspectRatio;
      } else { // If resizing height
        newWidth = newHeight * aspectRatio;
      }
    }

    // Apply constraints and update state
    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

    // Adjust position if width/height changes affect it
    if (resizeHandle.includes('left')) {
      newX = rect.right - newWidth;
    }
    if (resizeHandle.includes('top')) {
      newY = rect.bottom - newHeight;
    }

    // Ensure position stays within bounds after resize
    newX = Math.max(0, Math.min(newX, screenWidth - newWidth));
    newY = Math.max(0, Math.min(newY, screenHeight - newHeight));

    setWindowState(prevState => ({
      ...prevState,
      position: { x: newX, y: newY },
      size: { width: newWidth, height: newHeight },
    }));
  }, [isResizing, resizeHandle, offset, windowState.size, windowState.position]);

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Add and remove event listeners (remains the same)
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
    } else {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing, resizeHandle, handleResizeMouseMove, handleResizeMouseUp]);

  // Window controls handlers (remains the same)
  const handleMinimize = () => {
    setWindowState(prevState => ({ ...prevState, isMinimized: !prevState.isMinimized }));
  };

  const handleMaximize = () => {
    setWindowState(prevState => ({ ...prevState, isMaximized: !prevState.isMaximized }));
    // Logic to handle actual maximization (e.g., setting size to 90% viewport)
    // For now, just toggling the state
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    // Optionally, remove the window from the DOM or hide it
    console.log("Close button clicked");
  };

  // Render package cards
  const renderPackageCard = (pkg: Package) => ( // Renamed function and parameter
    <IonCol sizeXs="12" sizeMd="6" sizeLg="4" key={pkg.id}>
      <div className="package-card"> {/* Changed class name */}
        <div className="card-header">
          {pkg.icon_url && ( // Check if icon_url exists
            <IonImg src={pkg.icon_url} alt="Package Icon" className="card-package-icon" /> // Changed alt text and class name
          )}
        </div>
        <div className="card-body">
          <p><strong>Description:</strong> {pkg.description || 'No description available'}</p> {/* Display description */}
          <p><strong>Location:</strong> {pkg.location || 'N/A'}</p> {/* Display location */}
          <p><strong>Price:</strong> {formatCurrency(pkg.price)}</p> {/* Display price */}
          {/* Render amenity icons if available - assuming 'ammenities' is an object with amenity details or icon URLs */}
          {pkg.ammenities && typeof pkg.ammenities === 'object' && Object.keys(pkg.ammenities).length > 0 && (
            <div className="amenity-icons">
              {/* This part needs adjustment based on the actual structure of pkg.ammenities */}
              {/* For now, assuming it's an object where values are URLs */}
              {Object.entries(pkg.ammenities).map(([key, value]) => (
                // Assuming value is a URL string. Adjust if value is an object itself.
                <IonImg key={key} src={String(value)} alt={`Amenity: ${key}`} className="amenity-icon" />
              ))}
            </div>
          )}
        </div>
      </div>
    </IonCol>
  );

  // Render loading state
  const renderLoadingState = () => (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <IonText>Loading packages...</IonText> {/* Updated text */}
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="error-overlay">
      <IonText>{error}</IonText>
      <IonButton onClick={() => { /* Retry logic */ }}>Retry</IonButton>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="empty-overlay">
      <IonText>No packages found.</IonText> {/* Updated text */}
    </div>
  );

  // Apply styles based on state (remains the same)
  const windowStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${windowState.position.x}px`,
    top: `${windowState.position.y}px`,
    width: windowState.isMaximized ? '90vw' : `${windowState.size.width}px`,
    height: windowState.isMaximized ? '90vh' : `${windowState.size.height}px`,
    zIndex: windowState.zIndex,
    transform: windowState.isMaximized ? 'translate(-45vw, -45vh)' : 'none', // Center maximized window
    // Add transition for smooth resizing/dragging if needed
    // transition: 'all 0.2s ease-out',
  };

  const contentStyle: React.CSSProperties = {
    height: windowState.isMaximized ? 'calc(90vh - var(--header-height) - var(--footer-height, 0px))' : `calc(${windowState.size.height}px - var(--header-height) - var(--footer-height, 0px))`,
  };

  // Define resize handles (remains the same)
  const resizeHandles = [
    'top-left', 'top-right', 'bottom-left', 'bottom-right',
    'top', 'bottom', 'left', 'right'
  ];

  return (
    <div
      ref={windowRef}
      className={`resizable-window ${windowState.isMinimized ? 'minimized' : ''} ${windowState.isMaximized ? 'maximized' : ''}`}
      style={windowStyle}
      onMouseDown={handleMouseDown} // For dragging
    >
      {/* Window Header */}
      <div ref={headerRef} className="window-header">
        <IonText className="window-title">{title}</IonText>
        <div className="window-controls">
          <IonButton fill="clear" className="control-button minimize" onClick={handleMinimize}>
            <IonIcon icon={Icons.noise} slot="icon-only" /> {/* Placeholder icon */}
          </IonButton>
          <IonButton fill="clear" className="control-button maximize" onClick={handleMaximize}>
            <IonIcon icon={Icons.noise} slot="icon-only" /> {/* Placeholder icon */}
          </IonButton>
          <IonButton fill="clear" className="control-button close" onClick={handleClose}>
            <IonIcon icon={Icons.noise} slot="icon-only" /> {/* Placeholder icon */}
          </IonButton>
        </div>
      </div>

      {/* Resize Handles */}
      {!windowState.isMaximized && resizeHandles.map(handle => (
        <div
          key={handle}
          ref={(el: HTMLDivElement | null) => { resizeHandlesRef.current[handle] = el; }}
          className={`resize-handle ${handle}`}
          onMouseDown={(e) => handleResizeMouseDown(e, handle)}
        />
      ))}

      {/* Window Content */}
      {!windowState.isMinimized && (
        <IonContent className="window-content" style={contentStyle}>
          {isLoading && renderLoadingState()}
          {error && renderErrorState()}
          {!isLoading && !error && packages.length === 0 && renderEmptyState()} {/* Changed from bookings to packages */}
          {!isLoading && !error && packages.length > 0 && (
            <IonGrid>
              <IonRow>
                {packages.map(renderPackageCard)} {/* Changed from bookings to packages and renderBookingCard to renderPackageCard */}
              </IonRow>
            </IonGrid>
          )}
        </IonContent>
      )}
    </div>
  );
};

export default ResizableWindow;
