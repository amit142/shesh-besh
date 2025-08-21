import { auth, db } from './firebase-config.js';
import {
    collection,
    doc,
    setDoc,
    addDoc,
    serverTimestamp,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class ChampionshipSetup {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        auth.onAuthStateChanged((user) => {
            const authContainer = document.getElementById('auth-container');
            const setupContainer = document.getElementById('setup-container');
            if (user) {
                this.currentUser = user;
                authContainer.innerHTML = `<p class="text-center text-green-600 dark:text-green-400">Authenticated as ${user.displayName}</p>`;
                setupContainer.classList.remove('hidden');
                document.getElementById('setup-championship-button').addEventListener('click', () => this.setupChampionship());
            } else {
                authContainer.innerHTML = '<p class="text-center text-red-600 dark:text-red-400">You must be logged in to run the setup.</p>';
                setupContainer.classList.add('hidden');
            }
        });
    }

    async setupChampionship() {
        this.showStatus('Starting championship setup...', 'info');
        try {
            // Step 2: Create users
            const users = await this.createUsers();
            this.showStatus('Users created successfully.', 'success');

            // Step 3: Create tournament
            const tournamentId = await this.createTournament(users);
            this.showStatus('Tournament created successfully.', 'success');

            // Step 4: Populate matches
            await this.populateMatches(tournamentId, users);
            this.showStatus('Matches populated successfully.', 'success');

            this.showStatus('Championship setup complete!', 'success');

        } catch (error) {
            this.showStatus(`Error during setup: ${error.message}`, 'error');
            console.error(error);
        }
    }

    async createUsers() {
        this.showStatus('Creating users...', 'info');
        const batch = writeBatch(db);
        const users = [
            { uid: 'amit', name: 'עמית' },
            { uid: 'sahar', name: 'סהר' },
            { uid: 'amitai', name: 'אמיתי' },
            { uid: 'michael', name: 'מיכאל' },
            { uid: 'omer', name: 'עומר' },
            { uid: 'noah', name: 'נח' },
            { uid: 'shiran', name: 'שירן' },
            { uid: 'kfir', name: 'כפיר' }
        ];

        const userObjects = users.map(user => {
            const userRef = doc(db, 'users', user.uid);
            const userData = {
                displayName: user.name,
                email: `${user.uid}@example.com`,
                photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
                createdAt: serverTimestamp()
            };
            batch.set(userRef, userData);
            return { uid: user.uid, displayName: user.name };
        });

        await batch.commit();
        this.showStatus('8 users created successfully.', 'success');
        return userObjects;
    }

    async createTournament(users) {
        this.showStatus('Creating tournament...', 'info');
        const tournamentRef = doc(db, 'tournaments', 'championship-2025');
        const tournamentData = {
            name: 'Backgammon Championship 2025',
            status: 'active', // Set to active as matches are predefined
            participants: users.map(u => u.uid),
            maxParticipants: 8,
            groupCount: 1,
            playersPerGroup: 8,
            code: 'CHAMP25',
            createdBy: this.currentUser.uid,
            createdAt: serverTimestamp(),
            startedAt: serverTimestamp(),
            doubleElimination: false
        };

        await setDoc(tournamentRef, tournamentData);
        this.showStatus('Tournament "Backgammon Championship 2025" created.', 'success');
        return 'championship-2025';
    }

    async populateMatches(tournamentId, users) {
        this.showStatus('Populating matches...', 'info');
        const batch = writeBatch(db);
        const userMap = users.reduce((acc, user) => {
            acc[user.displayName] = user.uid;
            return acc;
        }, {});

        const schedule = [
            { round: 1, dateTime: '24/08/2025 19:00', home: 'עמית', away: 'סהר' },
            { round: 1, dateTime: '24/08/2025 20:15', home: 'אמיתי', away: 'מיכאל' },
            { round: 1, dateTime: '24/08/2025 21:30', home: 'עומר', away: 'נח' },
            { round: 1, dateTime: '24/08/2025 22:45', home: 'שירן', away: 'כפיר' },
            { round: 2, dateTime: '26/08/2025 19:00', home: 'מיכאל', away: 'עמית' },
            { round: 2, dateTime: '26/08/2025 20:15', home: 'נח', away: 'סהר' },
            { round: 2, dateTime: '26/08/2025 21:30', home: 'כפיר', away: 'אמיתי' },
            { round: 2, dateTime: '26/08/2025 22:45', home: 'שירן', away: 'עומר' },
            { round: 3, dateTime: '31/08/2025 19:00', home: 'עמית', away: 'נח' },
            { round: 3, dateTime: '31/08/2025 20:15', home: 'מיכאל', away: 'כפיר' },
            { round: 3, dateTime: '31/08/2025 21:30', home: 'סהר', away: 'שירן' },
            { round: 3, dateTime: '31/08/2025 22:45', home: 'אמיתי', away: 'עומר' },
            { round: 4, dateTime: '02/09/2025 19:00', home: 'כפיר', away: 'עמית' },
            { round: 4, dateTime: '02/09/2025 20:15', home: 'שירן', away: 'נח' },
            { round: 4, dateTime: '02/09/2025 21:30', home: 'עומר', away: 'מיכאל' },
            { round: 4, dateTime: '02/09/2025 22:45', home: 'אמיתי', away: 'סהר' },
            { round: 5, dateTime: '07/09/2025 19:00', home: 'עמית', away: 'שירן' },
            { round: 5, dateTime: '07/09/2025 20:15', home: 'כפיר', away: 'עומר' },
            { round: 5, dateTime: '07/09/2025 21:30', home: 'נח', away: 'אמיתי' },
            { round: 5, dateTime: '07/09/2025 22:45', home: 'מיכאל', away: 'סהר' },
            { round: 6, dateTime: '09/09/2025 19:00', home: 'עומר', away: 'עמית' },
            { round: 6, dateTime: '09/09/2025 20:15', home: 'אמיתי', away: 'שירן' },
            { round: 6, dateTime: '09/09/2025 21:30', home: 'סהר', away: 'כפיר' },
            { round: 6, dateTime: '09/09/2025 22:45', home: 'מיכאל', away: 'נח' },
            { round: 7, dateTime: '14/09/2025 19:00', home: 'עמית', away: 'אמיתי' },
            { round: 7, dateTime: '14/09/2025 20:15', home: 'עומר', away: 'סהר' },
            { round: 7, dateTime: '14/09/2025 21:30', home: 'שירן', away: 'מיכאל' },
            { round: 7, dateTime: '14/09/2025 22:45', home: 'כפיר', away: 'נח' },
            { round: 8, dateTime: '16/09/2025 19:00', home: 'סהר', away: 'עמית' },
            { round: 8, dateTime: '16/09/2025 20:15', home: 'מיכאל', away: 'אמיתי' },
            { round: 8, dateTime: '16/09/2025 21:30', home: 'נח', away: 'עומר' },
            { round: 8, dateTime: '16/09/2025 22:45', home: 'כפיר', away: 'שירן' },
            { round: 9, dateTime: '21/09/2025 19:00', home: 'עמית', away: 'מיכאל' },
            { round: 9, dateTime: '21/09/2025 20:15', home: 'סהר', away: 'נח' },
            { round: 9, dateTime: '21/09/2025 21:30', home: 'אמיתי', away: 'כפיר' },
            { round: 9, dateTime: '21/09/2025 22:45', home: 'עומר', away: 'שירן' },
            { round: 10, dateTime: '23/09/2025 19:00', home: 'נח', away: 'עמית' },
            { round: 10, dateTime: '23/09/2025 20:15', home: 'כפיר', away: 'מיכאל' },
            { round: 10, dateTime: '23/09/2025 21:30', home: 'שירן', away: 'סהר' },
            { round: 10, dateTime: '23/09/2025 22:45', home: 'עומר', away: 'אמיתי' },
            { round: 11, dateTime: '28/09/2025 19:00', home: 'עמית', away: 'כפיר' },
            { round: 11, dateTime: '28/09/2025 20:15', home: 'נח', away: 'שירן' },
            { round: 11, dateTime: '28/09/2025 21:30', home: 'מיכאל', away: 'עומר' },
            { round: 11, dateTime: '28/09/2025 22:45', home: 'סהר', away: 'אמיתי' },
            { round: 12, dateTime: '30/09/2025 19:00', home: 'שירן', away: 'עמית' },
            { round: 12, dateTime: '30/09/2025 20:15', home: 'עומר', away: 'כפיר' },
            { round: 12, dateTime: '30/09/2025 21:30', home: 'אמיתי', away: 'נח' },
            { round: 12, dateTime: '30/09/2025 22:45', home: 'סהר', away: 'מיכאל' },
            { round: 13, dateTime: '05/10/2025 19:00', home: 'עמית', away: 'עומר' },
            { round: 13, dateTime: '05/10/2025 20:15', home: 'שירן', away: 'אמיתי' },
            { round: 13, dateTime: '05/10/2025 21:30', home: 'כפיר', away: 'סהר' },
            { round: 13, dateTime: '05/10/2025 22:45', home: 'נח', away: 'מיכאל' },
            { round: 14, dateTime: '07/10/2025 19:00', home: 'אמיתי', away: 'עמית' },
            { round: 14, dateTime: '07/10/2025 20:15', home: 'סהר', away: 'עומר' },
            { round: 14, dateTime: '07/10/2025 21:30', home: 'מיכאל', away: 'שירן' },
            { round: 14, dateTime: '07/10/2025 22:45', home: 'נח', away: 'כפיר' }
        ];

        schedule.forEach(matchData => {
            const matchRef = doc(collection(db, 'matches'));
            const match = {
                tournamentId: tournamentId,
                groupIndex: 0,
                round: matchData.round,
                player1: userMap[matchData.home],
                player2: userMap[matchData.away],
                status: 'pending',
                scheduledAt: this.parseDateTime(matchData.dateTime),
                createdAt: serverTimestamp()
            };
            batch.set(matchRef, match);
        });

        await batch.commit();
        this.showStatus(`${schedule.length} matches created successfully.`, 'success');
    }

    parseDateTime(dateTimeString) {
        const [datePart, timePart] = dateTimeString.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hours, minutes] = timePart.split(':');
        // Note: month is 0-indexed in JavaScript Date
        return new Date(year, month - 1, day, hours, minutes);
    }

    showStatus(message, type) {
        const statusContainer = document.getElementById('setup-status');
        const statusMessage = document.createElement('div');
        let bgColor = 'bg-gray-500';
        if (type === 'success') bgColor = 'bg-green-500';
        if (type === 'error') bgColor = 'bg-red-500';
        if (type === 'info') bgColor = 'bg-blue-500';

        statusMessage.className = `${bgColor} text-white p-3 rounded-lg mb-2`;
        statusMessage.textContent = message;
        statusContainer.appendChild(statusMessage);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChampionshipSetup();
});
