// Supabase Storage integration for wine image handling
import { apiFetch } from "./api";

const BUCKET_NAME = "bottle-images";

// Helper to generate unique filename
const generateImageFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `wine_${timestamp}_${randomId}.${extension}`;
};

// Validate image file
const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: "Image must be smaller than 5MB" };
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { isValid: false, error: "Please upload a JPEG, PNG, or WebP image" };
  }

  return { isValid: true };
};

// Validate external URL
export const validateImageUrl = async (url: string): Promise<{ isValid: boolean; error?: string }> => {
  if (!url) return { isValid: false, error: "URL is required" };

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return { isValid: false, error: "Please enter a valid URL" };
  }

  // Check if URL is an image by trying to load it
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ isValid: true });
    img.onerror = () => resolve({ isValid: false, error: "URL does not point to a valid image" });
    img.src = url;
  });
};

// Upload image to Supabase Storage via API
export const uploadWineImage = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Generate unique filename
    const filename = generateImageFilename(file.name);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);
    formData.append('bucket', BUCKET_NAME);

    // Upload via our API endpoint
    const response = await apiFetch('/storage/upload', {
      method: 'POST',
      body: formData,
    });

    // Check if response is ok first
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Failed to upload image';
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.error || errorMessage;
      } catch {
        // If response isn't JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      return {
        success: false,
        error: errorMessage
      };
    }

    // Parse successful response
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      return {
        success: false,
        error: 'Invalid response from upload service'
      };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Upload failed'
      };
    }

    return {
      success: true,
      url: result.publicUrl
    };

  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
};

// Delete image from Supabase Storage via API  
export const deleteWineImage = async (imageUrl: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Extract filename from URL if it's a Supabase Storage URL
    if (!imageUrl.includes(BUCKET_NAME)) {
      // Not a Supabase Storage URL, nothing to delete
      return { success: true };
    }

    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    const response = await apiFetch('/storage/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        bucket: BUCKET_NAME,
        filename 
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.warn('Failed to delete image:', result.error);
      // Don't fail the overall operation if image deletion fails
      return { success: true };
    }

    return { success: true };

  } catch (error) {
    console.warn('Image deletion error:', error);
    // Don't fail the overall operation if image deletion fails  
    return { success: true };
  }
};

// Get public URL for Supabase Storage image
export const getImagePublicUrl = (filename: string): string => {
  // This would be constructed by the backend
  return `/storage/${BUCKET_NAME}/${filename}`;
};

// Check if URL is a Supabase Storage URL
export const isSupabaseStorageUrl = (url: string): boolean => {
  return url.includes(BUCKET_NAME) || url.includes('/storage/');
};
