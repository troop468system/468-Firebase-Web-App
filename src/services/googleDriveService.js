// For now, we'll use ImgBB as a free alternative since Google Drive API requires backend
// You can replace this with your own backend API later if needed

class GoogleDriveService {
  constructor() {
    // Using ImgBB as a free alternative - get API key from https://api.imgbb.com/
    this.imgbbApiKey = process.env.REACT_APP_IMGBB_API_KEY || 'your-imgbb-api-key';
  }

  async uploadImage(file, fileName = null) {
    try {
      // Validate file
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image must be smaller than 10MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Upload to ImgBB (free service)
      const formData = new FormData();
      formData.append('image', file);
      if (fileName) {
        formData.append('name', fileName);
      }

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${this.imgbbApiKey}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Upload failed');
      }

      console.log('Image uploaded successfully:', data.data.url);
      return data.data.url;

    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(error.message || 'Failed to upload image. Please try again.');
    }
  }

  async deleteImage(imageUrl) {
    try {
      // ImgBB doesn't provide delete API for free accounts
      // Images will remain on ImgBB but won't be referenced in your app
      console.log('Image removed from editor (ImgBB free tier does not support deletion)');
      return true;
    } catch (error) {
      console.error('Error handling image deletion:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const googleDriveService = new GoogleDriveService();
export default googleDriveService;
