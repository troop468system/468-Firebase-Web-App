import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

// Stakeholders CRUD operations
export const stakeholdersService = {
  // Get all stakeholders
  getAll: async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'stakeholders'), orderBy('name'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching stakeholders:', error);
      throw error;
    }
  },

  // Add new stakeholder
  add: async (stakeholderData) => {
    try {
      const docRef = await addDoc(collection(db, 'stakeholders'), {
        ...stakeholderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding stakeholder:', error);
      throw error;
    }
  },

  // Update stakeholder
  update: async (id, stakeholderData) => {
    try {
      const stakeholderRef = doc(db, 'stakeholders', id);
      await updateDoc(stakeholderRef, {
        ...stakeholderData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating stakeholder:', error);
      throw error;
    }
  },

  // Delete stakeholder
  delete: async (id) => {
    try {
      await deleteDoc(doc(db, 'stakeholders', id));
    } catch (error) {
      console.error('Error deleting stakeholder:', error);
      throw error;
    }
  }
};

// Contacts CRUD operations
export const contactsService = {
  // Get all contacts
  getAll: async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'contacts'), orderBy('createdAt', 'desc'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  },

  // Search contacts
  search: async (searchTerm) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'contacts'));
      const contacts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Client-side filtering for better search experience
      return contacts.filter(contact => {
        const searchLower = searchTerm.toLowerCase();
        return (
          contact.name?.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower) ||
          contact.phone?.toLowerCase().includes(searchLower) ||
          contact.organization?.toLowerCase().includes(searchLower)
        );
      });
    } catch (error) {
      console.error('Error searching contacts:', error);
      throw error;
    }
  },

  // Add contact (usually from Google Sheets sync)
  add: async (contactData) => {
    try {
      const docRef = await addDoc(collection(db, 'contacts'), {
        ...contactData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  },

  // Bulk add contacts (for sync)
  bulkAdd: async (contactsArray) => {
    try {
      const promises = contactsArray.map(contact => 
        addDoc(collection(db, 'contacts'), {
          ...contact,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk adding contacts:', error);
      throw error;
    }
  },

  // Clear all contacts (for fresh sync)
  clearAll: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'contacts'));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing contacts:', error);
      throw error;
    }
  }
};

// Notifications service
export const notificationsService = {
  // Get all notifications
  getAll: async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Add notification
  add: async (notificationData) => {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (id) => {
    try {
      const notificationRef = doc(db, 'notifications', id);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
};

// Settings service
export const settingsService = {
  // Get settings
  get: async (key) => {
    try {
      const docRef = doc(db, 'settings', key);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  // Update settings
  update: async (key, settingsData) => {
    try {
      const settingsRef = doc(db, 'settings', key);
      await updateDoc(settingsRef, {
        ...settingsData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
};