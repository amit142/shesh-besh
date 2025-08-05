// Firebase configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDzZU5RfIthZeJ-A2w7TAaTKKbFKyo3-qk",
    authDomain: "shesh-besh-f9c84.firebaseapp.com",
    projectId: "shesh-besh-f9c84",
    storageBucket: "shesh-besh-f9c84.firebasestorage.app",
    messagingSenderId: "812649304493",
    appId: "1:812649304493:web:d001a9d740563b72c3d124",
    measurementId: "G-W5CZ5ZH20J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with error handling
export const auth = getAuth(app);

// Initialize Firestore with better error handling
export const db = getFirestore(app);

// Configure Firestore settings to handle connection issues
try {
    // Disable offline persistence to avoid connection issues during development
    import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')
        .then(({ disableNetwork, enableNetwork }) => {
            // Enable network connectivity
            enableNetwork(db).catch(error => {
                console.warn('Failed to enable Firestore network:', error);
            });
        })
        .catch(error => {
            console.warn('Firestore network configuration warning:', error);
        });
} catch (error) {
    console.warn('Firestore configuration warning:', error);
}

// Add connection state monitoring
let isOnline = navigator.onLine;
let connectionRetries = 0;
const maxRetries = 3;

// Monitor online/offline status
window.addEventListener('online', () => {
    isOnline = true;
    connectionRetries = 0;
    console.log('🟢 Connection restored');
});

window.addEventListener('offline', () => {
    isOnline = false;
    console.log('🔴 Connection lost - working offline');
});

// Export connection utilities
export const connectionUtils = {
    isOnline: () => isOnline,
    getRetryCount: () => connectionRetries,
    incrementRetry: () => connectionRetries++,
    resetRetries: () => connectionRetries = 0,
    maxRetries
};

// Export the app instance
export default app;