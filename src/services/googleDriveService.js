// Firebase Storage service for image uploads
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

class GoogleDriveService {
  constructor() {
    this.auth = getAuth();
  }

  async uploadImage(file, fileName = null) {
    try {
      // Check if user is authenticated
      if (!this.auth.currentUser) {
        throw new Error('You must be logged in to upload images.');
      }

      // Validate file
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image must be smaller than 10MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const userId = this.auth.currentUser.uid;
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = fileName 
        ? `${fileName}_${timestamp}.${fileExtension}`
        : `image_${timestamp}.${fileExtension}`;

      // Create storage reference
      const storageRef = ref(storage, `outing-images/${userId}/${uniqueFileName}`);

      console.log('Uploading image to Firebase Storage...');

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      console.log('Image uploaded successfully, getting download URL...');

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('Image uploaded successfully:', downloadURL);
      return downloadURL;

    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Provide more specific error messages
      if (error.code === 'storage/unauthorized') {
        throw new Error('You do not have permission to upload images. Please check your authentication.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload was canceled. Please try again.');
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Storage quota exceeded. Please contact your administrator.');
      } else if (error.code === 'storage/invalid-format') {
        throw new Error('Invalid file format. Please select a valid image file.');
      } else {
        throw new Error(error.message || 'Failed to upload image. Please try again.');
      }
    }
  }

  async deleteImage(imageUrl) {
    try {
      // Check if user is authenticated
      if (!this.auth.currentUser) {
        throw new Error('You must be logged in to delete images.');
      }

      // Extract storage path from Firebase Storage URL
      if (!imageUrl.includes('firebase')) {
        console.log('Image is not from Firebase Storage, skipping deletion.');
        return true;
      }

      // Parse Firebase Storage URL to get the reference
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      
      if (!pathMatch) {
        throw new Error('Invalid Firebase Storage URL format.');
      }

      const storagePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, storagePath);

      console.log('Deleting image from Firebase Storage:', storagePath);

      // Delete the file
      await deleteObject(storageRef);
      
      console.log('Image deleted successfully from Firebase Storage');
      return true;

    } catch (error) {
      console.error('Error deleting image:', error);
      
      if (error.code === 'storage/object-not-found') {
        console.log('Image was already deleted or does not exist.');
        return true; // Consider it successful if already gone
      } else if (error.code === 'storage/unauthorized') {
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
