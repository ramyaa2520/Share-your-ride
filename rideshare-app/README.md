# RideShare Application

A full-stack ride-sharing application built with React, Node.js, Express, and MongoDB.

## Project Structure

The project is divided into two main parts:

- **Frontend**: React application
- **Backend**: Node.js/Express API

## Deployment Guide

### Frontend (Vercel)

1. Fork or clone this repository
2. Create a new project on [Vercel](https://vercel.com)
3. Connect your GitHub repository
4. Set the following configurations:
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`
   - **Root Directory**: `frontend`

5. Set environment variables:
   - `REACT_APP_API_URL`: Your backend API URL (e.g., https://rideshare-backend.onrender.com/api)
   - `REACT_APP_LOCATIONIQ_KEY`: Your LocationIQ API Key
   - `GENERATE_SOURCEMAP`: Set to `false`

6. Deploy the application

### Backend (Render)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set the following configurations:
   - **Name**: rideshare-backend
   - **Environment**: Docker
   - **Root Directory**: `/`
   - **Build Command**: (Leave empty, handled by Dockerfile)

4. Set environment variables:
   - `NODE_ENV`: production
   - `PORT`: 8080
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `JWT_EXPIRES_IN`: 90d

5. Deploy the application

## Development Setup

### Frontend

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_LOCATIONIQ_KEY=your_locationiq_key
   ```
4. Start the development server: `npm start`

### Backend

1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=90d
   ```
4. Start the development server: `npm run dev`

## Features

- User authentication (signup, login)
- User profiles (rider, driver)
- Ride booking and offering
- Real-time location tracking
- Payment integration
- Ride history and ratings

## Technologies

- **Frontend**: React, Material-UI, Zustand, Axios
- **Backend**: Node.js, Express, MongoDB
- **Maps & Locations**: LocationIQ APIs
- **Deployment**: Vercel (frontend), Render (backend) 