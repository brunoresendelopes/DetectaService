import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0696602594",
  appId: "1:488422788331:web:25ebcd2b9d63519a78c2ae",
  apiKey: "AIzaSyC4h1TIHD9nB46uCsk7t1Nx9v5mo5uiXig",
  authDomain: "gen-lang-client-0696602594.firebaseapp.com",
  storageBucket: "gen-lang-client-0696602594.firebasestorage.app",
  messagingSenderId: "488422788331"
};

const app = initializeApp(firebaseConfig);

// Use the custom database ID provisioned for this applet
export const db = getFirestore(app, "ai-studio-detectaservice-ec06e429-4763-4462-acc6-3913effaf4a2");
