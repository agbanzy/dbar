import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDmmxgwubf6tje-b2ZqYRVW9DAYiDItTwk",
  authDomain: "digibar-d8822.firebaseapp.com",
  projectId: "digibar-d8822",
  storageBucket: "digibar-d8822.firebasestorage.app",
  messagingSenderId: "659710651777",
  appId: "1:659710651777:web:d6331bd44b442e8dcbcc80",
  measurementId: "G-Q8X09X1V8B"
};

// Initialize Firebase (Singleton pattern to prevent re-initialization errors)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics (Client-side only)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };