# Harvest Munshi

A cross-platform application for logging and managing kitchen garden harvest, with both web and Android interfaces. The application supports offline functionality and automatic synchronization when online.

## Project Structure

```
HarvestMunshi/
├── app.js                 # Web application server
├── client.js             # Web client code
├── localStorage.js       # Web local storage manager
├── index.html           # Web application UI
├── styles.css           # Web application styles
├── android/             # Android application
│   └── HarvestNotes/    # Android project directory
└── logs/                # Server-side logs directory
    └── HarvestNotes/    # Harvest notes storage
```

## Web Application Prerequisites, Installation, and Running

### Prerequisites

- **Node.js** (version 14 or higher recommended)
  - Download from: https://nodejs.org/
- **npm** (comes with Node.js)
- **Internet connection** (required for Firebase/Firestore)
- **Firebase Project** (optional, if you want to use your own Firestore database)
  - If you want to use your own Firebase project, update the credentials in `firebaseconfig.js`.

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd HarvestMunshi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This will install all required Node.js packages, including:
   - express
   - firebase
   - winston
   - archiver

3. **(Optional) Configure Firebase**
   - The app is pre-configured to use a sample Firebase project.
   - To use your own Firebase/Firestore:
     1. Go to [Firebase Console](https://console.firebase.google.com/).
     2. Create a new project.
     3. In Project Settings, add a web app and copy the config.
     4. Replace the values in `firebaseconfig.js`:
        ```js
        const firebaseConfig = {
          apiKey: "...",
          authDomain: "...",
          projectId: "...",
          storageBucket: "...",
          messagingSenderId: "...",
          appId: "...",
          measurementId: "..."
        };
        ```

### Running the Web App

1. **Start the server**
   ```bash
   npm start
   ```
   or
   ```bash
   node app.js
   ```

2. **Open the app in your browser**
   - Go to: [http://localhost:3001](http://localhost:3001)

### Build/Run Commands

| Task                | Command            |
|---------------------|-------------------|
| Install dependencies| `npm install`     |
| Start server        | `npm start`       |
| Start server (alt)  | `node app.js`     |

### Notes

- The server will automatically create log files in the `logs/` directory if they do not exist.
- If port 3001 is already in use, the server will retry after 10 seconds.
- For real-time and persistent data, ensure your Firebase project is set up and Firestore rules allow read/write access for your app.

### Troubleshooting

- **Port already in use:** Stop other apps using port 3001 or change the port in `app.js`.
- **Firebase errors:** Double-check your `firebaseconfig.js` credentials and Firestore rules.
- **LocalStorage issues:** Make sure your browser allows localStorage and you are not in incognito/private mode.

## Android Application Setup

### Prerequisites
- Android Studio (latest version)
- JDK 8 or higher
- Android SDK 21 or higher

### Project Structure Explanation

The Android project uses Gradle as its build system, which is why there are two build.gradle files:

1. **Root build.gradle** (`android/HarvestNotes/build.gradle`):
   - Contains project-wide configurations
   - Defines buildscript dependencies
   - Sets up repositories for all modules

2. **App-level build.gradle** (`android/HarvestNotes/app/build.gradle`):
   - Contains app-specific configurations
   - Defines app dependencies
   - Sets up Android-specific settings

### Running the Android App

1. Open Android Studio

2. Open the project:
   - Click "Open an existing project"
   - Navigate to the `android/HarvestNotes` directory
   - Click "OK"

3. Wait for the project to sync and index

4. Run the app:
   - Connect an Android device or start an emulator
   - Click the "Run" button (green play icon) in the toolbar
   - Select your device/emulator
   - Click "OK"

### Building from Command Line

```bash
cd android/HarvestNotes
./gradlew assembleDebug    # For debug build
./gradlew assembleRelease  # For release build
```

## Features

### Web Application
- Real-time note logging
- Local storage for offline access
- Automatic server synchronization
- Responsive design

### Android Application
- Native Android UI
- Local database storage using Room
- Offline-first architecture
- Automatic background synchronization
- Material Design interface

## Data Synchronization

Both applications implement a similar synchronization strategy:

1. **Local Storage First**:
   - Data is saved locally immediately
   - Works offline
   - Persists across app restarts

2. **Server Synchronization**:
   - Attempts to sync when online
   - Tracks sync status
   - Retries failed syncs
   - Handles conflicts

## Development

### Web Development
- Edit files in the root directory
- Changes to `app.js` require server restart
- Client-side changes are reflected immediately

### Android Development
- Use Android Studio for development
- Follow Material Design guidelines
- Test on multiple Android versions
- Use the provided Room database for storage

## Troubleshooting

### Web App Issues
1. If local storage isn't working:
   - Check browser console for errors
   - Verify localStorage is enabled
   - Clear browser cache if needed

2. If sync fails:
   - Check network connection
   - Verify server is running
   - Check server logs

### Android App Issues
1. If build fails:
   - Run `./gradlew clean`
   - Sync project with Gradle files
   - Check SDK installation

2. If app crashes:
   - Check logcat for errors
   - Verify all permissions are granted
   - Test on different Android versions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
