// Tournament management
import { auth, db } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    updateDoc, 
    deleteDoc,
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    getDocs,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import authManager from './auth.js';

class TournamentManager {
    constructor() {
        this.tournamentId = null;
        this.tournament = null;
        this.currentUser = null;
        this.currentGroup = 0;
        this.participants = [];
        this.matches = [];
        this.unsubscribers = [];
        this.init();
    }

    init() {
        // Get tournament ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.tournamentId = urlParams.get('id');

        if (!this.tournamentId) {
            this.showError('הטורניר לא נמצא');
            setTimeout(() => window.location.href = 'app.html', 2000);
            return;
        }

        // Wait for auth state
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.loadTournament();
                this.setupEventListeners();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    setupEventListeners() {
        // Back button
        document.getElementById('back-button').addEventListener('click', () => {
            window.location.href = 'app.html';
        });

        // Share tournament
        document.getElementById('share-tournament').addEventListener('click', () => {
            this.shareTournament();
        });

        // Copy code
        document.getElementById('copy-code').addEventListener('click', () => {
            this.copyTournamentCode();
        });

        // Admin menu
        this.setupAdminMenu();

        // Match filter
        document.getElementById('match-filter').addEventListener('change', (e) => {
            this.filterMatches(e.target.value);
        });

        // Refresh standings
        document.getElementById('refresh-standings').addEventListener('click', () => {
            this.loadMatches();
        });
    }

    setupAdminMenu() {
        const adminMenuButton = document.getElementById('admin-menu-button');
        const adminDropdown = document.getElementById('admin-dropdown');
        const startTournament = document.getElementById('start-tournament');
        const editTournament = document.getElementById('edit-tournament');
        const deleteTournament = document.getElementById('delete-tournament');

        if (adminMenuButton) {
            adminMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                adminDropdown.classList.toggle('hidden');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            adminDropdown.classList.add('hidden');
        });

        // Admin actions
        startTournament.addEventListener('click', () => {
            this.startTournament();
            adminDropdown.classList.add('hidden');
        });

        editTournament.addEventListener('click', () => {
            this.showEditTournamentModal();
            adminDropdown.classList.add('hidden');
        });

        deleteTournament.addEventListener('click', () => {
            this.showDeleteConfirmation();
            adminDropdown.classList.add('hidden');
        });
    }

    async loadTournament() {
        try {
            // Try Firebase first, fallback to demo mode
            try {
                const tournamentDoc = await getDoc(doc(db, 'tournaments', this.tournamentId));
                
                if (!tournamentDoc.exists()) {
                    throw new Error('Tournament not found in Firebase');
                }

                this.tournament = { id: tournamentDoc.id, ...tournamentDoc.data() };

                // Check if user is participant
                if (!this.tournament.participants.includes(this.currentUser.uid)) {
                    this.showError('אתה לא משתתף בטורניר זה');
                    setTimeout(() => window.location.href = 'app.html', 2000);
                    return;
                }

                // Setup real-time listeners for Firebase mode
                this.setupRealtimeListeners();
            } catch (firebaseError) {
                console.error('Firebase error loading tournament:', firebaseError);
                this.showError('שגיאה בטעינת הטורניר. אנא בדקו את החיבור לאינטרנט ונסו שוב.');
                return;
            }

            // Update UI
            this.updateTournamentInfo();
            this.loadParticipants();
            this.setupGroupNavigation();
            this.loadMatches();

        } catch (error) {
            console.error('Error loading tournament:', error);
            this.showError('שגיאה בטעינת הטורניר');
        }
    }



    setupRealtimeListeners() {
        // Tournament updates
        const tournamentUnsubscribe = onSnapshot(doc(db, 'tournaments', this.tournamentId), (doc) => {
            if (doc.exists()) {
                this.tournament = { id: doc.id, ...doc.data() };
                this.updateTournamentInfo();
                this.loadParticipants();
            }
        });

        // Matches updates
        const matchesQuery = query(
            collection(db, 'matches'),
            where('tournamentId', '==', this.tournamentId)
        );
        const matchesUnsubscribe = onSnapshot(matchesQuery, (snapshot) => {
            this.matches = [];
            snapshot.forEach((doc) => {
                this.matches.push({ id: doc.id, ...doc.data() });
            });
            this.renderMatches();
            this.updateLeaderboard();
        });

        this.unsubscribers.push(tournamentUnsubscribe, matchesUnsubscribe);
    }

