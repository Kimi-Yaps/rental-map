import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonImg,
  IonText,
  IonInput,
  IonLabel,
} from "@ionic/react";
import "./ResizableWindow.scss";
import { Package, OpenWindowState } from "../interfaces/Booking";
import { Icons } from "../pages/BookPackage";
import supabase from "../supabaseConfig";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useDebounce } from "../hooks/useDebounce";

const formatCurrency = (amount: number | null): string => {
  if (amount === null) return "N/A";
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  }).format(amount);
};

interface ResizableWindowProps {
  windowState: OpenWindowState;
  onClose: () => void;
  onSavePackage: (updatedPackage: Package) => void;
  onFocus: () => void;
  onStateChange: (newState: Partial<OpenWindowState>) => void;
}

const ResizableWindow: React.FC<ResizableWindowProps> = ({
  windowState,
  onClose,
  onSavePackage,
  onFocus,
  onStateChange,
}) => {
  const { pkg, position, size, isMinimized, isMaximized, zIndex } = windowState;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editedTitle, setEditedTitle] = useState<string>("");
  const [editedPrice, setEditedPrice] = useState<number | null>(null);
  const [editedLocation, setEditedLocation] = useState<string>("");
  const [editedNumberOfTenant, setEditedNumberOfTenant] = useState<number | null>(null);
  const [editedAmenities, setEditedAmenities] = useState<Record<string, any> | null>(null);
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const debouncedDescription = useDebounce(editorContent, 1000);

  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const resizeStart = useRef<{ mouseX: number; mouseY: number; rect: DOMRect } | null>(null);

  const extensions = [StarterKit];

  const editor = useEditor({
    extensions,
    content: editorContent,
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
      },
    },
  });

  useEffect(() => {
    if (pkg) {
      const newContent = pkg.description || "";
      setEditorContent(newContent);
      if (editor && editor.commands) {
          editor.commands.setContent(newContent);
      }
      setEditedTitle(pkg.Title || "");
      setEditedPrice(pkg.price);
      setEditedLocation(pkg.location || "");
      setEditedNumberOfTenant(pkg.numberOfTenant);
      setEditedAmenities(pkg.ammenities || {});
      setCurrentImageUrls(pkg.image_urls || []);
      setIsEditing(false);
    }
  }, [pkg, editor]);

  const autoSaveChanges = async (description: string) => {
    if (!pkg || !editor) return;

      const updatedPackageData: Partial<Package> = {
        Title: editedTitle,
        description: description,
        image_urls: currentImageUrls,
      };

    const { error } = await supabase
      .from("Packages")
      .update(updatedPackageData)
      .eq("id", pkg.id);

    if (error) {
      console.error("Error auto-saving package:", error);
    } else {
      console.log("Package auto-saved successfully!");
      if (onSavePackage) {
        onSavePackage({ ...pkg, ...updatedPackageData } as Package);
      }
    }
  };

  useEffect(() => {
    if (isEditing && pkg && debouncedDescription !== pkg.description) {
      autoSaveChanges(debouncedDescription);
    }
  }, [debouncedDescription, isEditing, pkg]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    onFocus();
    if (!headerRef.current || !windowRef.current) return;
    if (headerRef.current.contains(e.target as Node)) {
      setIsDragging(true);
      const rect = windowRef.current.getBoundingClientRect();
      setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, [onFocus]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !windowRef.current) return;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    let newX = e.clientX - offset.x;
    let newY = e.clientY - offset.y;
    newX = Math.max(0, Math.min(newX, screenWidth - size.width));
    newY = Math.max(0, Math.min(newY, screenHeight - size.height));
    onStateChange({ position: { x: newX, y: newY } });
  }, [isDragging, offset, size.width, size.height, onStateChange]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handleName: string) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    if (!windowRef.current) return;
    const rect = windowRef.current.getBoundingClientRect();
    setIsResizing(true);
    setResizeHandle(handleName);
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, rect };
  }, [onFocus]);

    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeHandle || !resizeStart.current) return;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const dx = e.clientX - resizeStart.current.mouseX;
    const dy = e.clientY - resizeStart.current.mouseY;
    const { width, height, left, top } = resizeStart.current.rect;
    let newWidth = width;
    let newHeight = height;
    let newX = left - window.scrollX;
    let newY = top - window.scrollY;

    switch (resizeHandle) {
      case "right": newWidth += dx; break;
      case "bottom": newHeight += dy; break;
      case "left": newWidth -= dx; newX += dx; break;
      case "top": newHeight -= dy; newY += dy; break;
      case "top-left": newWidth -= dx; newX += dx; newHeight -= dy; newY += dy; break;
      case "top-right": newWidth += dx; newHeight -= dy; newY += dy; break;
      case "bottom-left": newWidth -= dx; newX += dx; newHeight += dy; break;
      case "bottom-right": newWidth += dx; newHeight += dy; break;
    }

    const minWidth = 300; const minHeight = 200;
    const maxWidth = screenWidth * 0.9; const maxHeight = screenHeight * 0.9;

    newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
    newX = Math.max(0, Math.min(newX, screenWidth - newWidth));
    newY = Math.max(0, Math.min(newY, screenHeight - newHeight));

    onStateChange({ position: { x: newX, y: newY }, size: { width: newWidth, height: newHeight } });
  }, [isResizing, resizeHandle, onStateChange]);

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
    resizeStart.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMouseMove);
      document.addEventListener("mouseup", handleResizeMouseUp);
    } else {
      document.removeEventListener("mousemove", handleResizeMouseMove);
      document.removeEventListener("mouseup", handleResizeMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleResizeMouseMove);
      document.removeEventListener("mouseup", handleResizeMouseUp);
    };
  }, [isResizing, resizeHandle, handleResizeMouseMove, handleResizeMouseUp]);

  const handleMinimize = () => onStateChange({ isMinimized: !isMinimized });
  const handleMaximize = () => onStateChange({ isMaximized: !isMaximized });
  const handleClose = () => onClose();

  const handleEditClick = () => setIsEditing(true);

  const handleSaveClick = async () => {
    if (!pkg || !editor) return;
      const updatedPackageData: Partial<Package> = {
        Title: editedTitle,
        description: editor.getHTML(),
        image_urls: currentImageUrls,
      };
    const { error } = await supabase.from("Packages").update(updatedPackageData).eq("id", pkg.id);
    if (error) {
      console.error("Error saving package:", error);
    } else {
      console.log("Package saved successfully!");
      setIsEditing(false);
      if (onSavePackage) {
        onSavePackage({ ...pkg, ...updatedPackageData } as Package);
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!pkg || !event.target.files || event.target.files.length === 0) return;
    setUploading(true); setUploadError(null);
    const files = Array.from(event.target.files);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `public/packages/${pkg.id}/${fileName}`;
        const { error } = await supabase.storage.from("imgvideo-bucket1").upload(filePath, file);
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from("imgvideo-bucket1").getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) uploadedUrls.push(publicUrlData.publicUrl);
      }
      setCurrentImageUrls((prevUrls) => [...prevUrls, ...uploadedUrls]);
      console.log("Images uploaded successfully:", uploadedUrls);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error uploading images:", error.message);
        setUploadError(`Failed to upload images: ${error.message}`);
      } else {
        console.error("An unknown error occurred during image upload:", error);
        setUploadError("An unknown error occurred during image upload.");
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const renderPackageContent = () => {
    if (!pkg) return null;
    return (
      <div className="package-details-content">
        <div className="package-header">
          {pkg.icon_url && <IonImg src={pkg.icon_url} alt="Package Icon" className="card-package-icon" />}
          <IonText className="package-title">{pkg.Title}</IonText>
          <IonButton onClick={handleEditClick} disabled={isEditing}>Edit</IonButton>
          <IonButton onClick={handleSaveClick} disabled={!isEditing}>Save</IonButton>
        </div>
        <div className="package-body">
          {!isEditing ? (
            <>
              <p><strong>Description:</strong></p>
              <div dangerouslySetInnerHTML={{ __html: pkg.description || "" }} />
              <IonText className="package-price">{formatCurrency(pkg.price)}</IonText>
              <p><strong>Location:</strong> {pkg.location || "N/A"}</p>
              <p><strong>Number of Tenants:</strong> {pkg.numberOfTenant || "N/A"}</p>
              {pkg.ammenities && typeof pkg.ammenities === "object" && Object.keys(pkg.ammenities).length > 0 && (
                <div className="amenity-icons">
                  {Object.entries(pkg.ammenities).map(([key, value]) => (
                    <IonImg key={key} src={String(value)} alt={`Amenity: ${key}`} className="amenity-icon" />
                  ))}
                </div>
              )}
              {currentImageUrls.length > 0 && (
                <div className="package-images">
                  <h3>Package Images:</h3>
                  <IonGrid>
                    <IonRow>
                      {currentImageUrls.map((url, index) => (
                        <IonCol size="auto" key={index}>
                          <IonImg src={url} alt={`Package Image ${index + 1}`} className="package-image" />
                        </IonCol>
                      ))}
                    </IonRow>
                  </IonGrid>
                </div>
              )}
            </>
          ) : (
            <>
              <IonLabel position="stacked">Description</IonLabel>
              {editor ? (
                <>
                  <EditorContent editor={editor} />
                </>
              ) : (
                <p>Loading editor...</p>
              )}
              <IonGrid>
                <IonRow>
                  <IonCol>
                    <IonLabel position="stacked">Title</IonLabel>
                    <IonInput
                      value={editedTitle}
                      onIonInput={(e) => setEditedTitle(e.detail.value!)}
                    ></IonInput>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol>
                    <IonLabel position="stacked">Price</IonLabel>
                    <IonInput
                      type="number"
                      value={editedPrice ?? ""}
                      onIonInput={(e) => {
                        const value = e.detail.value;
                        setEditedPrice(value ? parseFloat(value) : null);
                      }}
                    ></IonInput>
                  </IonCol>
                  <IonCol>
                    <IonLabel position="stacked">Location</IonLabel>
                    <IonInput
                      value={editedLocation}
                      onIonInput={(e) => setEditedLocation(e.detail.value!)}
                    ></IonInput>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol>
                    <IonLabel position="stacked">Number of Tenants</IonLabel>
                    <IonInput
                      type="number"
                      value={editedNumberOfTenant ?? ""}
                      onIonInput={(e) => {
                        const value = e.detail.value;
                        setEditedNumberOfTenant(value ? parseInt(value, 10) : null);
                      }}
                    ></IonInput>
                  </IonCol>
                </IonRow>
              </IonGrid>
              <div className="image-upload-section">
                <IonLabel position="stacked">Upload New Images/Videos</IonLabel>
                <input
                  type="file"
                  accept="image/jpeg, image/png, video/mp4, video/mov"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && <p>Uploading...</p>}
                {uploadError && <p style={{ color: "red" }}>{uploadError}</p>}
                {currentImageUrls.length > 0 && (
                  <div className="package-images">
                    <h3>Current Package Images:</h3>
                    <IonGrid>
                      <IonRow>
                        {currentImageUrls.map((url, index) => (
                          <IonCol size="auto" key={index}>
                            <IonImg src={url} alt={`Package Image ${index + 1}`} className="package-image" />
                          </IonCol>
                        ))}
                      </IonRow>
                    </IonGrid>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderLoadingState = () => (
    <div className="loading-overlay"><div className="spinner"></div><IonText>Loading package details...</IonText></div>
  );
  const renderErrorState = () => (
    <div className="error-overlay"><IonText>{error}</IonText><IonButton onClick={() => { /* Retry logic */ }}>Retry</IonButton></div>
  );
  const renderEmptyState = () => (
    <div className="empty-overlay"><IonText>No package selected.</IonText></div>
  );

  const windowStyle: React.CSSProperties = {
    position: "absolute",
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: isMaximized ? "90vw" : `${size.width}px`,
    height: isMaximized ? "90vh" : `${size.height}px`,
    zIndex: zIndex,
    transform: isMaximized ? "translate(-45vw, -45vh)" : "none",
  };

  const contentStyle: React.CSSProperties = {
    height: isMaximized
      ? "calc(90vh - var(--header-height) - var(--footer-height, 0px))"
      : `calc(${size.height}px - var(--header-height) - var(--footer-height, 0px))`,
  };

  const resizeHandles = ["top-left", "top-right", "bottom-left", "bottom-right", "top", "bottom", "left", "right"];

  return (
    <div
      ref={windowRef}
      className={`resizable-window ${isMinimized ? "minimized" : ""} ${isMaximized ? "maximized" : ""}`}
      style={windowStyle}
      onMouseDown={handleMouseDown}
    >
      <div ref={headerRef} className="window-header">
        <IonText className="window-title">{pkg.Title}</IonText>
        <div className="window-controls">
          <IonButton fill="clear" className="control-button" onClick={handleMinimize}>
            <IonIcon icon={Icons.mini} />
          </IonButton>
          <IonButton fill="clear" className="control-button" onClick={handleMaximize}>
            <IonIcon icon={Icons.max} />
          </IonButton>
          <IonButton fill="clear" className="control-button close" onClick={handleClose}>
            <IonIcon icon={Icons.destroy} />
          </IonButton>
        </div>
      </div>
      {!isMinimized && (
        <IonContent style={contentStyle} className="window-content">
          {isLoading ? renderLoadingState() : error ? renderErrorState() : pkg ? renderPackageContent() : renderEmptyState()}
        </IonContent>
      )}
      {resizeHandles.map((handle) => (
        <div
          key={handle}
          className={`resize-handle ${handle}`}
          onMouseDown={(e) => handleResizeMouseDown(e, handle)}
        />
      ))}
    </div>
  );
};

export default ResizableWindow;
