// Google Drive service using Google Apps Script proxy
class GoogleDriveService {
  constructor() {
    this.proxyUrl = process.env.REACT_APP_GOOGLE_DRIVE_PROXY_URL;
    this.folderName = 'TroopManager-Images';
    
    if (!this.proxyUrl || this.proxyUrl === 'https://script.google.com/macros/s/AKfycby.../exec') {
      console.warn('Google Drive proxy not configured. Please set REACT_APP_GOOGLE_DRIVE_PROXY_URL in your .env file.');
      console.warn('Follow the setup guide in GOOGLE_APPS_SCRIPT_PROXY.md');
    }
  }

  async uploadImage(file, fileName = null) {
    try {
      // Validate configuration
      if (!this.proxyUrl || this.proxyUrl === 'https://script.google.com/macros/s/AKfycby.../exec') {
        throw new Error('Google Drive is not configured. Please contact your administrator to set up the Google Apps Script proxy.');
      }

      // Temporary: Check if the proxy is working
      console.log('Testing Google Apps Script proxy:', this.proxyUrl);

      // Validate file
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image must be smaller than 10MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = fileName 
        ? `${fileName}_${timestamp}.${fileExtension}`
        : `image_${timestamp}.${fileExtension}`;

      console.log('Uploading image to Google Drive via Apps Script proxy...');

      // Convert file to base64
      const fileData = await this.fileToBase64(file);
      
      // Upload via Google Apps Script proxy
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          fileName: uniqueFileName,
          fileData: fileData,
          mimeType: file.type,
          folderName: this.folderName
        })
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      // Handle both JSON and plain text responses
      let result;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/plain')) {
        result = await response.json();
      } else {
        // Handle plain text response (CORS workaround)
        const textResponse = await response.text();
        try {
          result = JSON.parse(textResponse);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', textResponse);
          throw new Error('Invalid response format from Google Drive service');
        }
      }
      
      if (!result.success || result.error) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('Image uploaded successfully to Google Drive:', result.url);
      console.dir(result.url);
      
      // For editor compatibility, convert proxy URL to blob URL
      console.log('Upload result:', result);
      
      try {
        const editorUrl = await this.convertToEditorUrl(result.url);
        console.log('Returning editor-compatible URL:', editorUrl);
        return editorUrl;
      } catch (conversionError) {
        console.warn('Failed to convert to editor URL, returning proxy URL:', conversionError);
        return result.url;
      }

    } catch (error) {
      console.error('Error uploading image to Google Drive:', error);
      console.error('Full error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Temporary fallback: Create a placeholder URL for testing
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        console.warn('Google Apps Script proxy not responding. Using temporary placeholder.');
        console.warn('Please fix the Google Apps Script deployment following the guide in GOOGLE_APPS_SCRIPT_PROXY.md');
        
        // Generate a temporary placeholder URL for testing
        const timestamp = Date.now();
        const placeholderUrl = `https://picsum.photos/400/300?random=${timestamp}`;
        
        console.log('Using placeholder image:', placeholderUrl);
        return placeholderUrl;
      }
      
      if (error.message.includes('not configured')) {
        throw error; // Re-throw configuration errors as-is
      } else if (error.message.includes('413') || error.message.includes('Payload Too Large')) {
        throw new Error('Image file is too large. Please choose a smaller image (under 10MB).');
      } else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        throw new Error('Too many upload requests. Please wait a moment and try again.');
      } else {
        throw new Error(error.message || 'Failed to upload image to Google Drive. Please try again.');
      }
    }
  }

  // Convert file to base64 for uploading
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  }

  async getImageAsBase64(imageUrl) {
    try {
      // Check if this is a proxy URL (our Apps Script URL)
      if (!imageUrl.includes(this.proxyUrl.split('?')[0])) {
        // If it's a direct Google Drive URL, we can't fetch it due to CORS
        console.warn('Direct Google Drive URLs may not work due to CORS. Using proxy URL instead.');
        return null;
      }

      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success || result.error) {
        throw new Error(result.error || 'Failed to get image data');
      }

      // Return the data URL directly from the response
      return result.dataUrl;

    } catch (error) {
      console.error('Error fetching image as base64:', error);
      return null;
    }
  }

  // Helper method to extract file ID from various Google Drive URL formats
  extractFileIdFromUrl(url) {
    // Handle proxy URLs
    if (url.includes(this.proxyUrl.split('?')[0])) {
      const match = url.match(/[?&]fileId=([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    
    // Handle direct Google Drive URLs
    const patterns = [
      /[?&]id=([a-zA-Z0-9_-]+)/,
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /\/uc\?id=([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  // Extract all Google Drive image URLs from HTML content
  extractImageUrlsFromContent(htmlContent) {
    if (!htmlContent) return [];
    
    const imageUrls = [];
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    let match;
    
    while ((match = imgRegex.exec(htmlContent)) !== null) {
      const src = match[1];
      
      // Check if it's a Google Drive URL (either direct or proxy)
      if (src.includes('drive.google.com') || 
          (this.proxyUrl && src.includes(this.proxyUrl.split('?')[0]))) {
        imageUrls.push(src);
      }
    }
    
    return imageUrls;
  }

  // Extract all images from an outing data object (all rich text fields)
  extractAllImagesFromOuting(outingData) {
    if (!outingData) return [];
    
    const richTextFields = [
      outingData.overview,
      outingData.detail,
      outingData.packingList,
      outingData.parking,
      outingData.nearbyHospital,
      outingData.notes,
      outingData.contacts,
      outingData.references
    ];
    
    const allImages = [];
    richTextFields.forEach(content => {
      if (content) {
        const images = this.extractImageUrlsFromContent(content);
        allImages.push(...images);
      }
    });
    
    // Remove duplicates and return unique image URLs
    return [...new Set(allImages)];
  }

  // Extract file IDs from image URLs for batch operations
  extractFileIdsFromImageUrls(imageUrls) {
    const fileIds = [];
    
    imageUrls.forEach(url => {
      const fileId = this.extractFileIdFromUrl(url);
      if (fileId) {
        fileIds.push(fileId);
      }
    });
    
    return [...new Set(fileIds)]; // Remove duplicates
  }

  // Batch delete multiple images by file IDs
  async batchDeleteImages(fileIds) {
    try {
      if (!this.proxyUrl || this.proxyUrl === 'https://script.google.com/macros/s/AKfycby.../exec') {
        console.log('Google Drive proxy not configured, skipping batch image cleanup.');
        return { cleaned: 0, errors: [], message: 'Proxy not configured' };
      }

      if (!fileIds || fileIds.length === 0) {
        console.log('No images to clean up.');
        return { cleaned: 0, errors: [] };
      }

      console.log(`Batch deleting ${fileIds.length} images...`);

      // Send batch delete request to Apps Script
      const response = await fetch(`${this.proxyUrl}?action=batchDelete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`Successfully batch deleted ${result.cleaned} images`);
        return {
          cleaned: result.cleaned,
          errors: result.errors || [],
          message: `Batch deleted ${result.cleaned} images`
        };
      } else {
        throw new Error(result.error || 'Batch delete failed');
      }
    } catch (error) {
      console.error('Error during batch image cleanup:', error);
      return { 
        cleaned: 0, 
        errors: [{ error: error.message }], 
        message: 'Batch delete failed' 
      };
    }
  }

  // Improved cleanup using batch operations
  async cleanupUnusedImagesBatch(initialOutingData, finalOutingData) {
    try {
      if (!this.proxyUrl || this.proxyUrl === 'https://script.google.com/macros/s/AKfycby.../exec') {
        console.log('Google Drive proxy not configured, skipping image cleanup.');
        return { cleaned: 0, errors: [] };
      }

      // Extract all images from initial and final outing data
      const initialImages = this.extractAllImagesFromOuting(initialOutingData);
      const finalImages = this.extractAllImagesFromOuting(finalOutingData);
      
      console.log(`Initial images: ${initialImages.length}, Final images: ${finalImages.length}`);
      
      // Find images that were removed
      const removedImages = initialImages.filter(img => !finalImages.includes(img));
      
      if (removedImages.length === 0) {
        console.log('No images to clean up.');
        return { cleaned: 0, errors: [] };
      }

      console.log(`Found ${removedImages.length} images to clean up:`, removedImages);
      
      // Extract file IDs for batch deletion
      const fileIdsToDelete = this.extractFileIdsFromImageUrls(removedImages);
      
      if (fileIdsToDelete.length === 0) {
        console.log('No valid file IDs found for cleanup.');
        return { cleaned: 0, errors: [] };
      }

      // Perform batch deletion
      return await this.batchDeleteImages(fileIdsToDelete);
      
    } catch (error) {
      console.error('Error during batch image cleanup:', error);
      return { cleaned: 0, errors: [{ error: error.message }] };
    }
  }

  // Legacy method - kept for backward compatibility
  async cleanupUnusedImages(oldContent = '', newContent = '') {
    console.warn('cleanupUnusedImages is deprecated, use cleanupUnusedImagesBatch instead');
    
    // Convert to outing data format for the new method
    const initialData = {
      overview: oldContent,
      detail: '', packingList: '', parking: '', 
      nearbyHospital: '', notes: '', contacts: '', references: ''
    };
    
    const finalData = {
      overview: newContent,
      detail: '', packingList: '', parking: '', 
      nearbyHospital: '', notes: '', contacts: '', references: ''
    };
    
    return await this.cleanupUnusedImagesBatch(initialData, finalData);
  }

  // Bulk cleanup function to find and remove orphaned images across all content
  async bulkCleanupOrphanedImages(allContentArray = []) {
    try {
      // Check if proxy is configured
      if (!this.proxyUrl || this.proxyUrl === 'https://script.google.com/macros/s/AKfycby.../exec') {
        console.log('Google Drive proxy not configured, skipping bulk image cleanup.');
        return { cleaned: 0, errors: [], message: 'Proxy not configured' };
      }

      // Combine all content to find all referenced images
      const allContent = allContentArray.join(' ');
      const referencedImages = this.extractImageUrlsFromContent(allContent);
      
      console.log(`Found ${referencedImages.length} images referenced in content`);
      
      // For now, this is a placeholder - in a real implementation, you would:
      // 1. List all files in the Google Drive folder
      // 2. Compare with referenced images
      // 3. Delete unreferenced images
      
      // This would require additional Google Apps Script endpoints to list folder contents
      console.log('Bulk cleanup would require additional Google Apps Script endpoints to list folder contents');
      
      return { 
        cleaned: 0, 
        errors: [], 
        message: `Found ${referencedImages.length} referenced images. Bulk cleanup requires additional implementation.`,
        referencedImages: referencedImages.length
      };
    } catch (error) {
      console.error('Error during bulk image cleanup:', error);
      return { cleaned: 0, errors: [{ error: error.message }], message: 'Bulk cleanup failed' };
    }
  }

  // Convenient method to get image info including data URL
  async getImageInfo(imageUrl) {
    try {
      // Check if this is a proxy URL (our Apps Script URL)
      if (!imageUrl.includes(this.proxyUrl.split('?')[0])) {
        console.warn('Direct Google Drive URLs may not work due to CORS. Using proxy URL instead.');
        return null;
      }

      const jsonUrl = imageUrl.includes('format=json') 
        ? imageUrl 
        : (imageUrl.includes('?') ? `${imageUrl}&format=json` : `${imageUrl}?format=json`);

      const response = await fetch(jsonUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image info: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success || result.error) {
        throw new Error(result.error || 'Failed to get image info');
      }

      return {
        fileId: result.fileId,
        fileName: result.fileName,
        mimeType: result.mimeType,
        dataUrl: result.dataUrl,
        base64Data: result.base64Data
      };

    } catch (error) {
      console.error('Error fetching image info:', error);
      return null;
    }
  }

  // Convert proxy URL to blob URL for editor compatibility
  async convertToEditorUrl(proxyUrl) {
    try {
      const imageInfo = await this.getImageInfo(proxyUrl);
      if (!imageInfo || !imageInfo.dataUrl) {
        console.warn('Could not get image data, returning original URL');
        return proxyUrl;
      }

      // Convert data URL to blob URL
      const response = await fetch(imageInfo.dataUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      console.log('Converted proxy URL to blob URL for editor compatibility');
      return blobUrl;

    } catch (error) {
      console.error('Error converting to editor URL:', error);
      return proxyUrl; // Fallback to original URL
    }
  }

  async deleteImage(imageUrl) {
    try {
      // Check if proxy is configured
      if (!this.proxyUrl || this.proxyUrl === 'https://script.google.com/macros/s/AKfycby.../exec') {
        console.log('Google Drive proxy not configured, skipping deletion.');
        return true;
      }

      // Extract file ID from Google Drive URL
      if (!imageUrl.includes('drive.google.com')) {
        console.log('Image is not from Google Drive, skipping deletion.');
        return true;
      }

      // Parse Google Drive URL to get file ID
      const fileIdMatch = imageUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      
      if (!fileIdMatch) {
        throw new Error('Invalid Google Drive URL format.');
      }

      const fileId = fileIdMatch[1];

      console.log('Deleting image from Google Drive:', fileId);

      // Delete via Google Apps Script proxy
      const response = await fetch(`${this.proxyUrl}?action=delete&fileId=${fileId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
      }

      // Handle both JSON and plain text responses
      let result;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // Handle plain text response (CORS workaround)
        const textResponse = await response.text();
        try {
          result = JSON.parse(textResponse);
        } catch (parseError) {
          console.error('Failed to parse delete response as JSON:', textResponse);
          throw new Error('Invalid response format from Google Drive service');
        }
      }
      
      if (!result.success || result.error) {
        throw new Error(result.error || 'Delete failed');
      }

      console.log('Image deleted successfully from Google Drive');
      return true;

    } catch (error) {
      console.error('Error deleting image:', error);
      
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('Image was already deleted or does not exist.');
        return true; // Consider it successful if already gone
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('You do not have permission to delete this image.');
      } else {
        throw new Error(error.message || 'Failed to delete image. Please try again.');
      }
    }
  }
}

// Create and export a singleton instance
const googleDriveService = new GoogleDriveService();
export default googleDriveService;