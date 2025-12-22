# 🐾 Sheltr - Complete Setup Guide

## Quick Start Summary

Sheltr is a mobile app to help reunite lost pets with their owners by crowdsourcing sightings and tracking animal locations.

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js v16 or higher installed
- ✅ npm or yarn package manager
- ✅ Git installed
- ✅ Code editor (VS Code recommended)

For mobile development:
- ✅ Expo CLI: `npm install -g expo-cli`
- ✅ iOS: Mac with Xcode (for iOS development)
- ✅ Android: Android Studio with Android SDK

## Step 1: Get API Keys & Services

### 1.1 MongoDB Atlas (Database)

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Start Free"
3. Create an account
4. Create a free cluster (M0 Sandbox)
5. Click "Connect" → "Connect your application"
6. Copy the connection string
7. Replace `<password>` with your database user password
8. Replace `myFirstDatabase` with `sheltr`
9. Save for later: `mongodb+srv://username:password@cluster.mongodb.net/sheltr?retryWrites=true&w=majority`

**Important:** In MongoDB Atlas, go to Network Access and add `0.0.0.0/0` to allow connections from anywhere (or add your specific IPs in production).

### 1.2 Cloudinary (Image Hosting)

1. Go to https://cloudinary.com
2. Sign up for a free account
3. After login, go to Dashboard
4. Copy these values:
   - Cloud Name
   - API Key
   - API Secret
5. Save for later

### 1.3 Google Maps API (Maps)

1. Go to https://console.cloud.google.com
2. Create a new project (name it "Sheltr")
3. Enable these APIs:
   - Maps SDK for iOS
   - Maps SDK for Android
   - Maps JavaScript API
   - Geocoding API
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the API key
6. (Optional) Restrict the API key to your app's bundle ID/package name
7. Save for later

## Step 2: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `backend/.env` with your credentials:
```env
PORT=3000
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/sheltr?retryWrites=true&w=majority
JWT_SECRET=your_super_secure_random_string_min_32_characters_long
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the backend server:
```bash
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 3000
```

Test the API:
```bash
curl http://localhost:3000
# Should return: {"message":"Sheltr API is running 🐾"}
```

## Step 3: Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env`:
```env
API_URL=http://localhost:3000
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Important:** For iOS simulator, use `http://localhost:3000`. For Android emulator, use `http://10.0.2.2:3000`. For physical devices, use your computer's IP address (e.g., `http://192.168.1.100:3000`).

**Note:** The `.env` file is gitignored and won't be committed. For production builds, you'll set environment variables in EAS Build secrets (covered in deployment section).

Start the frontend:
```bash
npm start
```

### Run on iOS (Mac only):
```bash
npm run ios
```

### Run on Android:
```bash
npm run android
```

### Run on Physical Device:
1. Install Expo Go app from App Store or Google Play
2. Scan the QR code shown in terminal
3. Update `API_URL` in `.env` to your computer's local IP

## Step 4: Test the App

1. **Sign Up**: Create a new account
2. **Login**: Login with your credentials
3. **View Feed**: See the empty feed
4. **Report a Pet**: Click the floating + button
5. **Fill Details**: Add photo, description, tags, location
6. **Submit**: Submit the report
7. **View Details**: Click on the pet card to see details
8. **Check Map**: View the location on the map

## Production Deployment

### Backend Deployment (Railway - Easiest)

1. Sign up at https://railway.app
2. Connect your GitHub repository
3. Click "New Project" → "Deploy from GitHub repo"
4. Select the `backend` folder
5. Add environment variables in Railway dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
6. Railway will provide a URL (e.g., `https://sheltr-api.up.railway.app`)
7. Update frontend `.env` with this URL

### Frontend Deployment (Expo EAS)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure the project:
   ```bash
   eas build:configure
   ```

4. Add your API keys as secrets (best practice - not committed to git):
   ```bash
   eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value your_actual_key_here
   ```

5. Build for iOS:
   ```bash
   eas build --platform ios
   ```

6. Build for Android:
   ```bash
   eas build --platform android
   ```

7. Submit to stores:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         React Native Mobile App         │
│  (iOS/Android - Expo)                   │
│  - Authentication                        │
│  - Feed View                             │
│  - Pet Details with Map                  │
│  - Report Modal                          │
└─────────────┬───────────────────────────┘
              │ HTTPS/REST API
              ↓
┌─────────────────────────────────────────┐
│      Node.js/Express Backend API        │
│  - JWT Authentication                    │
│  - Pet Management                        │
│  - Sighting Tracking                     │
│  - Image Upload                          │
└─────────────┬───────────────────────────┘
              │
         ┌────┴────┬──────────┐
         ↓         ↓          ↓
    ┌────────┐ ┌──────┐ ┌──────────┐
    │MongoDB │ │Cloud-│ │ Google   │
    │ Atlas  │ │inary │ │   Maps   │
    └────────┘ └──────┘ └──────────┘
```

## Project Features Checklist

- ✅ User authentication (signup/login)
- ✅ Feed of lost/stray pets
- ✅ Pet detail pages
- ✅ Map visualization of sightings
- ✅ Report lost/stray pets
- ✅ Upload photos (camera/gallery)
- ✅ Tag system (breeds, colors)
- ✅ Location tracking (GPS/manual)
- ✅ View counter
- ✅ Share functionality
- ✅ Sighting history timeline
- ✅ Floating action button
- ✅ Pull-to-refresh

## Troubleshooting

### "PlatformConstants could not be found" or TurboModule errors
This happens when native modules aren't properly initialized. Fix with:

```bash
# In frontend folder
# 1. Clear cache and reinstall
rm -rf node_modules
npm install

# 2. Clear Expo cache
npx expo start -c

# 3. For iOS (Mac only), reinstall pods
cd ios && pod install && cd ..

# 4. If still not working, try:
watchman watch-del-all
rm -rf $TMPDIR/metro-*
```

Then restart the app with `npm start` and press `i` for iOS or `a` for Android.

### Backend won't start
- Check MongoDB connection string is correct
- Ensure MongoDB Atlas network access allows your IP
- Verify all environment variables are set

### Frontend won't connect to backend
- Check `API_URL` is correct
- For physical devices, use your computer's local IP
- Ensure backend server is running

### Images not uploading
- Verify Cloudinary credentials
- Check file size (max 5MB)
- Ensure permissions are granted

### Maps not showing
- Verify Google Maps API key
- Enable required APIs in Google Cloud Console
- Check `app.json` has the API key

### Location not working
- Grant location permissions
- Enable location services on device
- For iOS simulator: Features → Location → Custom Location

## Support & Resources

- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Cloudinary Docs: https://cloudinary.com/documentation
- Google Maps API: https://developers.google.com/maps
- Expo Docs: https://docs.expo.dev
- React Native Docs: https://reactnative.dev

## Next Steps

1. Customize the app design/colors to match your brand
2. Add push notifications for new sightings
3. Implement user profiles
4. Add pet status updates (found/resolved)
5. Create admin panel for moderation
6. Add search and filter functionality
7. Implement chat between users
8. Add analytics and tracking

Good luck with your app! 🐾
