// Firestore connection testing utility
import { auth, db } from './firebase-config.js';
import { 
    doc, 
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class FirestoreSetup {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        console.log('🔥 Initializing Firestore connection test...');
        
        // Wait for auth
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                console.log('✅ User authenticated:', user.displayName);
                await this.testConnection();
            } else {
                console.log('❌ User not authenticated');
            }
        });
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('setup-status');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="notification ${type} show" style="position: relative; transform: none; margin: 1rem 0;">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${type === 'success' ? '✅' : type === 'info' ? '⚠️' : '❌'}</span>
                        <span class="font-semibold">${message}</span>
                    </div>
                </div>
            `;
        }
        console.log(`[${type.toUpperCase()}]`, message);
    }

    async testConnection() {
        try {
            console.log('🔍 Testing Firestore connection...');
            
            // Try to read from users collection
            const testDoc = doc(db, 'users', this.currentUser.uid);
            const docSnap = await getDoc(testDoc);
            
            if (docSnap.exists()) {
                console.log('✅ Firestore connection successful!');
                this.showStatus('✅ החיבור ל-Firestore תקין!', 'success');
                return true;
            } else {
                console.log('⚠️ Document does not exist, but connection works');
                this.showStatus('⚠️ החיבור תקין אך אין נתונים', 'info');
                return true;
            }
        } catch (error) {
            console.error('❌ Firestore connection failed:', error);
            this.showStatus('❌ החיבור ל-Firestore נכשל: ' + error.message, 'error');
            return false;
        }
    }
}

// Initialize setup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.firestoreSetup = new FirestoreSetup();
});

export default FirestoreSetup;