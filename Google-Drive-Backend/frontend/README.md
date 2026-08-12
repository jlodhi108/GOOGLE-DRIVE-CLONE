# Google Drive Clone - Frontend

This is the React frontend for the Google Drive Clone application. It is built for speed and simplicity using Vite.

## Tech Stack
- React 19
- React Router v7
- Vite (Build Tool)
- Axios (API Requests)

## Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   This will start the Vite dev server with Hot Module Replacement (HMR).

## Production Build

To build the frontend for production, run:
```bash
npm run build
```

This compiles the React application into static files located in the `dist/` directory. 

### Note on Docker Deployment
When deployed using Docker (from the root folder's `Dockerfile`), the frontend is automatically compiled during Stage 1 of the build process using `node:20-alpine`. The resulting static files are then copied into the backend container and served directly by Express.js. You do not need to manually build or run the frontend in a production Docker environment.
