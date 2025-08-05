// Setup Firestore with test data
import { auth, db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    setDoc, 
    addDoc, 
    serverTimestamp,
    enableNetwork,
    connectFirestoreEmulator
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class FirestoreSetup {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        console.log('🔥 Initializing Firestore setup...');
        
        // Wait for auth
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                console.log('✅ User authenticated:', user.displayName);
                await this.setupTestData();
            } else {
                console.log('❌ User not authenticated');
            }
        });
    }

    async setupTestData() {
        try {
            console.log('📊 Setting up test data...');
            
            // Create test users
            await this.createTestUsers();
            
            // Create test tournaments
            await this.createTestTournaments();
            
            // Create test matches
            await this.createTestMatches();
            
            console.log('✅ Test data setup complete!');
            this.showStatus('✅ נתוני הבדיקה נוצרו בהצלחה!', 'success');
            
        } catch (error) {
            console.error('❌ Error setting up test data:', error);
            this.showStatus('❌ שגיאה ביצירת נתוני הבדיקה: ' + error.message, 'error');
        }
    }

    async createTestUsers() {
        console.log('👥 Creating test users...');
        
        const testUsers = [
            {
                uid: this.currentUser.uid,
                displayName: this.currentUser.displayName || 'אתה',
                email: this.currentUser.email,
                photoURL: this.currentUser.photoURL || 'https://ui-avatars.com/api/?name=אתה&background=3b82f6&color=fff',
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
            },
            {
                uid: 'player-1',
                displayName: 'אלי כהן',
                email: 'eli.cohen@example.com',
                photoURL: 'https://ui-avatars.com/api/?name=אלי+כהן&background=dc3545&color=fff',
                createdAt: serverTimestamp()
            },
            {
                uid: 'player-2',
                displayName: 'שרה לוי',
                email: 'sarah.levy@example.com',
                photoURL: 'https://ui-avatars.com/api/?name=שרה+לוי&background=28a745&color=fff',
                createdAt: serverTimestamp()
            },
            {
                uid: 'player-3',
                displayName: 'דוד ישראל',
                email: 'david.israel@example.com',
                photoURL: 'https://ui-avatars.com/api/?name=דוד+ישראל&background=ffc107&color=000',
                createdAt: serverTimestamp()
            },
            {
                uid: 'player-4',
                displayName: 'מירי אברהם',
                email: 'miri.abraham@example.com',
                photoURL: 'https://ui-avatars.com/api/?name=מירי+אברהם&background=17a2b8&color=fff',
                createdAt: serverTimestamp()
            },
            {
                uid: 'player-5',
                displayName: 'יוסי רוזן',
                email: 'yossi.rosen@example.com',
                photoURL: 'https://ui-avatars.com/api/?name=יוסי+רוזן&background=6f42c1&color=fff',
                createdAt: serverTimestamp()
            },
            {
                uid: 'player-6',
                displayName: 'רחל גולד',
                email: 'rachel.gold@example.com',
                photoURL: 'https://ui-avatars.com/api/?name=רחל+גולד&background=fd7e14&color=fff',
                createdAt: serverTimestamp()
            },
            {
                uid: 'player-7',
                displayName: 'משה שלום',
                email: 'moshe.shalom@example.com',
                photoURL: 'https://ui-avatars.com/api/?name=משה+שלום&background=20c997&color=fff',
                createdAt: serverTimestamp()
            }
        ];

        for (const user of testUsers) {
            await setDoc(doc(db, 'users', user.uid), user, { merge: true });
            console.log(`✅ Created user: ${user.displayName}`);
        }
    }

    async createTestTournaments() {
        console.log('🏆 Creating test tournaments...');
        
        const tournaments = [
            {
                id: 'tournament-8-players',
                name: 'טורניר 8 השחקנים הגדול',
                status: 'active',
                participants: [
                    this.currentUser.uid, 'player-1', 'player-2', 'player-3',
                    'player-4', 'player-5', 'player-6', 'player-7'
                ],
                maxParticipants: 8,
                groupCount: 2,
                playersPerGroup: 4,
                code: 'PLAY8',
                createdBy: this.currentUser.uid,
                createdAt: serverTimestamp(),
                startedAt: serverTimestamp(),
                doubleElimination: false
            },
            {
                id: 'tournament-setup',
                name: 'טורניר בהגדרה - 6 שחקנים',
                status: 'setup',
                participants: [
                    this.currentUser.uid, 'player-1', 'player-2', 'player-3', 'player-4', 'player-5'
                ],
                maxParticipants: 8,
                groupCount: 2,
                playersPerGroup: 4,
                code: 'SETUP6',
                createdBy: this.currentUser.uid,
                createdAt: serverTimestamp(),
                doubleElimination: false
            },
            {
                id: 'tournament-completed',
                name: 'טורניר שהושלם - אליפות המשרד',
                status: 'completed',
                participants: [
                    'player-1', 'player-2', 'player-3', 'player-4'
                ],
                maxParticipants: 4,
                groupCount: 1,
                playersPerGroup: 4,
                code: 'DONE4',
                createdBy: 'player-1',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                doubleElimination: false
            }
        ];

        for (const tournament of tournaments) {
            await setDoc(doc(db, 'tournaments', tournament.id), tournament);
            console.log(`✅ Created tournament: ${tournament.name}`);
        }
    }

    async createTestMatches() {
        console.log('⚔️ Creating test matches...');
        
        const matches = [
            // Group 1 matches (players 0-3)
            {
                tournamentId: 'tournament-8-players',
                groupIndex: 0,
                player1: this.currentUser.uid,
                player2: 'player-1',
                status: 'completed',
                player1Score: 15,
                player2Score: 12,
                winner: this.currentUser.uid,
                completedAt: serverTimestamp(),
                submittedBy: this.currentUser.uid,
                createdAt: serverTimestamp()
            },
            {
                tournamentId: 'tournament-8-players',
                groupIndex: 0,
                player1: 'player-2',
                player2: 'player-3',
                status: 'completed',
                player1Score: 18,
                player2Score: 14,
                winner: 'player-2',
                completedAt: serverTimestamp(),
                submittedBy: 'player-2',
                createdAt: serverTimestamp()
            },
            {
                tournamentId: 'tournament-8-players',
                groupIndex: 0,
                player1: this.currentUser.uid,
                player2: 'player-2',
                status: 'pending',
                createdAt: serverTimestamp()
            },
            {
                tournamentId: 'tournament-8-players',
                groupIndex: 0,
                player1: 'player-1',
                player2: 'player-3',
                status: 'pending',
                createdAt: serverTimestamp()
            },
            {
                tournamentId: 'tournament-8-players',
                groupIndex: 0,
                player1: this.currentUser.uid,
                player2: 'player-3',
                status: 'pending',
                createdAt: serverTimestamp()
            },
            {
                tournamentId: 'tournament-8-players',
                groupIndex: 0,
                player1: 'player-1',
                player2: 'player-2',
                status: 'pending',
                createdAt: serverTimestamp()
            },
            
            // Group 2 matches (players 4-7)
            {
                tournamentId: 'tournament-8-players',
                groupIndex: 1,
                player1: 'player-4',
                player2: 'player-5',
                status: 'completed',
                player1Score: 16,
                player2Score: 13,
                winner: 'player-4',
                completedAt: serverTimestamp(),
                submittedBy: 'player-4',
                createdAt: serverTimestamp()
            },
            {
                tournamentId: 'tournament-8-players',
                groupIndex: 1,
                player1: 'player-6',
                player2: 'player-7',
                status: 'completed',
                player1Score: 14,
                player2Score: 17,
                winner: 'player-7',
                completedAt: serverTimestamp(),
                submittedBy: 'player-7',
                createdAt: serverTimestamp()
            },
            {
                tournamentId: 'tournament-8-players',
                groupIndex: 1,
                player1: 'player-4',
                player2: 'player-6',
                status: 'pending',
                createdAt: serverTimestamp()
            },
            {
                tournamentId: 'tournament-8-players',
                groupIndex: 1,
                player1: 'player-5',
                player2: 'player-7',
                status: 'pending',
                createdAt: serverTimestamp()
            },
            {
                tournamentId: 'tournament-8-players',
                groupIndex: 1,
                player1: 'player-4',
                player2: 'player-7',
                status: 'pending',
                createdAt: serverTimestamp()
            },
            {
                tournamentId: 'tournament-8-players',
                groupIndex: 1,
                player1: 'player-5',
                player2: 'player-6',
                status: 'pending',
                createdAt: serverTimestamp()
            }
        ];

        for (const match of matches) {
            await addDoc(collection(db, 'matches'), match);
            console.log(`✅ Created match: ${match.player1} vs ${match.player2}`);
        }
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('setup-status');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="notification ${type} show" style="position: relative; transform: none; margin: 1rem 0;">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">${type === 'success' ? '✅' : '❌'}</span>
                        <span class="font-semibold">${message}</span>
                    </div>
                </div>
            `;
        }
    }

    async testConnection() {
        try {
            console.log('🔍 Testing Firestore connection...');
            
            // Import getDoc here to avoid issues
            const { getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
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