    updateTournamentInfo() {
        document.getElementById('tournament-name').textContent = this.tournament.name;
        document.getElementById('tournament-status').textContent = this.tournament.status;
        document.getElementById('tournament-code').textContent = `קוד: ${this.tournament.code}`;
        document.getElementById('setup-code').textContent = this.tournament.code;
        
        const participantsCount = document.getElementById('participants-count');
        participantsCount.textContent = `${this.tournament.participants.length}/${this.tournament.maxParticipants} שחקנים`;

        // Show admin menu if user is creator
        const adminMenu = document.getElementById('admin-menu');
        if (this.tournament.createdBy === this.currentUser.uid) {
            adminMenu.classList.remove('hidden');
        }

        // Show appropriate content based on status
        const setupPhase = document.getElementById('setup-phase');
        const activeContent = document.getElementById('active-content');

        if (this.tournament.status === 'setup') {
            setupPhase.classList.remove('hidden');
            activeContent.classList.add('hidden');
        } else {
            setupPhase.classList.add('hidden');
            activeContent.classList.remove('hidden');
        }
    }

    async loadParticipants() {
        const participantsList = document.getElementById('participants-list');
        const participantsLoading = document.getElementById('participants-loading');

        try {
            // Clear existing participants
            participantsList.innerHTML = '';
            
            // Show loading
            if (participantsLoading) participantsLoading.classList.remove('hidden');

            this.participants = [];

            // Load participant details
            for (const uid of this.tournament.participants) {
                try {
                    // Try Firebase
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (userDoc.exists()) {
                        this.participants.push({ uid, ...userDoc.data() });
                    } else {
                        // Fallback for users not in users collection
                        this.participants.push({
                            uid,
                            displayName: 'משתמש לא ידוע',
                            photoURL: 'https://via.placeholder.com/40'
                        });
                    }
                } catch (error) {
                    console.error('Error loading participant:', error);
                    // Add fallback participant
                    this.participants.push({
                        uid,
                        displayName: 'משתמש לא ידוע',
                        photoURL: 'https://via.placeholder.com/40'
                    });
                }
            }

            // Hide loading
            if (participantsLoading) participantsLoading.classList.add('hidden');

            // Render participants
            this.renderParticipants();

        } catch (error) {
            console.error('Error loading participants:', error);
            if (participantsLoading) participantsLoading.classList.add('hidden');
        }
    }

    renderParticipants() {
        const participantsList = document.getElementById('participants-list');
        
        this.participants.forEach(participant => {
            const participantElement = document.createElement('div');
            participantElement.className = 'flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg';
            
            participantElement.innerHTML = `
                <img src="${participant.photoURL || 'https://via.placeholder.com/40'}" 
                     alt="${participant.displayName}" 
                     class="w-10 h-10 rounded-full mb-2">
                <span class="text-xs text-center text-gray-700 dark:text-gray-300 font-medium">
                    ${participant.displayName || 'Unknown'}
                </span>
                ${participant.uid === this.tournament.createdBy ? 
                    '<span class="text-xs text-primary-600 mt-1">מנהל</span>' : ''}
            `;
            
            participantsList.appendChild(participantElement);
        });
    }

    setupGroupNavigation() {
        const groupsNavigation = document.getElementById('groups-navigation');
        
        if (this.tournament.status === 'setup') {
            groupsNavigation.classList.add('hidden');
            return;
        }

        groupsNavigation.classList.remove('hidden');
        
        const groupTabs = groupsNavigation.querySelector('div');
        groupTabs.innerHTML = '';

        for (let i = 0; i < this.tournament.groupCount; i++) {
            const tab = document.createElement('button');
            tab.className = `px-4 py-2 rounded-lg font-medium transition-colors ${
                i === this.currentGroup 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`;
            tab.textContent = `קבוצה ${i + 1}`;
            tab.onclick = () => this.switchGroup(i);
            
            groupTabs.appendChild(tab);
        }
    }

    switchGroup(groupIndex) {
        this.currentGroup = groupIndex;
        this.setupGroupNavigation();
        this.renderMatches();
        this.updateLeaderboard();
    }

