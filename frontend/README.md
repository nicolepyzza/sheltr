# Sheltr Frontend

React Native mobile app for the Sheltr pet tracking platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your credentials:
   - Backend API URL
   - Google Maps API key

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on iOS (Mac only):
   ```bash
   npm run ios
   ```

6. Run on Android:
   ```bash
   npm run android
   ```

## Features

- 📱 User authentication (login/signup)
- 📰 Instagram-like feed of lost/stray pets
- 🗺️ Interactive maps showing pet sighting locations
- 📍 Location tracking for pet sightings
- 🏷️ Tag system for breeds, colors, and behaviors
- 📸 Photo upload from camera or gallery
- 👁️ View counter for posts
- 🔗 Share functionality
- 📊 Sighting history timeline

## Project Structure

```
frontend/
├── app/                    # Expo Router pages
│   ├── _layout.js         # Root layout
│   ├── index.js           # Entry point
│   ├── auth/              # Authentication screens
│   │   ├── login.js
│   │   └── signup.js
│   ├── feed.js            # Main feed
│   └── pet/
│       └── [id].js        # Pet details page
├── components/            # Reusable components
│   └── ReportModal.js    # Report pet modal
├── context/               # React Context
│   └── AuthContext.js    # Auth state management
├── utils/                 # Utilities
│   └── api.js            # API client
├── app.json              # Expo config
└── package.json
```

## Building for Production

### iOS

1. Configure app signing in Xcode
2. Update `app.json` with your bundle identifier
3. Build:
   ```bash
   eas build --platform ios
   ```
4. Submit to App Store:
   ```bash
   eas submit --platform ios
   ```

### Android

1. Update `app.json` with your package name
2. Build:
   ```bash
   eas build --platform android
   ```
3. Submit to Google Play:
   ```bash
   eas submit --platform android
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `API_URL` | Backend API URL |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key |

## Permissions

The app requires the following permissions:

- **Location**: To track and report pet sightings
- **Camera**: To take photos of pets
- **Photo Library**: To upload photos from device

## Design System

### Colors
- Primary: `#E07A5F` (coral)
- Background: `#F5F5F5` (light gray)
- Text: `#333333` (dark gray)
- Secondary Text: `#666666` (medium gray)

### Typography
- Headings: Bold, 18-24px
- Body: Regular, 14-16px
- Small Text: 12px

## Troubleshooting

### "Unable to resolve module"
```bash
npm start -- --reset-cache
```

### Location not working
- Check permissions in device settings
- Ensure location services are enabled
- For iOS simulator, use Features > Location > Custom Location

### Images not uploading
- Check file size (max 5MB)
- Verify Cloudinary credentials in backend
- Check network connection
