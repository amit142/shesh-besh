// Backgammon Arena Theme Management
class BackgammonThemeManager {
    constructor() {
        this.init();
        this.setupAnimations();
    }

    init() {
        // Check for saved theme preference or default to system preference
        const savedTheme = localStorage.getItem('backgammon-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else if (systemPrefersDark) {
            this.setTheme('dark');
        } else {
            this.setTheme('light');
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('backgammon-theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Setup theme toggle button
        this.setupToggle();
        
        // Initialize dice animations
        this.initializeDiceAnimations();
    }

    setTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.classList.add('dark');
            this.updateToggleIcon(true);
            this.playThemeTransition('dark');
        } else {
            root.classList.remove('dark');
            this.updateToggleIcon(false);
            this.playThemeTransition('light');
        }
        
        localStorage.setItem('backgammon-theme', theme);
        
        // Update CSS custom properties for smooth transition
        this.updateThemeProperties(theme);
    }

    updateThemeProperties(theme) {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            // Cool wood theme for dark mode
            root.style.setProperty('--theme-transition', 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)');
        } else {
            // Warm wood theme for light mode
            root.style.setProperty('--theme-transition', 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)');
        }
    }

    playThemeTransition(theme) {
        // Create a visual transition effect
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 pointer-events-none z-50';
        overlay.style.background = theme === 'dark' 
            ? 'radial-gradient(circle at center, rgba(44, 62, 80, 0.8) 0%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(139, 69, 19, 0.8) 0%, transparent 70%)';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s ease-in-out';
        
        document.body.appendChild(overlay);
        
        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        
        // Animate out and remove
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 500);
        }, 300);
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        this.setTheme(isDark ? 'light' : 'dark');
        
        // Play dice roll animation on theme change
        this.playDiceRollAnimation();
    }

    updateToggleIcon(isDark) {
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        
        if (sunIcon && moonIcon) {
            if (isDark) {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            } else {
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            }
        }
    }

    setupToggle() {
        const toggleButton = document.getElementById('theme-toggle');
        if (toggleButton) {
            // Add hover effect
            toggleButton.addEventListener('mouseenter', () => {
                toggleButton.style.transform = 'scale(1.1) rotate(10deg)';
            });
            
            toggleButton.addEventListener('mouseleave', () => {
                toggleButton.style.transform = 'scale(1) rotate(0deg)';
            });
            
            toggleButton.addEventListener('click', () => {
                // Add click animation
                toggleButton.style.transform = 'scale(0.9) rotate(-10deg)';
                setTimeout(() => {
                    toggleButton.style.transform = 'scale(1.1) rotate(10deg)';
                }, 100);
                
                this.toggleTheme();
            });
        }
    }

    initializeDiceAnimations() {
        // Initialize all dice on the page
        const dice = document.querySelectorAll('.dice');
        dice.forEach((die, index) => {
            this.setupDiceElement(die, index);
        });
        
        // Setup periodic dice animations
        this.startPeriodicDiceAnimations();
    }

    setupDiceElement(die, index) {
        // Set random dice face
        const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const randomFace = faces[Math.floor(Math.random() * faces.length)];
        
        if (die.querySelector('::before')) {
            die.style.setProperty('--dice-face', `"${randomFace}"`);
        } else {
            die.setAttribute('data-face', randomFace);
            die.innerHTML = randomFace;
        }
        
        // Add click handler for individual dice
        die.addEventListener('click', () => {
            this.rollSingleDice(die);
        });
        
        // Add hover effect
        die.addEventListener('mouseenter', () => {
            die.style.transform = 'scale(1.1) rotate(5deg)';
        });
        
        die.addEventListener('mouseleave', () => {
            die.style.transform = 'scale(1) rotate(0deg)';
        });
    }

    rollSingleDice(die) {
        die.classList.add('rolling');
        
        // Change face during animation
        setTimeout(() => {
            const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            const randomFace = faces[Math.floor(Math.random() * faces.length)];
            die.innerHTML = randomFace;
        }, 500);
        
        // Remove animation class
        setTimeout(() => {
            die.classList.remove('rolling');
        }, 1000);
    }

    playDiceRollAnimation() {
        const dice = document.querySelectorAll('.dice');
        dice.forEach((die, index) => {
            setTimeout(() => {
                this.rollSingleDice(die);
            }, index * 100);
        });
    }

    startPeriodicDiceAnimations() {
        // Animate floating dice periodically
        setInterval(() => {
            const floatingDice = document.querySelectorAll('.floating-dice');
            floatingDice.forEach((die, index) => {
                setTimeout(() => {
                    if (Math.random() > 0.7) { // 30% chance
                        this.rollSingleDice(die);
                    }
                }, index * 200);
            });
        }, 10000); // Every 10 seconds
    }

    setupAnimations() {
        // Setup intersection observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements that should fade in
        document.addEventListener('DOMContentLoaded', () => {
            const elementsToAnimate = document.querySelectorAll('.game-card, .tournament-card, .match-card-enhanced');
            elementsToAnimate.forEach(el => {
                observer.observe(el);
            });
        });
    }

    // Utility method to create notification with backgammon theme
    static createNotification(message, type = 'info') {
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
        
        return notification;
    }

    // Method to add backgammon-themed loading animation
    static createLoadingDice(container) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-dice';
        loadingDiv.innerHTML = `
            <div class="dice rolling" style="--i: 0;"></div>
            <div class="dice rolling" style="--i: 1;"></div>
            <span class="mr-3 text-wood-medium font-semibold">טוען...</span>
        `;
        
        if (container) {
            container.appendChild(loadingDiv);
        }
        
        return loadingDiv;
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.backgammonTheme = new BackgammonThemeManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgammonThemeManager;
}