    async loadMatches() {
        if (this.tournament.status === 'setup') return;

        try {
            // Load matches from Firebase
            const matchesQuery = query(
                collection(db, 'matches'),
                where('tournamentId', '==', this.tournamentId)
            );
            
            const snapshot = await getDocs(matchesQuery);
            this.matches = [];
            
            snapshot.forEach((doc) => {
                this.matches.push({ id: doc.id, ...doc.data() });
            });

            // If no matches exist, generate them
            if (this.matches.length === 0) {
                await this.generateMatches();
            }

            this.renderMatches();
            this.updateLeaderboard();

        } catch (error) {
            console.error('Error loading matches:', error);
        }
    }

    async generateMatches() {
        if (this.tournament.status !== 'active') return;

        try {
            const playersPerGroup = this.tournament.playersPerGroup;
            const groupCount = this.tournament.groupCount;
            
            for (let groupIndex = 0; groupIndex < groupCount; groupIndex++) {
                const groupParticipants = this.tournament.participants.slice(
                    groupIndex * playersPerGroup,
                    (groupIndex + 1) * playersPerGroup
                );

                // Generate round-robin matches for this group
                for (let i = 0; i < groupParticipants.length; i++) {
                    for (let j = i + 1; j < groupParticipants.length; j++) {
                        const match = {
                            tournamentId: this.tournamentId,
                            groupIndex,
                            player1: groupParticipants[i],
                            player2: groupParticipants[j],
                            status: 'pending',
                            createdAt: serverTimestamp()
                        };

                        await addDoc(collection(db, 'matches'), match);
                    }
                }
            }

        } catch (error) {
            console.error('Error generating matches:', error);
        }
    }

