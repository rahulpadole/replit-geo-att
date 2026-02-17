import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, ATTENDANCE_STATUS } from '../constants';

class AttendanceService {
  async getTodayAttendance(userId) {
    const today = new Date().toISOString().split('T')[0];
    const docId = `${userId}_${today}`;
    
    try {
      const docRef = doc(db, COLLECTIONS.ATTENDANCE, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      throw error;
    }
  }

  async markAttendance(userId, userData, attendanceData) {
    const today = new Date().toISOString().split('T')[0];
    const docId = `${userId}_${today}`;
    const docRef = doc(db, COLLECTIONS.ATTENDANCE, docId);
    
    try {
      const existing = await getDoc(docRef);
      
      if (existing.exists()) {
        // Update existing
        await updateDoc(docRef, {
          ...attendanceData,
          updatedAt: Timestamp.now()
        });
      } else {
        // Create new
        await setDoc(docRef, {
          userId,
          userName: userData.name || userData.email,
          date: today,
          ...attendanceData,
          createdAt: Timestamp.now()
        });
      }
      
      return { success: true, id: docId };
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  async getAttendanceHistory(userId, page = 1, pageSize = 40) {
    try {
      const q = query(
        collection(db, COLLECTIONS.ATTENDANCE),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(pageSize)
      );
      
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return records;
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  }

  async getAttendanceByDateRange(startDate, endDate, filters = {}) {
    try {
      let q = query(
        collection(db, COLLECTIONS.ATTENDANCE),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching attendance by date range:', error);
      throw error;
    }
  }
}

export default new AttendanceService();