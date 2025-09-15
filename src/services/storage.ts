import supabase from "../supabaseConfig";

const DEFAULT_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'rental-properties';

class StorageService {
  private bucketName: string;

  constructor(bucketName: string = DEFAULT_BUCKET) {
    this.bucketName = bucketName;
  }

  /**
   * Get public URL for an asset in Supabase storage.
   * @param path The path to the file in the bucket.
   * @returns The public URL of the file.
   */
  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Get signed URL for private assets (expires after specified time)
   * @param path The path to the file in the bucket.
   * @param expiresIn The validity duration of the URL in seconds.
   * @returns The signed URL for the file.
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(path, expiresIn);
    
    if (error) {
      console.error('Error creating signed URL:', error);
      throw error;
    }
    
    if (!data) {
        throw new Error("Could not create signed URL.");
    }

    return data.signedUrl;
  }

  /**
   * Download file as blob (useful for private files)
   * @param path The path to the file in the bucket.
   * @returns A promise that resolves with the file content as a Blob.
   */
  async downloadFile(path: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .download(path);
    
    if (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
    
    if (!data) {
        throw new Error("Could not download file.");
    }
    
    return data;
  }

  /**
   * Upload file
   * @param path The path to the file in the bucket.
   * @param file The file to upload.
   * @returns The public URL of the uploaded file.
   */
  async uploadFile(path: string, file: File): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
    
    if (data) {
        return this.getPublicUrl(data.path);
    }
    
    throw new Error("File upload failed, no path returned.");
  }
}

export const storageService = new StorageService();