    renderMatches() {
        const matchesList = document.getElementById('matches-list');
        if (!matchesList) return;

        const currentGroupMatches = this.matches.filter(match => 
            match.groupIndex === this.currentGroup
        );

        matchesList.innerHTML = '';

        if (currentGroupMatches.length === 0) {
            matchesList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    לא נמצאו משחקים עבור קבוצה זו
                </div>
            `;
            return;
        }

        currentGroupMatches.forEach(match => {
            const matchElement = this.createMatchElement(match);
            matchesList.appendChild(matchElement);
        });
    }

    createMatchElement(match) {
        const div = document.createElement('div');
        div.className = `match-card-enhanced ${match.status} fade-in`;

        const player1 = this.participants.find(p => p.uid === match.player1);
        const player2 = this.participants.find(p => p.uid === match.player2);

        const canSubmitResult = match.status === 'pending' && 
            (match.player1 === this.currentUser.uid || match.player2 === this.currentUser.uid);

        div.innerHTML = `
            <div class="player-vs-section">
                <div class="player-section">
                    <img src="${player1?.photoURL || 'https://via.placeholder.com/40'}" 
                         alt="${player1?.displayName}" class="participant-avatar w-12 h-12 rounded-full">
                    <div>
                        <div class="font-bold text-wood-dark text-lg">
                            ${player1?.displayName || 'שחקן לא ידוע'}
                        </div>
                        <div class="text-sm text-text-secondary">
                            ${player1?.uid === this.currentUser.uid ? 'אתה' : 'יריב'}
                        </div>
                    </div>
                </div>
                
                <div class="vs-divider">נגד</div>
                
                <div class="player-section">
                    <img src="${player2?.photoURL || 'https://via.placeholder.com/40'}" 
                         alt="${player2?.displayName}" class="participant-avatar w-12 h-12 rounded-full">
                    <div>
                        <div class="font-bold text-wood-dark text-lg">
                            ${player2?.displayName || 'שחקן לא ידוע'}
                        </div>
                        <div class="text-sm text-text-secondary">
                            ${player2?.uid === this.currentUser.uid ? 'אתה' : 'יריב'}
                        </div>
                    </div>
                </div>
            </div>
            
            ${match.status === 'completed' ? `
                <div class="score-section justify-center mb-4">
                    <div class="score-box ${match.winner === match.player1 ? 'bg-gold text-wood-dark' : ''}">${match.player1Score}</div>
                    <div class="text-2xl text-wood-medium">-</div>
                    <div class="score-box ${match.winner === match.player2 ? 'bg-gold text-wood-dark' : ''}">${match.player2Score}</div>
                </div>
                <div class="text-center">
                    <div class="winner-indicator">
                        🏆 ${match.winner === match.player1 ? player1?.displayName : player2?.displayName} ניצח!
                    </div>
                </div>
            ` : `
                <div class="text-center">
                    <div class="flex items-center justify-center gap-4 mb-4">
                        <div class="dice rolling" style="width: 32px; height: 32px; --i: 0;"></div>
                        <span class="text-lg font-semibold text-wood-medium">ממתין לתוצאה</span>
                        <div class="dice rolling" style="width: 32px; height: 32px; --i: 1;"></div>
                    </div>
                    ${canSubmitResult ? `
                        <button onclick="window.tournamentManager.showSubmitResultModal('${match.id}')" 
                                class="btn-primary px-6 py-3">
                            🎯 הגש תוצאת המשחק
                        </button>
                    ` : `
                        <div class="text-text-secondary">
                            רק משתתפי המשחק יכולים להגיש תוצאות
                        </div>
                    `}
                </div>
            `}
        `;

        return div;
    }

    updateLeaderboard() {
        const leaderboard = document.getElementById('leaderboard');
        if (!leaderboard) return;

        const currentGroupMatches = this.matches.filter(match => 
            match.groupIndex === this.currentGroup && match.status === 'completed'
        );

        const groupParticipants = this.tournament.participants.slice(
            this.currentGroup * this.tournament.playersPerGroup,
            (this.currentGroup + 1) * this.tournament.playersPerGroup
        );

        // Calculate standings
        const standings = groupParticipants.map(uid => {
            const participant = this.participants.find(p => p.uid === uid);
            const playerMatches = currentGroupMatches.filter(match => 
                match.player1 === uid || match.player2 === uid
            );

            let wins = 0;
            let losses = 0;
            let pointsFor = 0;
            let pointsAgainst = 0;

            playerMatches.forEach(match => {
                if (match.player1 === uid) {
                    pointsFor += match.player1Score || 0;
                    pointsAgainst += match.player2Score || 0;
                    if (match.winner === uid) wins++;
                    else losses++;
                } else {
                    pointsFor += match.player2Score || 0;
                    pointsAgainst += match.player1Score || 0;
                    if (match.winner === uid) wins++;
                    else losses++;
                }
            });

            return {
                uid,
                participant,
                wins,
                losses,
                pointsFor,
                pointsAgainst,
                pointDifferential: pointsFor - pointsAgainst,
                gamesPlayed: wins + losses
            };
        });

        // Sort by wins, then by point differential
        standings.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.pointDifferential - a.pointDifferential;
        });

        // Render leaderboard
        leaderboard.innerHTML = '';
        standings.forEach((standing, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row fade-in';
            row.style.animationDelay = `${index * 0.1}s`;
            
            const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            
            row.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="leaderboard-rank ${rankClass}">
                        ${rankIcon || (index + 1)}
                    </div>
                    <img src="${standing.participant?.photoURL || 'https://via.placeholder.com/40'}" 
                         alt="${standing.participant?.displayName}" class="participant-avatar w-12 h-12 rounded-full">
                    <div>
                        <div class="font-bold text-white text-lg">
                            ${standing.participant?.displayName || 'שחקן לא ידוע'}
                        </div>
                        <div class="text-sm text-white/70">
                            ${standing.gamesPlayed} משחקים
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-6 text-sm">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-gold">${standing.wins}</div>
                        <div class="text-white/70">ניצחונות</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-white">${standing.losses}</div>
                        <div class="text-white/70">הפסדים</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold ${standing.pointDifferential > 0 ? 'text-gold' : standing.pointDifferential < 0 ? 'text-checker-red' : 'text-white'}">
                            ${standing.pointDifferential > 0 ? '+' : ''}${standing.pointDifferential}
                        </div>
                        <div class="text-white/70">הפרש</div>
                    </div>
                </div>
            `;
            
            leaderboard.appendChild(row);
        });
    }

    async startTournament() {
        if (this.tournament.participants.length < this.tournament.maxParticipants) {
            this.showError('הטורניר זקוק לשחקנים נוספים כדי להתחיל');
            return;
        }

        try {
            await updateDoc(doc(db, 'tournaments', this.tournamentId), {
                status: 'active',
                startedAt: serverTimestamp()
            });

            this.showSuccess('הטורניר התחיל!');
        } catch (error) {
            console.error('Error starting tournament:', error);
            this.showError('התחלת הטורניר נכשלה');
        }
    }

    showSubmitResultModal(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (!match) return;

        const player1 = this.participants.find(p => p.uid === match.player1);
        const player2 = this.participants.find(p => p.uid === match.player2);

        const modal = this.createModal('הגש תוצאת משחק', `
            <form id="submit-result-form" class="space-y-4">
                <div class="text-center mb-4">
                    <div class="flex items-center justify-center gap-4">
                        <div class="text-center">
                            <img src="${player1?.photoURL || 'https://via.placeholder.com/40'}" 
                                 alt="${player1?.displayName}" class="w-12 h-12 rounded-full mx-auto mb-2">
                            <div class="font-medium">${player1?.displayName}</div>
                        </div>
                        <span class="text-2xl text-gray-400">VS</span>
                        <div class="text-center">
                            <img src="${player2?.photoURL || 'https://via.placeholder.com/40'}" 
                                 alt="${player2?.displayName}" class="w-12 h-12 rounded-full mx-auto mb-2">
                            <div class="font-medium">${player2?.displayName}</div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">ניקוד ${player1?.displayName}</label>
                        <input type="number" name="player1Score" class="form-input" min="0" required>
                    </div>
                    <div>
                        <label class="form-label">ניקוד ${player2?.displayName}</label>
                        <input type="number" name="player2Score" class="form-input" min="0" required>
                    </div>
                </div>

                <input type="hidden" name="matchId" value="${matchId}">

                <div class="flex gap-3 pt-4">
                    <button type="submit" class="btn-primary flex-1">הגש תוצאה</button>
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">ביטול</button>
                </div>
            </form>
        `);

        document.getElementById('modals-container').appendChild(modal);
    }

    async handleSubmitResult(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const matchId = formData.get('matchId');
        const player1Score = parseInt(formData.get('player1Score'));
        const player2Score = parseInt(formData.get('player2Score'));

        if (player1Score === player2Score) {
            this.showError('הניקוד לא יכול להיות שווה');
            return;
        }

        try {
            const match = this.matches.find(m => m.id === matchId);
            const winner = player1Score > player2Score ? match.player1 : match.player2;

            await updateDoc(doc(db, 'matches', matchId), {
                player1Score,
                player2Score,
                winner,
                status: 'completed',
                completedAt: serverTimestamp(),
                submittedBy: this.currentUser.uid
            });

            this.showSuccess('התוצאה נשלחה בהצלחה!');
            e.target.closest('.modal-overlay').remove();

        } catch (error) {
            console.error('Error submitting result:', error);
            this.showError('שליחת התוצאה נכשלה');
        }
    }

    filterMatches(filter) {
        // Implementation for filtering matches
        this.renderMatches();
    }

    shareTournament() {
        if (navigator.share) {
            navigator.share({
                title: this.tournament.name,
                text: `Join my Backgammon tournament: ${this.tournament.name}`,
                url: window.location.href
            });
        } else {
            this.copyToClipboard(window.location.href);
            this.showSuccess('קישור הטורניר הועתק ללוח!');
        }
    }

    copyTournamentCode() {
        this.copyToClipboard(this.tournament.code);
        this.showSuccess('קוד הטורניר הועתק ללוח!');
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    }

    createModal(title, content) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn';
        
        overlay.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-slideIn">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${title}</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                ${content}
            </div>
        `;

        // Setup form handlers
        setTimeout(() => {
            const submitForm = overlay.querySelector('#submit-result-form');
            if (submitForm) {
                submitForm.addEventListener('submit', (e) => this.handleSubmitResult(e));
            }
        }, 0);

        return overlay;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 animate-fadeIn ${type === 'success' ? 'alert-success' : 'alert-error'}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    cleanup() {
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
    }
}

// Initialize tournament manager
const tournamentManager = new TournamentManager();

// Make it globally available for onclick handlers
window.tournamentManager = tournamentManager;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    tournamentManager.cleanup();
});