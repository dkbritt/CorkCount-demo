import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Link, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { uploadWineImage, validateImageUrl, isSupabaseStorageUrl } from "@/lib/supabaseStorage";
import { useToast } from "@/hooks/use-toast";

interface WineImageUploadProps {
  value?: string; // Current image URL
  onChange: (imageUrl: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export function WineImageUpload({ 
  value = "", 
  onChange, 
  onError,
  disabled = false,
  className = ""
}: WineImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value.startsWith('http') ? value : '');
  const [urlValidating, setUrlValidating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(value);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');

  // Compress image to reduce size
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxSize = 800;
        let { width, height } = img;

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Check file size before processing
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        throw new Error('Image file is too large. Please use a file smaller than 10MB.');
      }

      // Compress image to reduce data size
      const compressedDataUrl = await compressImage(file);

      // Check final size
      const finalSizeMB = (compressedDataUrl.length * 0.75) / (1024 * 1024);
      console.log('Compressed image size:', Math.round(finalSizeMB * 100) / 100, 'MB');

      setPreviewUrl(compressedDataUrl);
      onChange(compressedDataUrl);
      toast({
        title: "Image processed",
        description: `Image compressed to ${Math.round(finalSizeMB * 100) / 100}MB. For better performance, consider using external URLs.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown upload error";
      onError?.(errorMessage);
      toast({
        title: "Upload error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle URL validation and setting
  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      onError?.("Please enter a valid URL");
      return;
    }

    setUrlValidating(true);
    try {
      const validation = await validateImageUrl(urlInput.trim());
      
      if (validation.isValid) {
        const finalUrl = urlInput.trim();
        setPreviewUrl(finalUrl);
        onChange(finalUrl);
        toast({
          title: "URL validated",
          description: "Image URL has been validated and saved.",
        });
      } else {
        const error = validation.error || "Invalid image URL";
        onError?.(error);
        toast({
          title: "Invalid URL",
          description: error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to validate URL";
      onError?.(errorMessage);
      toast({
        title: "Validation error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUrlValidating(false);
    }
  };

  // Clear image
  const handleClear = () => {
    setPreviewUrl('');
    setUrlInput('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file picker
  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tab Selection */}
      <div className="flex space-x-1 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'upload'
              ? 'border-federal text-federal bg-federal/5'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'url'
              ? 'border-federal text-federal bg-federal/5'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Link className="w-4 h-4 inline mr-2" />
          External URL
        </button>
      </div>

      {/* File Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-8 h-8 text-federal animate-spin" />
                <p className="text-sm text-gray-600">Uploading image...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={triggerFilePicker}
                    disabled={disabled}
                    className="mb-2"
                  >
                    Choose File
                  </Button>
                  <p className="text-xs text-gray-500">
                    Or drag and drop your image here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPEG, PNG, WebP • Max 5MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* URL Input Tab */}
      {activeTab === 'url' && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/wine-image.jpg"
              disabled={disabled || urlValidating}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-federal/20 focus:border-federal"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUrlSubmit();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleUrlSubmit}
              disabled={disabled || !urlInput.trim() || urlValidating}
              variant="outline"
              size="sm"
            >
              {urlValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Enter a direct link to an image file (JPG, PNG, WebP)
          </p>
        </div>
      )}

      {/* Image Preview */}
      {previewUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Preview:</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
          
          <div className="relative">
            <img
              src={previewUrl}
              alt="Wine preview"
              className="w-32 h-40 object-cover rounded-lg border border-gray-200 shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                onError?.("Failed to load image preview");
              }}
            />
            
            {/* Storage indicator */}
            {isSupabaseStorageUrl(previewUrl) && (
              <div className="absolute top-1 right-1">
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Stored
                </div>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 break-all">
            {previewUrl.length > 60 ? `${previewUrl.substring(0, 60)}...` : previewUrl}
          </p>
        </div>
      )}
    </div>
  );
}
