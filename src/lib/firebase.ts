
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Your web app's Firebase configuration.
const firebaseConfig = {
<<<<<<< HEAD
  apiKey: "AIzaSyBI0DFgPxXtB1RjdrBghciy2Rym0ecCrz0",
  authDomain: "studio-5841216832-7f12e.firebaseapp.com",
  projectId: "studio-5841216832-7f12e",
  storageBucket: "studio-5841216832-7f12e.appspot.com",
  messagingSenderId: "611615799432",
  appId: "1:611615799432:web:b19329f8f5e80d4dfcc73d"
=======
  projectId: '##############',
  appId: '1:##############,
  apiKey: '#########',
  authDomain: '###########',
  measurementId: '',
  messagingSenderId: '#######',
>>>>>>> 06e2fb6931aab2d4564ad21739943bdd31253614
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Enable offline persistence
try {
  enableIndexedDbPersistence(db);
} catch (error: any) {
  if (error.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one.
    // This is a normal scenario.
    console.warn('Firestore offline persistence could not be enabled, likely due to multiple open tabs.');
  } else if (error.code === 'unimplemented') {
    // The browser does not support all of the features required to enable persistence
    console.warn('The current browser does not support Firestore offline persistence.');
  }
}
