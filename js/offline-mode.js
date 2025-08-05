// Offline mode for testing without Firebase
export class OfflineMode {
    constructor() {
        this.tournaments = [
            {
                id: 'demo-1',
                name: 'טורניר המשרד הראשון',
                status: 'active',
                participants: ['user1', 'user2', 'user3', 'user4'],
                maxParticipants: 8,
                groupCount: 2,
                playersPerGroup: 4,
                code: 'DEMO01',
                createdBy: 'user1',
                createdAt: new Date()
            },
            {
                id: 'demo-2',
                name: 'אליפות שש בש 2025',
                status: 'setup',
                participants: ['user1', 'user2'],
                maxParticipants: 6,
                groupCount: 1,
                playersPerGroup: 6,
                code: 'CHAMP5',
                createdBy: 'user2',
                createdAt: new Date()
            }
        ];
        
        this.matches = [
            {
                id: 'match-1',
                tournamentId: 'demo-1',
                groupIndex: 0,
                player1: 'user1',
                player2: 'user2',
                status: 'completed',
                player1Score: 15,
                player2Score: 12,
                winner: 'user1'
            },
            {
                id: 'match-2',
                tournamentId: 'demo-1',
                groupIndex: 0,
                player1: 'user3',
                player2: 'user4',
                status: 'pending'
            }
        ];
        
        this.users = {
            'user1': { displayName: 'אלי כהן', photoURL: 'https://ui-avatars.com/api/?name=אלי+כהן&background=3b82f6&color=fff' },
            'user2': { displayName: 'שרה לוי', photoURL: 'https://ui-avatars.com/api/?name=שרה+לוי&background=dc3545&color=fff' },
            'user3': { displayName: 'דוד ישראל', photoURL: 'https://ui-avatars.com/api/?name=דוד+ישראל&background=28a745&color=fff' },
            'user4': { displayName: 'מירי אברהם', photoURL: 'https://ui-avatars.com/api/?name=מירי+אברהם&background=ffc107&color=000' }
        };
    }
    
    // Simulate Firebase methods
    async getTournaments(userId = 'user1') {
        return new Promise((resolve) => {
            setTimeout(() => {
                const userTournaments = this.tournaments.filter(t => 
                    t.participants.includes(userId)
                );
                resolve(userTournaments);
            }, 500);
        });
    }
    
    async getTournament(id) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const tournament = this.tournaments.find(t => t.id === id);
                resolve(tournament);
            }, 300);
        });
    }
    
    async getMatches(tournamentId) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const tournamentMatches = this.matches.filter(m => 
                    m.tournamentId === tournamentId
                );
                resolve(tournamentMatches);
            }, 300);
        });
    }
    
    async getUser(uid) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.users[uid] || { displayName: 'משתמש לא ידוע', photoURL: 'https://via.placeholder.com/40' });
            }, 100);
        });
    }
    
    async createTournament(tournament) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newTournament = {
                    ...tournament,
                    id: 'demo-' + Date.now(),
                    createdAt: new Date()
                };
                this.tournaments.push(newTournament);
                resolve(newTournament);
            }, 500);
        });
    }
    
    async joinTournament(tournamentId, userId) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const tournament = this.tournaments.find(t => t.id === tournamentId);
                if (!tournament) {
                    reject(new Error('Tournament not found'));
                    return;
                }
                
                if (tournament.participants.includes(userId)) {
                    reject(new Error('Already in tournament'));
                    return;
                }
                
                if (tournament.participants.length >= tournament.maxParticipants) {
                    reject(new Error('Tournament is full'));
                    return;
                }
                
                tournament.participants.push(userId);
                resolve(tournament);
            }, 500);
        });
    }
    
    async submitMatchResult(matchId, player1Score, player2Score, winner, submittedBy) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const match = this.matches.find(m => m.id === matchId);
                if (match) {
                    match.player1Score = player1Score;
                    match.player2Score = player2Score;
                    match.winner = winner;
                    match.status = 'completed';
                    match.submittedBy = submittedBy;
                }
                resolve(match);
            }, 500);
        });
    }
}

// Create global offline mode instance
window.offlineMode = new OfflineMode();