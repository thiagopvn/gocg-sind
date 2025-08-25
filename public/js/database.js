import { db, storage } from './firebase-config.js';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class DatabaseService {
  constructor(authService) {
    this.auth = authService;
  }

  // Sindicâncias Management
  async createInquiry(data) {
    try {
      const inquiryData = {
        ...data,
        sindicanteId: this.auth.getCurrentUser().uid,
        dataInstauracao: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'sindicancias'), inquiryData);
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getInquiries() {
    try {
      const userId = this.auth.getCurrentUser().uid;
      const q = query(
        collection(db, 'sindicancias'),
        where('sindicanteId', '==', userId),
        orderBy('dataInstauracao', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const inquiries = [];
      querySnapshot.forEach((doc) => {
        inquiries.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: inquiries };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Oitivas Management
  async createHearing(inquiryId, data) {
    try {
      const hearingData = {
        ...data,
        status: 'Agendada'
      };
      
      const docRef = await addDoc(
        collection(db, 'sindicancias', inquiryId, 'oitivas'), 
        hearingData
      );
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getHearings(inquiryId) {
    try {
      const q = query(
        collection(db, 'sindicancias', inquiryId, 'oitivas'),
        orderBy('dataOitiva', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const hearings = [];
      querySnapshot.forEach((doc) => {
        hearings.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: hearings };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateHearing(inquiryId, hearingId, data) {
    try {
      const hearingRef = doc(db, 'sindicancias', inquiryId, 'oitivas', hearingId);
      await updateDoc(hearingRef, data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getHearing(inquiryId, hearingId) {
    try {
      const hearingRef = doc(db, 'sindicancias', inquiryId, 'oitivas', hearingId);
      const hearingSnap = await getDoc(hearingRef);
      
      if (hearingSnap.exists()) {
        return { success: true, data: { id: hearingSnap.id, ...hearingSnap.data() } };
      } else {
        return { success: false, error: 'Oitiva não encontrada' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // File Upload
  async uploadDocument(file, path) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { success: true, url: downloadURL };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Real-time listeners
  listenToHearings(inquiryId, callback) {
    const q = query(
      collection(db, 'sindicancias', inquiryId, 'oitivas'),
      orderBy('dataOitiva', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const hearings = [];
      snapshot.forEach((doc) => {
        hearings.push({ id: doc.id, ...doc.data() });
      });
      callback(hearings);
    });
  }

  listenToInquiries(callback) {
    const userId = this.auth.getCurrentUser().uid;
    const q = query(
      collection(db, 'sindicancias'),
      where('sindicanteId', '==', userId),
      orderBy('dataInstauracao', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const inquiries = [];
      snapshot.forEach((doc) => {
        inquiries.push({ id: doc.id, ...doc.data() });
      });
      callback(inquiries);
    });
  }
}

// Global compatibility
window.DatabaseService = DatabaseService;