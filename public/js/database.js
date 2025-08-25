// Database Service usando Firebase Global (CDN)
// O Firebase já está carregado globalmente via firebase-electron.js

export class DatabaseService {
  constructor(authService) {
    this.auth = authService;
    // Aguarda o Firebase estar disponível
    this.waitForFirebase();
  }

  waitForFirebase() {
    return new Promise((resolve) => {
      const checkFirebase = () => {
        if (window.firebaseDb && window.firebaseStorage) {
          this.db = window.firebaseDb;
          this.storage = window.firebaseStorage;
          resolve();
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      checkFirebase();
    });
  }

  // Sindicâncias Management
  async createInquiry(data) {
    try {
      await this.waitForFirebase();
      const inquiryData = {
        ...data,
        sindicanteId: this.auth.getCurrentUser().uid,
        dataInstauracao: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await this.db.collection('sindicancias').add(inquiryData);
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getInquiries() {
    try {
      await this.waitForFirebase();
      const userId = this.auth.getCurrentUser().uid;
      const q = this.db.collection('sindicancias')
        .where('sindicanteId', '==', userId)
        .orderBy('dataInstauracao', 'desc');
      
      const querySnapshot = await q.get();
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
      await this.waitForFirebase();
      const hearingData = {
        ...data,
        status: 'Agendada'
      };
      
      const docRef = await this.db.collection('sindicancias')
        .doc(inquiryId)
        .collection('oitivas')
        .add(hearingData);
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getHearings(inquiryId) {
    try {
      await this.waitForFirebase();
      const q = this.db.collection('sindicancias')
        .doc(inquiryId)
        .collection('oitivas')
        .orderBy('dataOitiva', 'asc');
      
      const querySnapshot = await q.get();
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
      await this.waitForFirebase();
      const hearingRef = this.db.collection('sindicancias')
        .doc(inquiryId)
        .collection('oitivas')
        .doc(hearingId);
      await hearingRef.update(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getHearing(inquiryId, hearingId) {
    try {
      await this.waitForFirebase();
      const hearingRef = this.db.collection('sindicancias')
        .doc(inquiryId)
        .collection('oitivas')
        .doc(hearingId);
      const hearingSnap = await hearingRef.get();
      
      if (hearingSnap.exists) {
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
      await this.waitForFirebase();
      const storageRef = this.storage.ref(path);
      const snapshot = await storageRef.put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();
      return { success: true, url: downloadURL };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Real-time listeners
  listenToHearings(inquiryId, callback) {
    this.waitForFirebase().then(() => {
      const q = this.db.collection('sindicancias')
        .doc(inquiryId)
        .collection('oitivas')
        .orderBy('dataOitiva', 'asc');
      
      return q.onSnapshot((snapshot) => {
        const hearings = [];
        snapshot.forEach((doc) => {
          hearings.push({ id: doc.id, ...doc.data() });
        });
        callback(hearings);
      });
    });
  }

  listenToInquiries(callback) {
    this.waitForFirebase().then(() => {
      const userId = this.auth.getCurrentUser().uid;
      const q = this.db.collection('sindicancias')
        .where('sindicanteId', '==', userId)
        .orderBy('dataInstauracao', 'desc');
      
      return q.onSnapshot((snapshot) => {
        const inquiries = [];
        snapshot.forEach((doc) => {
          inquiries.push({ id: doc.id, ...doc.data() });
        });
        callback(inquiries);
      });
    });
  }
}

// Global compatibility
window.DatabaseService = DatabaseService;