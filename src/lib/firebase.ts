import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDB0K6AJBg3xciuO6XKHWYQCYgsg8U3nOo",
    authDomain: "cloaked-34fcb.firebaseapp.com",
    projectId: "cloaked-34fcb",
    storageBucket: "cloaked-34fcb.firebasestorage.app",
    messagingSenderId: "545399376048",
    appId: "1:545399376048:web:988d4d82db620e44a11375",
    measurementId: "G-N9P6N7T1BV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);

// Initialize Firebase Messaging for notifications
// Commenting out messaging due to type issues
// let messaging;
// if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
//   messaging = getMessaging(app);
// }

export { app, analytics, auth /* , messaging */ };