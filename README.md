# 🎲 Backgammon Tournament App

A modern, real-time tournament management system for Backgammon games with your coworkers.

## ✨ Features

### 🔐 Authentication
- **Google Sign-In** - Quick authentication with Google accounts
- **Email/Password** - Traditional username/password authentication
- **User Profiles** - Automatic profile creation with avatars

### 🏆 Tournament Management
- **Create Tournaments** - Customizable group sizes and player counts
- **Join Tournaments** - Easy joining via tournament codes
- **Real-time Updates** - Live tournament status and participant updates
- **Admin Controls** - Tournament creators have special permissions

### 🎮 Match System
- **Round-Robin Groups** - Everyone plays everyone in their group
- **Match Results** - Players can submit results for their own matches
- **Live Leaderboards** - Real-time standings with win/loss tracking
- **Point Differential** - Advanced scoring system

### 🎨 Modern UI/UX
- **Dark/Light Mode** - System-aware theme switching
- **Mobile Responsive** - Works perfectly on all devices
- **Smooth Animations** - Apple-style transitions and effects
- **Loading States** - Beautiful skeleton loaders

## 🚀 Quick Start

### Option 1: Simple HTTP Server (Recommended)

Since the app uses ES6 modules, you need to serve it over HTTP:

```bash
# Using Python (if you have it)
python3 -m http.server 8080

# Using Node.js
npx http-server . -p 8080

# Using PHP (if you have it)
php -S localhost:8080
```

Then open: **http://localhost:8080**

### Option 2: VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## 🔧 Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Your config is already set in `js/firebase-config.js`

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable Google Sign-In
   - Enable Email/Password

3. **Create Firestore Database**
   - Go to Firestore Database
   - Create database in test mode
   - The app will automatically create these collections:
     - `tournaments` - Tournament data
     - `matches` - Match results
     - `users` - User profiles

4. **Set Firestore Rules** (Optional - for production)
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own profile
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Tournament participants can read tournament data
       match /tournaments/{tournamentId} {
         allow read: if request.auth != null && 
           request.auth.uid in resource.data.participants;
         allow write: if request.auth != null && 
           request.auth.uid == resource.data.createdBy;
       }
       
       // Match participants can read/write match data
       match /matches/{matchId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && 
           (request.auth.uid == resource.data.player1 || 
            request.auth.uid == resource.data.player2);
       }
     }
   }
   ```

## 📱 How to Use

### 1. **Sign In**
- Choose Google Sign-In for quick access
- Or create an account with email/password
- Your profile is automatically created

### 2. **Create Tournament**
- Click "Create Tournament" on the dashboard
- Set tournament name, groups, and players per group
- Choose double elimination if desired
- Share the tournament code with participants

### 3. **Join Tournament**
- Click "Join Tournament"
- Enter the tournament code provided by the creator
- You'll be added to the participant list

### 4. **Play Matches**
- Once the tournament starts, view your group
- Play matches against other group members
- Submit results (only participants can submit)
- Watch the live leaderboard update

### 5. **Tournament Progression**
- Group stage: Round-robin within groups
- Knockout stage: Top players advance (coming soon)
- Real-time updates throughout

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **Real-time**: Firebase listeners
- **Hosting**: Firebase Hosting (or any static host)

## 📁 Project Structure

```
backgammon-tournament/
├── index.html              # Landing page with authentication
├── app.html               # Main dashboard
├── tournament.html        # Individual tournament view
├── css/
│   └── styles.css        # Custom styles and animations
├── js/
│   ├── app.js           # Main application logic
│   ├── auth.js          # Authentication management
│   ├── tournament.js    # Tournament management
│   ├── firebase-config.js # Firebase configuration
│   ├── theme.js         # Dark/light mode handling
│   └── utils.js         # Utility functions
└── README.md            # This file
```

## 🎯 Features in Detail

### Authentication Options
- **Google Sign-In**: One-click authentication
- **Email/Password**: Traditional sign-up/sign-in
- **Auto-generated Avatars**: Beautiful avatars for email users
- **Profile Management**: Update display names and settings

### Tournament Features
- **Flexible Groups**: 1-8 groups with 3-12 players each
- **Tournament Codes**: Easy 6-character codes for joining
- **Admin Controls**: Start, edit, or delete tournaments
- **Real-time Participants**: See who joins instantly

### Match System
- **Round-Robin**: Fair play - everyone vs everyone
- **Result Validation**: Only match participants can submit
- **Live Updates**: Results appear instantly for all users
- **Leaderboard**: Sorted by wins, then point differential

### UI/UX Excellence
- **Responsive Design**: Perfect on mobile, tablet, desktop
- **Dark Mode**: Automatic system detection + manual toggle
- **Smooth Animations**: Fade-ins, slide-ins, loading states
- **Error Handling**: User-friendly error messages
- **Loading States**: Skeleton loaders and spinners

## 🚀 Deployment

### Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Other Static Hosts
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect your GitHub repo
- **GitHub Pages**: Push to gh-pages branch

## 🤝 Contributing

This is a complete, production-ready tournament system! Feel free to:
- Add new features (knockout brackets, statistics)
- Improve the UI/UX
- Add more game types
- Enhance mobile experience

## 📄 License

MIT License - feel free to use this for your own tournaments!

---

**Ready to start your tournament? 🎲**

Just open the app, sign in, and create your first Backgammon tournament!