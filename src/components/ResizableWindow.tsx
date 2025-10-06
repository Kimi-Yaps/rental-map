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
import { Package } from "../interfaces/Package";
import { WindowState, WindowPosition, WindowSize } from "../interfaces/Booking";
import { Icons } from "../pages/BookPackage";
import supabase from "../supabaseConfig";
// Tiptap imports
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { ListItem, OrderedList, BulletList } from '@tiptap/extension-list-item';
import { Bold, Italic, Strike, Underline, Code, Paragraph, Heading, Blockquote, HardBreak, HorizontalRule, BulletList as BulletListExtension, OrderedList as OrderedListExtension, CodeBlock, Blockquote as BlockquoteExtension, History } from '@tiptap/extension-kit'; // Importing specific extensions
import { useDebounce } from "../hooks/useDebounce";

// Helper to format currency
const formatCurrency = (amount: number | null): string => {
  if (amount === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface ResizableWindowProps {
  initialPosition?: WindowPosition;
  initialSize?: WindowSize;
  title?: string;
  onClose?: () => void;
  selectedPackage: Package | null;
  onSavePackage: (updatedPackage: Package) => void;
}

const ResizableWindow: React.FC<ResizableWindowProps> = ({
  initialPosition = { x: 0, y: 0 },
  initialSize = { width: 600, height: 400 },
  title = "Package Details",
  onClose,
  selectedPackage,
  onSavePackage,
}) => {
  const [windowState, setWindowState] = useState<WindowState>({
    position: initialPosition,
    size: initialSize,
    isMinimized: false,
    isMaximized: false,
    zIndex: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editedPrice, setEditedPrice] = useState<number | null>(null);
  const [editedLocation, setEditedLocation] = useState<string>("");
  const [editedNumberOfTenant, setEditedNumberOfTenant] = useState<number | null>(null);
  const [editedAmenities, setEditedAmenities] = useState<Record<string, any> | null>(null);
  const [currentImageUrls, setCurrentImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  // State for Tiptap editor content
  const [editorContent, setEditorContent] = useState("");
  const debouncedDescription = useDebounce(editorContent, 1000);

  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeHandlesRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const resizeStart = useRef<{ mouseX: number; mouseY: number; rect: DOMRect } | null>(null);

  // Tiptap extensions
  const extensions = [
    StarterKit.configure({
      // Configure extensions if needed, e.g., disable history for simplicity if not needed
      history: false,
    }),
    TextStyle,
    // Ensure list extensions are correctly configured if needed
    BulletList.configure({ HTMLAttributes: { class: 'bullet-list' } }),
    OrderedList.configure({ HTMLAttributes: { class: 'ordered-list' } }),
    ListItem.configure({ HTMLAttributes: { class: 'list-item' } }),
    // Add other extensions as required
  ];

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions,
    content: editorContent, // Use the state for content
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML()); // Update state when content changes
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content', // Add a class for styling
      },
    },
  });

  // Initialize state from selectedPackage when it changes
  useEffect(() => {
    if (selectedPackage) {
      setEditorContent(selectedPackage.description || ""); // Initialize Tiptap content
      setEditedPrice(selectedPackage.price);
      setEditedLocation(selectedPackage.location || "");
      setEditedNumberOfTenant(selectedPackage.numberOfTenant);
      setEditedAmenities(selectedPackage.ammenities || {});
      setCurrentImageUrls(selectedPackage.image_urls || []);
      setIsEditing(false);
    }
  }, [selectedPackage]);

  const autoSaveChanges = async (description: string) => {
    if (!selectedPackage || !editor) return; // Ensure editor is available

    const updatedPackageData: Partial<Package> = {
      description: description,
      image_urls: currentImageUrls,
    };

    const { error } = await supabase
      .from("Packages")
      .update(updatedPackageData)
      .eq("id", selectedPackage.id);

    if (error) {
      console.error("Error auto-saving package:", error);
    } else {
      console.log("Package auto-saved successfully!");
      if (onSavePackage) {
        onSavePackage({ ...selectedPackage, ...updatedPackageData } as Package);
      }
    }
  };

  useEffect(() => {
    if (isEditing && selectedPackage && debouncedDescription !== selectedPackage.description) {
      autoSaveChanges(debouncedDescription);
    }
  }, [debouncedDescription, isEditing, selectedPackage]);

  // Centering the window on mount
  useEffect(() => {
    if (!windowRef.current) return;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const currentWidth = initialSize.width;
    const currentHeight = initialSize.height;

    const centeredPosition = {
      x: Math.max(0, (screenWidth - currentWidth) / 2),
      y: Math.max(0, (screenHeight - currentHeight) / 2),
    };

    setWindowState((prevState) => ({
      ...prevState,
      position: centeredPosition,
      size: {
        width: Math.min(initialSize.width, screenWidth * 0.9),
        height: Math.min(initialSize.height, screenHeight * 0.9),
      },
    }));
  }, [initialSize.width, initialSize.height]);

  // Dragging logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!headerRef.current || !windowRef.current) return;
    if (headerRef.current.contains(e.target as Node)) {
      setIsDragging(true);
      const rect = windowRef.current.getBoundingClientRect();
      setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setWindowState((prevState) => ({ ...prevState, zIndex: prevState.zIndex + 1 }));
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !windowRef.current) return;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    let newX = e.clientX - offset.x;
    let newY = e.clientY - offset.y;
    newX = Math.max(0, Math.min(newX, screenWidth - windowState.size.width));
    newY = Math.max(0, Math.min(newY, screenHeight - windowState.size.height));
    setWindowState((prevState) => ({ ...prevState, position: { x: newX, y: newY } }));
  }, [isDragging, offset, windowState.size.width, windowState.size.height]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // Resizing logic
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handleName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!windowRef.current) return;
    const rect = windowRef.current.getBoundingClientRect();
    setIsResizing(true);
    setResizeHandle(handleName);
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, rect };
  }, []);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeHandle || !resizeStart.current) return;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const dx = e.clientX - resizeStart.current.mouseX;
    const dy = e.clientY - resizeStart.current.mouseY;
    let { width, height, left, top } = resizeStart.current.rect;
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

    setWindowState((prev) => ({ ...prev, position: { x: newX, y: newY }, size: { width: newWidth, height: newHeight } }));
  }, [isResizing, resizeHandle]);

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

  const handleMinimize = () => setWindowState((prevState) => ({ ...prevState, isMinimized: !prevState.isMinimized }));
  const handleMaximize = () => setWindowState((prevState) => ({ ...prevState, isMaximized: !prevState.isMaximized }));
  const handleClose = () => { if (onClose) onClose(); console.log("Close button clicked"); };

  const handleEditClick = () => setIsEditing(true);

  const handleSaveClick = async () => {
    if (!selectedPackage || !editor) return; // Ensure editor is available
    const updatedPackageData: Partial<Package> = {
      description: editor.getHTML(), // Get HTML from Tiptap editor
      image_urls: currentImageUrls,
    };
    const { error } = await supabase.from("Packages").update(updatedPackageData).eq("id", selectedPackage.id);
    if (error) {
      console.error("Error saving package:", error);
    } else {
      console.log("Package saved successfully!");
      setIsEditing(false);
      if (onSavePackage) {
        onSavePackage({ ...selectedPackage, ...updatedPackageData } as Package);
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPackage || !event.target.files || event.target.files.length === 0) return;
    setUploading(true); setUploadError(null);
    const files = Array.from(event.target.files);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `public/packages/${selectedPackage.id}/${fileName}`;
        const { data, error } = await supabase.storage.from("imgvideo-bucket1").upload(filePath, file);
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from("imgvideo-bucket1").getPublicUrl(filePath);
        if (publicUrlData?.publicUrl) uploadedUrls.push(publicUrlData.publicUrl);
      }
      setCurrentImageUrls((prevUrls) => [...prevUrls, ...uploadedUrls]);
      console.log("Images uploaded successfully:", uploadedUrls);
    } catch (error: any) {
      console.error("Error uploading images:", error);
      setUploadError(`Failed to upload images: ${error.message}`);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const renderPackageContent = () => {
    if (!selectedPackage) return null;
    return (
      <div className="package-details-content">
        <div className="package-header">
          {selectedPackage.icon_url && <IonImg src={selectedPackage.icon_url} alt="Package Icon" className="card-package-icon" />}
          <IonText className="window-title">{title}</IonText>
          <IonButton onClick={handleEditClick} disabled={isEditing}>Edit</IonButton>
          <IonButton onClick={handleSaveClick} disabled={!isEditing}>Save</IonButton>
        </div>
        <div className="package-body">
          {!isEditing ? (
            <>
              <p><strong>Description:</strong></p>
              <div dangerouslySetInnerHTML={{ __html: currentDescription }} />
              <p><strong>Price:</strong> {formatCurrency(selectedPackage.price)}</p>
              <p><strong>Location:</strong> {selectedPackage.location || "N/A"}</p>
              <p><strong>Number of Tenants:</strong> {selectedPackage.numberOfTenant || "N/A"}</p>
              {selectedPackage.ammenities && typeof selectedPackage.ammenities === "object" && Object.keys(selectedPackage.ammenities).length > 0 && (
                <div className="amenity-icons">
                  {Object.entries(selectedPackage.ammenities).map(([key, value]) => (
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
    left: `${windowState.position.x}px`,
    top: `${windowState.position.y}px`,
    width: windowState.isMaximized ? "90vw" : `${windowState.size.width}px`,
    height: windowState.isMaximized ? "90vh" : `${windowState.size.height}px`,
    zIndex: windowState.zIndex,
    transform: windowState.isMaximized ? "translate(-45vw, -45vh)" : "none",
  };

  const contentStyle: React.CSSProperties = {
    height: windowState.isMaximized
      ? "calc(90vh - var(--header-height) - var(--footer-height, 0px))"
      : `calc(${windowState.size.height}px - var(--header-height) - var(--footer-height, 0px))`,
  };

  const resizeHandles = ["top-left", "top-
```
The file content was truncated. I need to re-read the file to get the complete content before attempting to modify it.
The user's instruction is to replace `react-quill` with `tiptap`.
I have already uninstalled `react-quill` and installed Tiptap dependencies.
The next step is to refactor `ResizableWindow.tsx`.

I need to read the file again to get the full content, then apply the Tiptap refactoring.
The previous `read_file` operation was interrupted.

**Plan:**
1.  Read the full content of `src/components/ResizableWindow.tsx` again.
2.  Modify the file to replace `ReactQuill` with Tiptap components and logic.
3.  Update `task_progress`.

**Refactoring steps:**
- Remove `react-quill` imports.
- Add Tiptap imports.
- Define Tiptap extensions.
- Initialize Tiptap editor using `useEditor`.
- Replace `ReactQuill` JSX with `EditorContent`.
- Update state management for `currentDescription` to use Tiptap's editor state.
- Update `autoSaveChanges` to use `editor.getHTML()`.

I will use `write_to_file` to apply these changes.
The `task_progress` will be updated.
- [x] Modify `BookPackage.tsx` to auto-save icon positions with a delay.
- [x] Fix ESLint error for `Contact` property type.
- [x] Implement tab management state and counter.
- [x] Search for `react-quill` usage in project files.
- [x] Investigate `react-quill` errors and plan a solution.
- [x] Research `react-quill` compatibility and plan for Tiptap replacement.
- [x] Uninstall `react-quill`.
- [x] Install Tiptap dependencies.
- [ ] Refactor `ResizableWindow.tsx` to use Tiptap.
- [ ] Research OOP theory.
- [ ] Analyze which parts can be applied.
- [ ] Compare methods with 2 times.
- [ ] Apply the best method in the last decision.

I will start by reading the file content again to ensure I have the latest version before making modifications.
</thinking>
<read_file>
<path>src/components/ResizableWindow.tsx</path>
<task_progress>
- [x] Modify `BookPackage.tsx` to auto-save icon positions with a delay.
- [x] Fix ESLint error for `Contact` property type.
- [x] Implement tab management state and counter.
- [x] Search for `react-quill` usage in project files.
- [x] Investigate `react-quill` errors and plan a solution.
- [x] Research `react-quill` compatibility and plan for Tiptap replacement.
- [x] Uninstall `react-quill`.
- [x] Install Tiptap dependencies.
- [ ] Refactor `ResizableWindow.tsx` to use Tiptap.
- [ ] Research OOP theory.
- [ ] Analyze which parts can be applied.
- [ ] Compare methods with 2 times.
- [ ] Apply the best method in the last decision.
</task_progress>
</read_file>
