import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

class OutingService {
  constructor() {
    this.collectionName = 'outings';
  }

  /**
   * Create a new outing
   * @param {Object} outingData - The outing data to save
   * @returns {Promise<string>} - The ID of the created outing
   */
  async createOuting(outingData) {
    try {
      console.log('OutingService: Creating new outing...', outingData);
      
      // Filter out undefined values to prevent Firestore errors
      const cleanOutingData = this.removeUndefinedFields(outingData);
      
      // Prepare the data for Firestore
      const firestoreData = {
        ...cleanOutingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: cleanOutingData.createdBy || 'current-user', // In real app, get from auth context
      };

      console.log('OutingService: Clean outing data:', firestoreData);
      
      // Add the document to Firestore
      const docRef = await addDoc(collection(db, this.collectionName), firestoreData);
      
      console.log('OutingService: Outing created successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('OutingService: Error creating outing:', error);
      throw error;
    }
  }

  /**
   * Update an existing outing
   * @param {string} outingId - The ID of the outing to update
   * @param {Object} updates - The updates to apply
   * @returns {Promise<void>}
   */
  async updateOuting(outingId, updates) {
    let updateData;
    try {
      console.log('OutingService: Updating outing:', outingId, updates);
      
      const outingRef = doc(db, this.collectionName, outingId);
      
      // Filter out undefined values to prevent Firestore errors
      const cleanUpdates = this.removeUndefinedFields(updates);
      
      updateData = {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      };
      
      console.log('OutingService: Clean update data:', updateData);
      
      // Additional validation to check for any remaining undefined values
      this.validateNoUndefinedValues(updateData, 'updateData');
      
      await updateDoc(outingRef, updateData);
      console.log('OutingService: Outing updated successfully');
    } catch (error) {
      console.error('OutingService: Error updating outing:', error);
      console.error('OutingService: Failed update data:', updateData);
      throw error;
    }
  }

  /**
   * Delete an outing
   * @param {string} outingId - The ID of the outing to delete
   * @returns {Promise<void>}
   */
  async deleteOuting(outingId) {
    try {
      console.log('OutingService: Deleting outing:', outingId);
      
      const outingRef = doc(db, this.collectionName, outingId);
      await deleteDoc(outingRef);
      
      console.log('OutingService: Outing deleted successfully');
    } catch (error) {
      console.error('OutingService: Error deleting outing:', error);
      throw error;
    }
  }

  /**
   * Get a single outing by ID
   * @param {string} outingId - The ID of the outing to retrieve
   * @returns {Promise<Object|null>} - The outing data or null if not found
   */
  async getOuting(outingId) {
    try {
      console.log('OutingService: Getting outing:', outingId);
      
      const outingRef = doc(db, this.collectionName, outingId);
      const outingSnap = await getDoc(outingRef);
      
      if (outingSnap.exists()) {
        const data = { id: outingSnap.id, ...outingSnap.data() };
        console.log('OutingService: Outing found:', data);
        return data;
      } else {
        console.log('OutingService: Outing not found');
        return null;
      }
    } catch (error) {
      console.error('OutingService: Error getting outing:', error);
      throw error;
    }
  }

  /**
   * Get all outings
   * @returns {Promise<Array>} - Array of all outings
   */
  async getAllOutings() {
    try {
      console.log('OutingService: Getting all outings...');
      
      const outingsQuery = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(outingsQuery);
      const outings = [];
      
      querySnapshot.forEach((doc) => {
        outings.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('OutingService: Found', outings.length, 'outings');
      return outings;
    } catch (error) {
      console.error('OutingService: Error getting all outings:', error);
      throw error;
    }
  }

  /**
   * Get public outings only
   * @returns {Promise<Array>} - Array of public outings
   */
  async getPublicOutings() {
    try {
      console.log('OutingService: Getting public outings...');
      
      const publicOutingsQuery = query(
        collection(db, this.collectionName),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(publicOutingsQuery);
      const outings = [];
      
      querySnapshot.forEach((doc) => {
        outings.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('OutingService: Found', outings.length, 'public outings');
      return outings;
    } catch (error) {
      console.error('OutingService: Error getting public outings:', error);
      throw error;
    }
  }

  /**
   * Get outings by visibility (public/private)
   * @param {boolean} isPublic - Whether to get public (true) or private (false) outings
   * @returns {Promise<Array>} - Array of outings
   */
  async getOutingsByVisibility(isPublic) {
    try {
      console.log('OutingService: Getting', isPublic ? 'public' : 'private', 'outings...');
      
      const outingsQuery = query(
        collection(db, this.collectionName),
        where('isPublic', '==', isPublic),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(outingsQuery);
      const outings = [];
      
      querySnapshot.forEach((doc) => {
        outings.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('OutingService: Found', outings.length, isPublic ? 'public' : 'private', 'outings');
      return outings;
    } catch (error) {
      console.error('OutingService: Error getting outings by visibility:', error);
      throw error;
    }
  }

  /**
   * Remove undefined fields and invalid dates from an object to prevent Firestore errors
   * @param {Object} obj - The object to clean
   * @returns {Object} - Object with undefined values and invalid dates removed
   */
  removeUndefinedFields(obj) {
    if (obj === null) return null;
    if (obj === undefined) return undefined;
    if (typeof obj !== 'object') return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj
        .filter(item => item !== undefined)
        .map(item => this.removeUndefinedFields(item));
    }
    
    // Handle Date objects - check for invalid dates
    if (obj instanceof Date) {
      if (isNaN(obj.getTime())) {
        console.warn('OutingService: Removing invalid date:', obj);
        return undefined; // Remove invalid dates
      }
      return obj;
    }
    
    // Handle Firestore timestamps
    if ((obj && typeof obj.toDate === 'function') || 
        (obj && obj.constructor && obj.constructor.name.includes('Timestamp'))) {
      return obj;
    }
    
    // Handle regular objects
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const cleanedValue = this.removeUndefinedFields(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    
    return cleaned;
  }

  /**
   * Validate that no undefined values or invalid dates exist in the data structure
   * @param {Object} obj - The object to validate
   * @param {string} path - The current path for debugging
   */
  validateNoUndefinedValues(obj, path = 'root') {
    if (obj === undefined) {
      console.error(`OutingService: Found undefined value at path: ${path}`);
      return;
    }
    
    if (obj === null || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.validateNoUndefinedValues(item, `${path}[${index}]`);
      });
      return;
    }
    
    // Check Date objects for validity
    if (obj instanceof Date) {
      if (isNaN(obj.getTime())) {
        console.error(`OutingService: Found invalid date at path: ${path}`, obj);
      }
      return;
    }
    
    // Skip Firestore timestamps
    if ((obj && typeof obj.toDate === 'function') || 
        (obj && obj.constructor && obj.constructor.name.includes('Timestamp'))) {
      return;
    }
    
    for (const [key, value] of Object.entries(obj)) {
      this.validateNoUndefinedValues(value, `${path}.${key}`);
    }
  }

  /**
   * Convert Firestore timestamp to JavaScript Date
   * @param {Object} timestamp - Firestore timestamp
   * @returns {Date|null} - JavaScript Date object or null
   */
  convertTimestampToDate(timestamp) {
    if (!timestamp) return null;
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  /**
   * Prepare outing data for display (convert timestamps to dates)
   * @param {Object} outing - Raw outing data from Firestore
   * @returns {Object} - Processed outing data
   */
  processOutingData(outing) {
    return {
      ...outing,
      startDateTime: this.convertTimestampToDate(outing.startDateTime),
      endDateTime: this.convertTimestampToDate(outing.endDateTime),
      createdAt: this.convertTimestampToDate(outing.createdAt),
      updatedAt: this.convertTimestampToDate(outing.updatedAt)
    };
  }
}

// Create and export a singleton instance
const outingService = new OutingService();
export default outingService;
