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
import { Booking, WindowState, WindowPosition, WindowSize } from '../interfaces/Booking'; // Import interfaces
import { Icons } from '../pages/BookPackage'; // Import Icons from BookPackage
import supabase from '../supabaseConfig';

// Actual data fetching function using Supabase
const fetchBookings = async (): Promise<Booking[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*'); // Select all columns

    if (error) {
      console.error("Supabase error fetching bookings:", error);
      throw error;
    }

    // Supabase typically returns JSONB fields as parsed objects and dates as strings.
    // We ensure dates are in a consistent string format for our helpers.
    const formattedData = data?.map((booking: any) => ({
      ...booking,
      // Ensure dates are strings in 'YYYY-MM-DD' format if they come as Date objects or different string formats
      check_in_date: booking.check_in_date ? new Date(booking.check_in_date).toISOString().split('T')[0] : '',
      check_out_date: booking.check_out_date ? new Date(booking.check_out_date).toISOString().split('T')[0] : '',
      created_at: booking.created_at ? new Date(booking.created_at).toISOString() : '',
      updated_at: booking.updated_at ? new Date(booking.updated_at).toISOString() : '',
      // booking_status and Icon_Url are JSONB, Supabase should parse them correctly into JS objects.
      // No explicit mapping needed here if Supabase returns them as expected.
    })) || [];

    return formattedData;
  } catch (err: any) {
    console.error("Failed to fetch bookings:", err);
    // Set error state here if this function is called within a component that manages state
    // For this standalone function, we'll just log and re-throw or return empty
    // If this were inside a component's useEffect, we'd use setError from useState
    // For now, let's assume the component's useEffect handles error state.
    throw err; // Re-throw to be caught by the component's try-catch
  }
};

// Helper to format dates
const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString; // Return original string if parsing fails
  }
};

// Helper to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // Assuming USD, adjust if needed
  }).format(amount);
};

// Helper for status badges
const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'confirmed': return 'status-confirmed';
    case 'pending': return 'status-pending';
    case 'cancelled': return 'status-cancelled';
    case 'completed': return 'status-completed';
    case 'paid': return 'payment-paid';
    case 'unpaid': return 'payment-unpaid';
    case 'overdue': return 'payment-overdue';
    case 'refunded': return 'payment-refunded';
    default: return 'status-default';
  }
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
  title = "Bookings",
  onClose,
}) => {
  const [windowState, setWindowState] = useState<WindowState>({
    position: initialPosition,
    size: initialSize,
    isMinimized: false,
    isMaximized: false,
    zIndex: 1, // Initial z-index
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
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
        const fetchedBookings = await fetchBookings();
        setBookings(fetchedBookings);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
        setError("Failed to load bookings. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Dragging logic
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

  // Resizing logic
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

  // Add and remove event listeners
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

  // Window controls handlers
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

  // Render booking cards
  const renderBookingCard = (booking: Booking) => (
    <IonCol sizeXs="12" sizeMd="6" sizeLg="4" key={booking.id}>
      <div className="booking-card">
        <div className="card-header">
          <IonText>Booking #{booking.id}</IonText>
          {booking.Icon_Url?.property_icon && (
            <IonImg src={booking.Icon_Url.property_icon} alt="Property Icon" className="card-property-icon" />
          )}
        </div>
        <div className="card-body">
          <p><strong>Dates:</strong> {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}</p>
          <p><strong>Guests:</strong> {booking.total_guests}</p>
          <p><strong>Price:</strong> {formatCurrency(booking.total_price)}</p>
          <div className="status-badges">
            <span className={`status-badge ${getStatusBadgeClass(booking.booking_status.current_status)}`} >
              {booking.booking_status.current_status}
            </span>
            <span className={`status-badge ${getStatusBadgeClass(booking.booking_status.payment_status)}`} >
              {booking.booking_status.payment_status}
            </span>
          </div>
          {/* Render amenity icons if available */}
          {booking.Icon_Url?.amenity_icons && booking.Icon_Url.amenity_icons.length > 0 && (
            <div className="amenity-icons">
              {booking.Icon_Url.amenity_icons.map((iconUrl, index) => (
                <IonImg key={index} src={iconUrl} alt={`Amenity Icon ${index + 1}`} className="amenity-icon" />
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
      <IonText>Loading bookings...</IonText>
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
      <IonText>No bookings found.</IonText>
    </div>
  );

  // Apply styles based on state
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

  // Define resize handles
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
          {!isLoading && !error && bookings.length === 0 && renderEmptyState()}
          {!isLoading && !error && bookings.length > 0 && (
            <IonGrid>
              <IonRow>
                {bookings.map(renderBookingCard)}
              </IonRow>
            </IonGrid>
          )}
        </IonContent>
      )}
    </div>
  );
};

export default ResizableWindow;
