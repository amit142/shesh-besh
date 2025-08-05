// Utility functions for the tournament app

export class Utils {
    // Generate a random tournament code
    static generateTournamentCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Format date for display
    static formatDate(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    }

    // Format relative time (e.g., "2 hours ago")
    static formatRelativeTime(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return this.formatDate(timestamp);
    }

    // Copy text to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    }

    // Generate QR code URL
    static generateQRCodeURL(text, size = 200) {
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    }

    // Validate tournament settings
    static validateTournamentSettings(settings) {
        const errors = [];

        if (!settings.name || settings.name.trim().length < 3) {
            errors.push('Tournament name must be at least 3 characters long');
        }

        if (!settings.groupCount || settings.groupCount < 1 || settings.groupCount > 8) {
            errors.push('Number of groups must be between 1 and 8');
        }

        if (!settings.playersPerGroup || settings.playersPerGroup < 3 || settings.playersPerGroup > 12) {
            errors.push('Players per group must be between 3 and 12');
        }

        const totalPlayers = settings.groupCount * settings.playersPerGroup;
        if (totalPlayers > 48) {
            errors.push('Total tournament size cannot exceed 48 players');
        }

        return errors;
    }

    // Calculate tournament statistics
    static calculateTournamentStats(tournament, matches, participants) {
        const stats = {
            totalMatches: 0,
            completedMatches: 0,
            pendingMatches: 0,
            totalPoints: 0,
            averageScore: 0,
            topScorer: null,
            mostWins: null,
            completionRate: 0
        };

        if (!matches || matches.length === 0) return stats;

        stats.totalMatches = matches.length;
        stats.completedMatches = matches.filter(m => m.status === 'completed').length;
        stats.pendingMatches = matches.filter(m => m.status === 'pending').length;
        stats.completionRate = Math.round((stats.completedMatches / stats.totalMatches) * 100);

        const completedMatches = matches.filter(m => m.status === 'completed');
        
        if (completedMatches.length > 0) {
            // Calculate total points
            stats.totalPoints = completedMatches.reduce((sum, match) => {
                return sum + (match.player1Score || 0) + (match.player2Score || 0);
            }, 0);

            stats.averageScore = Math.round(stats.totalPoints / (completedMatches.length * 2));

            // Calculate player statistics
            const playerStats = {};
            
            completedMatches.forEach(match => {
                // Initialize player stats if not exists
                if (!playerStats[match.player1]) {
                    playerStats[match.player1] = { wins: 0, losses: 0, points: 0, matches: 0 };
                }
                if (!playerStats[match.player2]) {
                    playerStats[match.player2] = { wins: 0, losses: 0, points: 0, matches: 0 };
                }

                // Update stats
                playerStats[match.player1].points += match.player1Score || 0;
                playerStats[match.player1].matches++;
                playerStats[match.player2].points += match.player2Score || 0;
                playerStats[match.player2].matches++;

                if (match.winner === match.player1) {
                    playerStats[match.player1].wins++;
                    playerStats[match.player2].losses++;
                } else {
                    playerStats[match.player2].wins++;
                    playerStats[match.player1].losses++;
                }
            });

            // Find top scorer and most wins
            let topScorerUid = null;
            let topScore = 0;
            let mostWinsUid = null;
            let mostWinsCount = 0;

            Object.entries(playerStats).forEach(([uid, stats]) => {
                if (stats.points > topScore) {
                    topScore = stats.points;
                    topScorerUid = uid;
                }
                if (stats.wins > mostWinsCount) {
                    mostWinsCount = stats.wins;
                    mostWinsUid = uid;
                }
            });

            if (topScorerUid && participants) {
                stats.topScorer = {
                    player: participants.find(p => p.uid === topScorerUid),
                    points: topScore
                };
            }

            if (mostWinsUid && participants) {
                stats.mostWins = {
                    player: participants.find(p => p.uid === mostWinsUid),
                    wins: mostWinsCount
                };
            }
        }

        return stats;
    }

    // Generate round-robin schedule
    static generateRoundRobinSchedule(players) {
        const matches = [];
        
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                matches.push({
                    player1: players[i],
                    player2: players[j]
                });
            }
        }

        return matches;
    }

    // Shuffle array (Fisher-Yates algorithm)
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Create notification element
    static createNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 animate-fadeIn max-w-sm ${
            type === 'success' ? 'alert-success' : 
            type === 'error' ? 'alert-error' : 
            'alert-info'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                    ${type === 'success' ? `
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                    ` : type === 'error' ? `
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                    ` : `
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                        </svg>
                    `}
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 p-1 rounded hover:bg-black/10">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }
        
        return notification;
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Local storage helpers
    static setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    static getLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    // Animation helpers
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    static fadeOut(element, duration = 300) {
        const start = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity);
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = startOpacity * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    }

    // Validation helpers
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static sanitizeString(str) {
        return str.replace(/[<>]/g, '');
    }

    // Tournament bracket helpers
    static generateBracket(players, doubleElimination = false) {
        const bracket = {
            rounds: [],
            doubleElimination,
            winners: [],
            losers: doubleElimination ? [] : null
        };

        // Calculate number of rounds needed
        const numPlayers = players.length;
        const numRounds = Math.ceil(Math.log2(numPlayers));

        // Generate winner's bracket
        let currentRound = [...players];
        
        for (let round = 0; round < numRounds; round++) {
            const matches = [];
            const nextRound = [];

            for (let i = 0; i < currentRound.length; i += 2) {
                if (i + 1 < currentRound.length) {
                    matches.push({
                        player1: currentRound[i],
                        player2: currentRound[i + 1],
                        winner: null,
                        status: 'pending'
                    });
                    nextRound.push(null); // Placeholder for winner
                } else {
                    // Bye - player advances automatically
                    nextRound.push(currentRound[i]);
                }
            }

            bracket.rounds.push({
                roundNumber: round + 1,
                matches,
                type: 'winners'
            });

            currentRound = nextRound;
        }

        return bracket;
    }
}

// Export individual functions for convenience
export const {
    generateTournamentCode,
    formatDate,
    formatRelativeTime,
    copyToClipboard,
    generateQRCodeURL,
    validateTournamentSettings,
    calculateTournamentStats,
    generateRoundRobinSchedule,
    shuffleArray,
    createNotification,
    debounce,
    throttle,
    setLocalStorage,
    getLocalStorage,
    fadeIn,
    fadeOut,
    isValidEmail,
    sanitizeString,
    generateBracket
} = Utils;