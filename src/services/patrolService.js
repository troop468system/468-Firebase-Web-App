import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  orderBy, 
  query 
} from 'firebase/firestore';
import { db } from '../firebase';

class PatrolService {
  constructor() {
    this.collectionName = 'patrols';
  }

  // Get all patrols
  async getPatrols() {
    try {
      const q = query(collection(db, this.collectionName), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting patrols:', error);
      // Fallback to default patrols if database fails
      return [
        { id: '1', name: 'Vipers', order: 1, active: true },
        { id: '2', name: 'Hawks', order: 2, active: true },
        { id: '3', name: 'Red Bulls', order: 3, active: true },
        { id: '4', name: 'Ninjas', order: 4, active: true },
        { id: '5', name: 'Dragons', order: 5, active: true }
      ];
    }
  }

  // Get active patrol names only
  async getActivePatrolNames() {
    try {
      const patrols = await this.getPatrols();
      return patrols.filter(p => p.active).map(p => p.name);
    } catch (error) {
      console.error('Error getting active patrol names:', error);
      return ['Vipers', 'Hawks', 'Red Bulls', 'Ninjas', 'Dragons'];
    }
  }

  // Add a new patrol
  async addPatrol(patrolData) {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...patrolData,
        active: true,
        createdAt: new Date()
      });
      return { id: docRef.id, ...patrolData };
    } catch (error) {
      console.error('Error adding patrol:', error);
      throw error;
    }
  }

  // Update a patrol
  async updatePatrol(patrolId, patrolData) {
    try {
      const patrolRef = doc(db, this.collectionName, patrolId);
      await updateDoc(patrolRef, {
        ...patrolData,
        updatedAt: new Date()
      });
      return { id: patrolId, ...patrolData };
    } catch (error) {
      console.error('Error updating patrol:', error);
      throw error;
    }
  }

  // Delete/deactivate a patrol
  async deletePatrol(patrolId) {
    try {
      const patrolRef = doc(db, this.collectionName, patrolId);
      await updateDoc(patrolRef, {
        active: false,
        deletedAt: new Date()
      });
    } catch (error) {
      console.error('Error deleting patrol:', error);
      throw error;
    }
  }

  // Reorder patrols
  async reorderPatrols(patrols) {
    try {
      const updatePromises = patrols.map((patrol, index) => {
        const patrolRef = doc(db, this.collectionName, patrol.id);
        return updateDoc(patrolRef, { order: index + 1 });
      });
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error reordering patrols:', error);
      throw error;
    }
  }
}

const patrolService = new PatrolService();
export default patrolService;