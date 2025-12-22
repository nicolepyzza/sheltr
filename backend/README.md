# Sheltr Backend

Node.js/Express API server for the Sheltr mobile app.

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
   - MongoDB connection string
   - JWT secret key
   - Cloudinary credentials

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Pets
- `GET /api/pets` - Get all pets (feed)
- `GET /api/pets/:id` - Get pet details with sightings
- `POST /api/pets` - Report a lost/stray pet (requires auth)
- `PATCH /api/pets/:id/status` - Update pet status (requires auth)

### Sightings
- `POST /api/sightings` - Report a new sighting (requires auth)
- `GET /api/sightings/:petId` - Get all sightings for a pet

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## Production Deployment

### Option 1: Railway
1. Sign up at https://railway.app
2. Create new project from GitHub repo
3. Add environment variables in project settings
4. Deploy automatically on push

### Option 2: Heroku
1. Install Heroku CLI
2. Create new Heroku app:
   ```bash
   heroku create sheltr-api
   ```
3. Set environment variables:
   ```bash
   heroku config:set MONGODB_URI=your_uri
   heroku config:set JWT_SECRET=your_secret
   # ... etc
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```

### Option 3: DigitalOcean App Platform
1. Sign up at https://www.digitalocean.com
2. Create new app from GitHub repo
3. Add environment variables
4. Deploy

Remember to:
- Whitelist your server IP in MongoDB Atlas
- Use production-ready environment variables
- Enable CORS for your frontend domain
- Set up SSL/HTTPS
