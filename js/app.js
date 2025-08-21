// Main application logic
import { auth, db, connectionUtils } from './firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import authManager from './auth.js';

class TournamentApp {
    constructor() {
        this.currentUser = null;
        this.tournaments = [];
        this.unsubscribers = [];
        this.init();
    }

    init() {
        // Wait for auth state to be determined
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.setupUI();
                this.loadTournaments();
            } else {
                // Redirect to login if not authenticated
                window.location.href = 'index.html';
            }
        });
    }

    setupUI() {
        // Update user info in header
        this.updateUserInfo();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup user menu
        this.setupUserMenu();
    }

    updateUserInfo() {
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const welcomeMessage = document.getElementById('welcome-message');

        if (this.currentUser) {
            userAvatar.src = this.currentUser.photoURL || 'https://via.placeholder.com/32';
            userName.textContent = this.currentUser.displayName || 'User';
            welcomeMessage.textContent = `ברוכים השבים, ${this.currentUser.displayName?.split(' ')[0] || 'משתמש'}!`;
        }
    }

    setupEventListeners() {
        // Create tournament
        document.getElementById('create-tournament-card').addEventListener('click', () => {
            this.showCreateTournamentModal();
        });

        // Join tournament
        document.getElementById('join-tournament-card').addEventListener('click', () => {
            this.showJoinTournamentModal();
        });

        // Refresh tournaments
        document.getElementById('refresh-tournaments').addEventListener('click', () => {
            this.loadTournaments();
        });
    }

    setupUserMenu() {
        const userMenuButton = document.getElementById('user-menu-button');
        const userMenu = document.getElementById('user-menu');
        const signOutButton = document.getElementById('sign-out');
        const profileSettingsButton = document.getElementById('profile-settings');

        // Toggle user menu
        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            userMenu.classList.add('hidden');
        });

        // Sign out
        signOutButton.addEventListener('click', () => {
            authManager.signOut();
        });

        // Profile settings (placeholder)
        profileSettingsButton.addEventListener('click', () => {
            this.showProfileModal();
            userMenu.classList.add('hidden');
        });
    }

    async loadTournaments() {
        const tournamentsLoading = document.getElementById('tournaments-loading');
        const tournamentsEmpty = document.getElementById('tournaments-empty');
        const tournamentsList = document.getElementById('tournaments-list');

        // Show loading state
        if (tournamentsLoading) tournamentsLoading.classList.remove('hidden');
        if (tournamentsEmpty) tournamentsEmpty.classList.add('hidden');

        try {
            const tournamentsRef = collection(db, 'tournaments');
            const q = query(
                tournamentsRef,
                where('participants', 'array-contains', this.currentUser.uid),
                orderBy('createdAt', 'desc')
            );

            // Try to get data once first
            const snapshot = await getDocs(q);
            this.tournaments = [];
            snapshot.forEach((doc) => {
                this.tournaments.push({ id: doc.id, ...doc.data() });
            });

            this.renderTournaments();

            // If successful, set up real-time listener
            const unsubscribe = onSnapshot(q, (snapshot) => {
                this.tournaments = [];
                snapshot.forEach((doc) => {
                    this.tournaments.push({ id: doc.id, ...doc.data() });
                });
                this.renderTournaments();
            }, (error) => {
                console.error('Real-time listener error:', error);
                // Continue with cached data, don't show error to user
            });

            this.unsubscribers.push(unsubscribe);

        } catch (error) {
            console.error('Error loading tournaments:', error);
            this.showError('שגיאה בטעינת הטורנירים. אנא בדקו את החיבור לאינטרנט ונסו שוב.');
            
            // Hide loading state
            if (tournamentsLoading) tournamentsLoading.classList.add('hidden');
            if (tournamentsEmpty) tournamentsEmpty.classList.remove('hidden');
        }
    }



    renderTournaments() {
        const tournamentsLoading = document.getElementById('tournaments-loading');
        const tournamentsEmpty = document.getElementById('tournaments-empty');
        const tournamentsList = document.getElementById('tournaments-list');

        // Hide loading
        if (tournamentsLoading) tournamentsLoading.classList.add('hidden');

        if (this.tournaments.length === 0) {
            if (tournamentsEmpty) tournamentsEmpty.classList.remove('hidden');
            return;
        }

        if (tournamentsEmpty) tournamentsEmpty.classList.add('hidden');

        // Clear existing tournaments (except loading and empty states)
        const existingTournaments = tournamentsList.querySelectorAll('.tournament-item');
        existingTournaments.forEach(item => item.remove());

        // Render tournaments
        this.tournaments.forEach((tournament, index) => {
            const tournamentElement = this.createTournamentElement(tournament);
            tournamentElement.style.animationDelay = `${index * 0.1}s`;
            tournamentElement.classList.add('fade-in');
            tournamentsList.appendChild(tournamentElement);
        });
    }

    createTournamentElement(tournament) {
        const div = document.createElement('div');
        div.className = 'tournament-item tournament-card cursor-pointer fade-in';
        div.onclick = () => this.openTournament(tournament.id);

        const statusClass = this.getTournamentStatusClass(tournament.status);
        const statusText = this.getTournamentStatusText(tournament.status);
        const participantCount = tournament.participants?.length || 0;
        const maxParticipants = tournament.maxParticipants || 0;
        const isAdmin = tournament.createdBy === this.currentUser.uid;

        div.innerHTML = `
            <div class="tournament-header">
                <div class="tournament-status">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="text-center">
                    <h4 class="text-xl font-bold text-white mb-1">${tournament.name}</h4>
                    <div class="text-sm text-white/70">
                        ${participantCount}/${maxParticipants} שחקנים
                        ${isAdmin ? ' • מנהל' : ''}
                    </div>
                </div>
            </div>
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="dice" style="width: 32px; height: 32px;"></div>
                        <div>
                            <div class="text-sm text-text-secondary">קוד טורניר</div>
                            <div class="font-mono font-bold text-wood-dark">${tournament.code}</div>
                        </div>
                    </div>
                    <div class="text-left">
                        <div class="text-sm text-text-secondary">נוצר</div>
                        <div class="text-wood-dark font-semibold">${this.formatDate(tournament.createdAt)}</div>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div class="progress-bar mb-4">
                    <div class="progress-fill" style="width: ${(participantCount / maxParticipants) * 100}%"></div>
                </div>
                
                <!-- Participants Preview -->
                <div class="flex items-center gap-2 mb-4">
                    ${this.createParticipantsPreview(tournament.participants?.slice(0, 4) || [])}
                    ${participantCount > 4 ? `<div class="text-sm text-text-secondary">+${participantCount - 4} נוספים</div>` : ''}
                </div>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="checker red" style="width: 20px; height: 20px;"></div>
                        <div class="checker black" style="width: 20px; height: 20px;"></div>
                        <span class="text-sm text-felt-green font-semibold">מוכן למשחק</span>
                    </div>
                    <svg class="w-5 h-5 text-wood-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </div>
            </div>
        `;

        return div;
    }

    getTournamentStatusClass(status) {
        switch (status) {
            case 'setup': return 'status-setup';
            case 'active': return 'status-active';
            case 'completed': return 'status-completed';
            default: return 'status-setup';
        }
    }

    getTournamentStatusText(status) {
        switch (status) {
            case 'setup': return 'הגדרה';
            case 'active': return 'פעיל';
            case 'completed': return 'הושלם';
            default: return 'הגדרה';
        }
    }

    createParticipantsPreview(participants) {
        return participants.map(uid => {
            // Get player display name
            let displayName = 'משתמש';
            if (uid === this.currentUser.uid) {
                displayName = this.currentUser.displayName || 'אתה';
            }
            
            const initial = displayName.charAt(0).toUpperCase();
            const colors = ['from-gold to-checker-red', 'from-felt-green to-felt-light', 'from-wood-medium to-wood-dark'];
            const colorClass = colors[participants.indexOf(uid) % colors.length];
            
            return `<div class="participant-avatar w-8 h-8 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-xs font-bold" title="${displayName}">${initial}</div>`;
        }).join('');
    }

    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    }

    showCreateTournamentModal() {
        const modal = this.createModal('צור טורניר', this.getCreateTournamentForm());
        document.getElementById('modals-container').appendChild(modal);
    }

    getCreateTournamentForm() {
        return `
            <form id="create-tournament-form" class="space-y-4">
                <div>
                    <label class="form-label">שם הטורניר</label>
                    <input type="text" name="name" class="form-input" placeholder="הכנס שם טורניר" required>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">מספר קבוצות</label>
                        <select name="groupCount" class="form-input" required>
                            <option value="1">קבוצה 1</option>
                            <option value="2">2 קבוצות</option>
                            <option value="4">4 קבוצות</option>
                            <option value="8">8 קבוצות</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">שחקנים בקבוצה</label>
                        <select name="playersPerGroup" class="form-input" required>
                            <option value="4">4 שחקנים</option>
                            <option value="6">6 שחקנים</option>
                            <option value="8">8 שחקנים</option>
                        </select>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <input type="checkbox" id="doubleElimination" name="doubleElimination" class="rounded">
                    <label for="doubleElimination" class="text-sm text-gray-700 dark:text-gray-300">אפשר הדחה כפולה</label>
                </div>

                <div class="flex gap-3 pt-4">
                    <button type="submit" class="btn-primary flex-1">צור טורניר</button>
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">ביטול</button>
                </div>
            </form>
        `;
    }

    showJoinTournamentModal() {
        const modal = this.createModal('הצטרף לטורניר', this.getJoinTournamentForm());
        document.getElementById('modals-container').appendChild(modal);
    }

    getJoinTournamentForm() {
        return `
            <form id="join-tournament-form" class="space-y-4">
                <div>
                    <label class="form-label">קוד הטורניר</label>
                    <input type="text" name="code" class="form-input" placeholder="הכנס קוד טורניר" required>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">בקש את הקוד מיוצר הטורניר</p>
                </div>

                <div class="flex gap-3 pt-4">
                    <button type="submit" class="btn-primary flex-1">הצטרף לטורניר</button>
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">ביטול</button>
                </div>
            </form>
        `;
    }

    showProfileModal() {
        const modal = this.createModal('הגדרות פרופיל', this.getProfileForm());
        document.getElementById('modals-container').appendChild(modal);
    }

    getProfileForm() {
        return `
            <form id="profile-form" class="space-y-4">
                <div class="text-center mb-6">
                    <img src="${this.currentUser.photoURL}" alt="Profile" class="w-20 h-20 rounded-full mx-auto mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${this.currentUser.displayName}</h3>
                    <p class="text-gray-600 dark:text-gray-400">${this.currentUser.email}</p>
                </div>

                <div>
                    <label class="form-label">שם תצוגה</label>
                    <input type="text" name="displayName" class="form-input" value="${this.currentUser.displayName}" required>
                </div>

                <div class="flex gap-3 pt-4">
                    <button type="submit" class="btn-primary flex-1">שמור שינויים</button>
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">ביטול</button>
                </div>
            </form>
        `;
    }

    createModal(title, content) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        overlay.innerHTML = `
            <div class="modal-content">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-2xl font-bold" style="color: var(--wood-dark);">${title}</h3>
                    <button onclick="this.closest('.modal-overlay').remove()" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <svg class="w-5 h-5" style="color: var(--text-secondary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                ${content}
            </div>
        `;

        // Setup form handlers
        setTimeout(() => {
            this.setupModalHandlers(overlay);
        }, 0);

        return overlay;
    }

    setupModalHandlers(modal) {
        const createForm = modal.querySelector('#create-tournament-form');
        const joinForm = modal.querySelector('#join-tournament-form');
        const profileForm = modal.querySelector('#profile-form');

        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateTournament(e));
        }

        if (joinForm) {
            joinForm.addEventListener('submit', (e) => this.handleJoinTournament(e));
        }

        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }
    }

    async handleCreateTournament(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const tournament = {
                name: formData.get('name'),
                groupCount: parseInt(formData.get('groupCount')),
                playersPerGroup: parseInt(formData.get('playersPerGroup')),
                doubleElimination: formData.get('doubleElimination') === 'on',
                createdBy: this.currentUser.uid,
                createdAt: serverTimestamp(),
                status: 'setup',
                participants: [this.currentUser.uid],
                maxParticipants: parseInt(formData.get('groupCount')) * parseInt(formData.get('playersPerGroup')),
                code: this.generateTournamentCode()
            };

            await addDoc(collection(db, 'tournaments'), tournament);
            
            this.showSuccess('הטורניר נוצר בהצלחה!');
            e.target.closest('.modal-overlay').remove();
            
        } catch (error) {
            console.error('Error creating tournament:', error);
            this.showError('יצירת הטורניר נכשלה. אנא בדקו את החיבור לאינטרנט ונסו שוב.');
        }
    }

    async handleJoinTournament(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const code = formData.get('code').toUpperCase();
        
        try {
            // Find tournament by code
            const tournamentsRef = collection(db, 'tournaments');
            const q = query(tournamentsRef, where('code', '==', code));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                this.showError('הטורניר לא נמצא');
                return;
            }

            const tournamentDoc = snapshot.docs[0];
            const tournament = tournamentDoc.data();
            
            // Check if user is already in tournament
            if (tournament.participants.includes(this.currentUser.uid)) {
                this.showError('אתה כבר משתתף בטורניר זה');
                return;
            }

            // Check if tournament is full
            if (tournament.participants.length >= tournament.maxParticipants) {
                this.showError('הטורניר מלא');
                return;
            }

            // Add user to tournament
            await updateDoc(doc(db, 'tournaments', tournamentDoc.id), {
                participants: [...tournament.participants, this.currentUser.uid]
            });

            this.showSuccess('הצטרפת לטורניר בהצלחה!');
            e.target.closest('.modal-overlay').remove();
            
        } catch (error) {
            console.error('Error joining tournament:', error);
            this.showError('ההצטרפות לטורניר נכשלה. אנא בדקו את החיבור לאינטרנט ונסו שוב.');
            this.showError('ההצטרפות לטורניר נכשלה');
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        // Profile update logic would go here
        this.showSuccess('הפרופיל עודכן בהצלחה!');
        e.target.closest('.modal-overlay').remove();
    }

    generateTournamentCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    openTournament(tournamentId) {
        // Navigate to tournament view
        window.location.href = `tournament.html?id=${tournamentId}`;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? '🎯' : type === 'error' ? '❌' : 'ℹ️';
        
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">${icon}</span>
                <span class="font-semibold">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    cleanup() {
        // Unsubscribe from all listeners
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
        this.unsubscribers = [];
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TournamentApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.tournamentApp) {
        window.tournamentApp.cleanup();
    }
});