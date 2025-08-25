// File Manager Service usando Firebase Global (CDN)
// O Firebase já está carregado globalmente via firebase-electron.js
// Nota: Este arquivo foi atualizado para funcionar no ambiente web/serverless

export class FileManager {
  constructor() {
    this.uploadProgress = new Map();
    this.waitForFirebase();
  }

  waitForFirebase() {
    return new Promise((resolve) => {
      const checkFirebase = () => {
        if (window.firebaseStorage) {
          this.storage = window.firebaseStorage;
          resolve();
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      checkFirebase();
    });
  }

  // Para ambiente web - usa input file HTML
  async selectFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx';
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          resolve(file);
        } else {
          resolve(null);
        }
      };
      
      input.click();
    });
  }

  async uploadDocument(file, hearingId, progressCallback) {
    try {
      await this.waitForFirebase();
      
      // Validar tipo de arquivo
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop().toLowerCase();
      
      if (!['pdf', 'doc', 'docx'].includes(fileExtension)) {
        throw new Error('Tipo de arquivo não suportado. Use apenas PDF, DOC ou DOCX.');
      }

      // Validar tamanho (10MB máximo)
      this.validateFileSize(file, 10);

      // Criar nome único
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}_${fileName}`;
      const storagePath = `oficios/${hearingId}/${uniqueFileName}`;
      
      // Criar referência no storage
      const storageRef = this.storage.ref(storagePath);
      
      // Upload com tracking de progresso
      this.uploadProgress.set(hearingId, { progress: 0, status: 'uploading' });
      
      // Iniciar upload
      const uploadTask = storageRef.put(file);
      
      // Monitorar progresso
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          this.uploadProgress.set(hearingId, { progress, status: 'uploading' });
          if (progressCallback) {
            progressCallback(progress);
          }
        },
        (error) => {
          console.error('Erro no upload:', error);
          this.uploadProgress.set(hearingId, { progress: 0, status: 'error', error: error.message });
        },
        async () => {
          // Upload completo
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          this.uploadProgress.set(hearingId, { progress: 100, status: 'completed' });
          if (progressCallback) {
            progressCallback(100);
          }
        }
      );
      
      // Aguardar conclusão
      await new Promise((resolve, reject) => {
        uploadTask.then(resolve).catch(reject);
      });
      
      const downloadURL = await storageRef.getDownloadURL();
      
      return {
        success: true,
        url: downloadURL,
        fileName: fileName,
        storagePath: storagePath
      };
      
    } catch (error) {
      this.uploadProgress.set(hearingId, { progress: 0, status: 'error', error: error.message });
      console.error('Erro ao fazer upload:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteDocument(storagePath) {
    try {
      await this.waitForFirebase();
      const storageRef = this.storage.ref(storagePath);
      await storageRef.delete();
      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      return { success: false, error: error.message };
    }
  }

  getUploadProgress(hearingId) {
    return this.uploadProgress.get(hearingId) || { progress: 0, status: 'idle' };
  }

  clearUploadProgress(hearingId) {
    this.uploadProgress.delete(hearingId);
  }

  // Validar tamanho do arquivo
  validateFileSize(file, maxSizeMB = 10) {
    const fileSizeBytes = file.size;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    
    if (fileSizeMB > maxSizeMB) {
      throw new Error(`Arquivo muito grande. Tamanho máximo permitido: ${maxSizeMB}MB`);
    }
    
    return true;
  }

  // Obter informações do arquivo
  getFileInfo(file) {
    if (!file) return null;
    
    const fileName = file.name;
    const fileSize = file.size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    
    return {
      name: fileName,
      size: fileSize,
      sizeMB: fileSizeMB,
      extension: fileName.split('.').pop().toLowerCase()
    };
  }
}

// Global compatibility
window.FileManager = FileManager;