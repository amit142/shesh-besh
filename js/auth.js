// Authentication management
import { auth } from './firebase-config.js';
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

class AuthManager {
    constructor() {
        this.provider = new GoogleAuthProvider();
        this.currentUser = null;
        this.init();
    }

    init() {
        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.handleAuthStateChange(user);
        });

        // Setup sign-in button
        this.setupSignInButton();
    }

    setupSignInButton() {
        const googleSignInButton = document.getElementById('google-signin');
        const emailSignInButton = document.getElementById('email-signin');
        const showSignUpButton = document.getElementById('show-signup');
        const showSignInButton = document.getElementById('show-signin');
        const loadingElement = document.getElementById('loading');

        // Google Sign-In
        if (googleSignInButton) {
            googleSignInButton.addEventListener('click', async () => {
                try {
                    this.showLoading(true);
                    await this.signInWithGoogle();
                } catch (error) {
                    console.error('Google sign-in error:', error);
                    this.showError('Failed to sign in with Google. Please try again.');
                    this.showLoading(false);
                }
            });
        }

        // Google Sign-Up (same as sign-in for Google)
        const googleSignUpButton = document.getElementById('google-signup');
        if (googleSignUpButton) {
            googleSignUpButton.addEventListener('click', async () => {
                try {
                    this.showLoading(true);
                    await this.signInWithGoogle();
                } catch (error) {
                    console.error('Google sign-up error:', error);
                    this.showError('Failed to sign up with Google. Please try again.');
                    this.showLoading(false);
                }
            });
        }

        // Email Sign-In Form
        const signInForm = document.getElementById('signin-form');
        if (signInForm) {
            signInForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const email = formData.get('email');
                const password = formData.get('password');

                try {
                    this.showLoading(true);
                    await this.signInWithEmail(email, password);
                } catch (error) {
                    console.error('Email sign-in error:', error);
                    this.showError(this.getAuthErrorMessage(error.code));
                    this.showLoading(false);
                }
            });
        }

        // Email Sign-Up Form
        const signUpForm = document.getElementById('signup-form');
        if (signUpForm) {
            signUpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const email = formData.get('email');
                const password = formData.get('password');
                const confirmPassword = formData.get('confirmPassword');
                const displayName = formData.get('displayName');

                if (password !== confirmPassword) {
                    this.showError('הסיסמאות אינן תואמות');
                    return;
                }

                if (password.length < 6) {
                    this.showError('הסיסמה חייבת להיות באורך של לפחות 6 תווים');
                    return;
                }

                try {
                    this.showLoading(true);
                    await this.signUpWithEmail(email, password, displayName);
                } catch (error) {
                    console.error('Email sign-up error:', error);
                    this.showError(this.getAuthErrorMessage(error.code));
                    this.showLoading(false);
                }
            });
        }

        // Toggle between sign-in and sign-up
        if (showSignUpButton) {
            showSignUpButton.addEventListener('click', () => {
                this.toggleAuthMode('signup');
            });
        }

        if (showSignInButton) {
            showSignInButton.addEventListener('click', () => {
                this.toggleAuthMode('signin');
            });
        }
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, this.provider);
            const user = result.user;
            
            // Store user info in localStorage for quick access
            localStorage.setItem('userInfo', JSON.stringify({
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL
            }));

            // Create/update user profile in Firestore
            await this.createUserProfile(user);

            return user;
        } catch (error) {
            throw error;
        }
    }

    async createUserProfile(user) {
        try {
            const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('./firebase-config.js');
            
            await setDoc(doc(db, 'users', user.uid), {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                lastLoginAt: new Date(),
                createdAt: new Date()
            }, { merge: true });
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    }

    async signOut() {
        try {
            await signOut(auth);
            localStorage.removeItem('userInfo');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Sign-out error:', error);
        }
    }

    handleAuthStateChange(user) {
        if (user) {
            // User is signed in
            console.log('User signed in:', user.displayName);
            
            // Redirect to main app if on landing page
            if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
                window.location.href = 'app.html';
            }
        } else {
            // User is signed out
            console.log('User signed out');
            
            // Redirect to landing page if not already there
            if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                window.location.href = 'index.html';
            }
        }
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 alert-error z-50 animate-fadeIn';
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    async signInWithEmail(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const user = result.user;
            
            // Store user info in localStorage for quick access
            localStorage.setItem('userInfo', JSON.stringify({
                uid: user.uid,
                displayName: user.displayName || user.email.split('@')[0],
                email: user.email,
                photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=3b82f6&color=fff`
            }));

            // Update user profile in Firestore
            await this.createUserProfile(user);

            return user;
        } catch (error) {
            throw error;
        }
    }

    async signUpWithEmail(email, password, displayName) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;

            // Update the user's display name
            await updateProfile(user, {
                displayName: displayName,
                photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`
            });

            // Store user info in localStorage for quick access
            localStorage.setItem('userInfo', JSON.stringify({
                uid: user.uid,
                displayName: displayName,
                email: user.email,
                photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`
            }));

            // Create user profile in Firestore
            await this.createUserProfile({
                ...user,
                displayName: displayName,
                photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`
            });

            return user;
        } catch (error) {
            throw error;
        }
    }

    toggleAuthMode(mode) {
        const signInCard = document.getElementById('signin-card');
        const signUpCard = document.getElementById('signup-card');

        if (mode === 'signup') {
            signInCard.classList.add('hidden');
            signUpCard.classList.remove('hidden');
        } else {
            signUpCard.classList.add('hidden');
            signInCard.classList.remove('hidden');
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        const googleButton = document.getElementById('google-signin');
        const authForms = document.querySelectorAll('#signin-form, #signup-form');

        if (show) {
            loadingElement.classList.remove('hidden');
            if (googleButton) googleButton.style.display = 'none';
            authForms.forEach(form => form.style.display = 'none');
        } else {
            loadingElement.classList.add('hidden');
            if (googleButton) googleButton.style.display = 'flex';
            authForms.forEach(form => form.style.display = 'block');
        }
    }

    getAuthErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/user-not-found':
                return 'לא נמצא חשבון עם כתובת אימייל זו';
            case 'auth/wrong-password':
                return 'סיסמה שגויה';
            case 'auth/email-already-in-use':
                return 'כבר קיים חשבון עם כתובת אימייל זו';
            case 'auth/weak-password':
                return 'הסיסמה צריכה להיות באורך של לפחות 6 תווים';
            case 'auth/invalid-email':
                return 'כתובת אימייל לא תקינה';
            case 'auth/too-many-requests':
                return 'יותר מדי ניסיונות כושלים. נסה שוב מאוחר יותר';
            default:
                return 'ההתחברות נכשלה. נסה שוב';
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for use in other modules
export default authManager;