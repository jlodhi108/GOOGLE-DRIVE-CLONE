# Google Drive Clone (Full-Stack)

A robust, full-stack application that emulates the core functionalities of Google Drive. This project allows users to authenticate, manage files and folders, share content securely, and track activities.

## Table of Contents
1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Deployment (Docker)](#deployment-docker)
5. [Local Development](#local-development)
6. [API Documentation](#api-documentation)

## Features
- **User Authentication**: 
  - Local authentication with email and password
  - JWT-based session management
- **File Management**:
  - Upload files with progress tracking
  - Download files securely
  - Delete files with proper authorization checks
  - Rename files while maintaining version history
- **Folder Operations**:
  - Create nested folder structures
  - Move files between folders
  - Rename folders with cascading effects on file paths
- **Sharing Capabilities**:
  - Share files and folders with other users
  - Set granular permissions (view, edit)
- **Activity Logging**:
  - Track user actions for auditing purposes

## Tech Stack
- **Backend**: 
  - Node.js (v18+)
  - Express.js
  - SQLite (Local database storage)
  - Sequelize (ORM)
  - Multer (File uploads)
- **Authentication**: 
  - Passport.js
  - JSON Web Tokens (JWT)
- **Frontend**:
  - React.js (v19+)
  - Vite (Build tool)
  - React Router
  - Axios
- **Deployment**:
  - Docker (Multi-stage build)

## Project Structure
```
google-drive-clone/
│
├── config/             # Database and middleware configs
├── controllers/        # Express route controllers
├── models/             # Sequelize database models
├── routes/             # API routes
├── middlewares/        # Authentication & Error handling
├── utils/              # Helper functions
├── uploads/            # Local file storage directory
│
├── frontend/           # React frontend application
│   ├── src/            # Frontend source code
│   └── package.json
│
├── Dockerfile          # Multi-stage Docker deployment build
├── run.sh              # Docker runner script
├── server.js           # Backend entry point
└── package.json        # Backend dependencies
```

## Deployment (Docker on AWS EC2)
This application is designed to be easily deployed to an AWS EC2 instance (or any Linux server) using Docker.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jlodhi108/GOOGLE-DRIVE-CLONE.git
   cd GOOGLE-DRIVE-CLONE/Google-Drive-Backend
   ```
2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in:
   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your_jwt_secret_here
   ```
3. **Run the Deployment Script**:
   The `run.sh` script handles building the Docker image and starting the container.
   ```bash
   bash run.sh
   ```
   *Note: The Dockerfile uses a multi-stage build. It compiles the React frontend using `node:20-alpine` and serves the production backend on `node:18-alpine` (for perfect SQLite and native C-library compatibility).*

## Local Development
To run this project locally without Docker:

**1. Start the Backend**
```bash
# In the root directory
npm install
npm run dev
```

**2. Start the Frontend**
```bash
# In a new terminal window
cd frontend
npm install
npm run dev
```

## API Documentation
### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile

### Files & Folders
- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/:folderId` - List files in folder
- `POST /api/v1/folders` - Create a folder
- `DELETE /api/v1/files/:id` - Delete a file
