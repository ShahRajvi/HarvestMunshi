// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCsK52QXQxFeJ6uClElQvqaS-EDtyzpS-U", // Your API Key
    authDomain: "harvestmunshi.firebaseapp.com", // Your Firebase Auth Domain
    projectId: "harvestmunshi", // Your Firebase Project ID
    storageBucket: "harvestmunshi.firebasestorage.app", // Your Cloud Storage Bucket (if using)
    messagingSenderId: "975966104855", // Your Cloud Messaging Sender ID (if using)
    appId: "1:975966104855:web:b8741ba4fb46148b9e5b52", // Your Firebase App ID
    measurementId: "G-BJYRVSTHN7" // Your Google Analytics Measurement ID (if using)
  };s

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 