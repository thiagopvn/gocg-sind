import { storage } from './firebase-config.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
const { ipcRenderer } = require('electron');

export class FileManager {
  constructor() {
    this.uploadProgress = new Map();
  }

  async selectFile() {
    try {
      const filePath = await ipcRenderer.invoke('select-file');
      return filePath;
    } catch (error) {
      console.error('Error selecting file:', error);
      return null;
    }
  }

  async uploadDocument(filePath, hearingId, progressCallback) {
    try {
      // Read file data
      const fileData = await ipcRenderer.invoke('read-file', filePath);
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
      const fileExtension = fileName.split('.').pop().toLowerCase();
      
      // Validate file type
      if (!['pdf', 'doc', 'docx'].includes(fileExtension)) {
        throw new Error('Tipo de arquivo não suportado. Use apenas PDF, DOC ou DOCX.');
      }

      // Create unique file name
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${fileName}`;
      const storagePath = `oficios/${hearingId}/${uniqueFileName}`;
      
      // Create storage reference
      const storageRef = ref(storage, storagePath);
      
      // Convert file data to blob
      const blob = new Blob([fileData]);
      
      // Upload with progress tracking
      const uploadTask = uploadBytes(storageRef, blob);
      
      // Track upload progress
      this.uploadProgress.set(hearingId, { progress: 0, status: 'uploading' });
      
      if (progressCallback) {
        // Simulate progress updates (Firebase Web SDK doesn't provide real progress)
        const progressInterval = setInterval(() => {
          const current = this.uploadProgress.get(hearingId);
          if (current && current.progress < 90) {
            current.progress += 10;
            progressCallback(current.progress);
          }
        }, 200);

        uploadTask.then(() => {
          clearInterval(progressInterval);
          if (progressCallback) progressCallback(100);
        });
      }
      
      // Wait for upload completion
      const snapshot = await uploadTask;
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update progress
      this.uploadProgress.set(hearingId, { progress: 100, status: 'completed' });
      
      return {
        success: true,
        url: downloadURL,
        fileName: fileName,
        storagePath: storagePath
      };
      
    } catch (error) {
      this.uploadProgress.set(hearingId, { progress: 0, status: 'error', error: error.message });
      console.error('Error uploading document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteDocument(storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: error.message };
    }
  }

  getUploadProgress(hearingId) {
    return this.uploadProgress.get(hearingId) || { progress: 0, status: 'idle' };
  }

  clearUploadProgress(hearingId) {
    this.uploadProgress.delete(hearingId);
  }

  // Helper method to validate file size
  validateFileSize(fileData, maxSizeMB = 10) {
    const fileSizeBytes = fileData.byteLength || fileData.length;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    
    if (fileSizeMB > maxSizeMB) {
      throw new Error(`Arquivo muito grande. Tamanho máximo permitido: ${maxSizeMB}MB`);
    }
    
    return true;
  }

  // Helper method to get file info
  async getFileInfo(filePath) {
    try {
      const fileData = await ipcRenderer.invoke('read-file', filePath);
      const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
      const fileSize = fileData.byteLength || fileData.length;
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      
      return {
        name: fileName,
        size: fileSize,
        sizeMB: fileSizeMB,
        extension: fileName.split('.').pop().toLowerCase()
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }
}