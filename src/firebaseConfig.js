// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // Optional: You can uncomment this if you plan to use Firebase Analytics

// Your web app's Firebase configuration from the "sobriety-test-final" project
const firebaseConfig = {
  apiKey: "AIzaSyAaE3_td0-3vc0SxGeiNAxLxod_2dsliGI",
  authDomain: "sobriety-test-final.firebaseapp.com",
  projectId: "sobriety-test-final",
  storageBucket: "sobriety-test-final.firebasestorage.app",
  messagingSenderId: "465124189476",
  appId: "1:465124189476:web:4defd030f969d57dbaffb1",
  measurementId: "G-BWN9S5T303" // This is optional, primarily for Firebase Analytics
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optional: Initialize Analytics if needed
// const analytics = getAnalytics(app);

// Export the Firebase app instance so it can be used in App.js
export { app };