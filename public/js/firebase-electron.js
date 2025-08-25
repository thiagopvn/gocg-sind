// Firebase para Web/Serverless - Versão CDN
// Carregamos o Firebase via CDN usando importmap ou script tags

// Aguarda o Firebase carregar do CDN
function waitForFirebaseFromCDN() {
  return new Promise((resolve, reject) => {
    const checkFirebase = () => {
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length === 0) {
        // Firebase disponível, mas não inicializado
        initializeFirebaseApp();
        resolve();
      } else if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        // Firebase já inicializado
        setupGlobals();
        resolve();
      } else {
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  });
}

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAvV8itVPRFgyXEnmfbMolA7pN3rLIyw6g",
  authDomain: "sind-gocg.firebaseapp.com",
  databaseURL: "https://sind-gocg-default-rtdb.firebaseio.com",
  projectId: "sind-gocg",
  storageBucket: "sind-gocg.firebasestorage.app",
  messagingSenderId: "454083231178",
  appId: "1:454083231178:web:e859588f68fee75038a333"
};

// Inicializar Firebase
function initializeFirebaseApp() {
  firebase.initializeApp(firebaseConfig);
  setupGlobals();
  console.log('🔥 Firebase inicializado com sucesso!');
}

function setupGlobals() {
  // Exportar para uso global (compatibilidade com código existente)
  window.firebaseApp = firebase.app();
  window.firebaseAuth = firebase.auth();
  window.firebaseDb = firebase.firestore();
  window.firebaseStorage = firebase.storage();
}

// Funções auxiliares globais
window.Firebase = {
  // Auth
  signInWithEmailAndPassword: (auth, email, password) => auth.signInWithEmailAndPassword(email, password),
  signOut: (auth) => auth.signOut(),
  onAuthStateChanged: (auth, callback) => auth.onAuthStateChanged(callback),
  
  // Firestore
  collection: (db, path) => db.collection(path),
  doc: (db, path) => db.doc(path),
  addDoc: (ref, data) => ref.add(data),
  updateDoc: (ref, data) => ref.update(data),
  deleteDoc: (ref) => ref.delete(),
  getDocs: (ref) => ref.get(),
  getDoc: (ref) => ref.get(),
  query: (ref) => ref,
  where: (field, operator, value) => firebase.firestore.FieldPath ? ref => ref.where(field, operator, value) : null,
  orderBy: (field, direction) => ref => ref.orderBy(field, direction),
  onSnapshot: (ref, callback) => ref.onSnapshot(callback),
  serverTimestamp: () => firebase.firestore.FieldValue.serverTimestamp(),
  
  // Storage
  ref: (storage, path) => storage.ref(path),
  uploadBytes: (ref, file) => ref.put(file),
  getDownloadURL: (ref) => ref.getDownloadURL(),
  deleteObject: (ref) => ref.delete()
};

// Inicializar quando carregado
waitForFirebaseFromCDN().catch(console.error);