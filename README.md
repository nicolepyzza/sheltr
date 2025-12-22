# Sheltr - Lost Pet Tracking App

A mobile application to help reunite lost pets with their owners by crowdsourcing sightings and tracking animal locations.

## Features

- 🔐 User authentication (signup/login)
- 📱 Instagram-like feed of lost/stray animals
- 🗺️ Map visualization of pet sightings
- 📍 Location tracking for each sighting
- 🏷️ Tag system for breed, color, and behavior
- 📸 Photo upload support
- 👁️ View counter for posts
- 🔗 Share links for posts

## Project Structure

```
sheltr/
├── frontend/          # React Native mobile app
├── backend/           # Node.js/Express API server
└── README.md
```

## Tech Stack

### Frontend
- React Native
- React Navigation
- Axios
- React Native Maps
- React Native Image Picker

### Backend
- Node.js
- Express
- MongoDB/Mongoose
- JWT Authentication
- Multer (file uploads)
- Bcrypt (password hashing)

## Setup Instructions

### Prerequisites

1. Node.js (v16 or higher)
2. MongoDB Atlas account (or local MongoDB)
3. Expo CLI or React Native CLI
4. Google Maps API key
5. Cloudinary account (for image hosting)

### Backend Setup

1. Navigate to backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with the following variables:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with:
   ```
   API_URL=http://your-backend-url:3000
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. For iOS (Mac only):
   ```bash
   cd ios && pod install && cd ..
   npm run ios
   ```

5. For Android:
   ```bash
   npm run android
   ```

## Getting API Keys

### MongoDB Atlas
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account and cluster
3. Get your connection string from the "Connect" button

### Google Maps API
1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable Maps SDK for iOS/Android
4. Create credentials and get your API key

### Cloudinary (Image Hosting)
1. Go to https://cloudinary.com
2. Sign up for free account
3. Get your cloud name, API key, and API secret from dashboard

## Production Deployment

### Backend
- Deploy to: Heroku, Railway, DigitalOcean, or AWS
- Ensure MongoDB Atlas whitelist includes your server IP
- Set environment variables in hosting platform

### Frontend
- Build for production:
  - iOS: Submit to App Store using Xcode
  - Android: Generate signed APK/AAB and submit to Google Play

## API Endpoints

### Authentication
- POST `/api/auth/signup` - Register new user
- POST `/api/auth/login` - Login user

### Pets
- GET `/api/pets` - Get all pet posts (feed)
- GET `/api/pets/:id` - Get single pet details
- POST `/api/pets` - Report a lost/stray pet
- GET `/api/pets/:id/sightings` - Get sightings for a pet

### Sightings
- POST `/api/sightings` - Report a new sighting
- GET `/api/sightings/:id` - Get sighting details

## License

MIT
