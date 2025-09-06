/**
 * Utility functions for handling images in the chat application
 */

/**
 * Converts a File object to a base64 data URL
 * @param file - The file to convert
 * @returns Promise that resolves to a base64 data URL string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Validates if a file is an image
 * @param file - The file to validate
 * @returns boolean indicating if the file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Gets the maximum allowed image size in bytes (default: 10MB)
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates image file size
 * @param file - The file to validate
 * @param maxSize - Maximum allowed size in bytes (default: MAX_IMAGE_SIZE)
 * @returns boolean indicating if the file size is valid
 */
export const isValidImageSize = (file: File, maxSize: number = MAX_IMAGE_SIZE): boolean => {
  return file.size <= maxSize;
};

/**
 * Compresses an image file to reduce its size while maintaining quality
 * @param file - The image file to compress
 * @param quality - Compression quality (0-1, default: 0.8)
 * @param maxWidth - Maximum width (default: 1920)
 * @param maxHeight - Maximum height (default: 1080)
 * @returns Promise that resolves to a compressed base64 data URL
 */
export const compressImage = (
  file: File, 
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
