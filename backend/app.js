import dotenv from 'dotenv';
dotenv.config(); // must come first!

import express from 'express';
import cors from 'cors';
import path from 'path';
import connectDB from './src/config/db.js';
import { createDemoUsers } from './src/controllers/authController.js';
import authRoutes from './src/routes/authRoutes.js';
import carRoutes from './src/routes/carRoutes.js';
import clientRoutes from './src/routes/clientRoutes.js';
import vehicleRoutes from './src/routes/vehicleRoutes.js';
import bookingRoutes from './src/routes/bookingRoutes.js';
import analyticsRoutes from './src/routes/analyticsRoutes.js';
import quickActionsRoutes from './src/routes/quickActionsRoutes.js';

// Connect to MongoDB (will run on each cold start in serverless)
connectDB(); // uses MONGO_URI from .env
createDemoUsers(); // create demo users on startup

const app = express();

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:5173',       // Vite dev server
    'http://localhost:3000',       // React dev server
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://car-hire-pro-frontend.vercel.app', // Production frontend (no trailing slash)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/quick-actions', quickActionsRoutes);

// In a pure API deployment on Vercel, we don't actually need to serve the frontend.
// These static routes are mainly for local/combined deployments.
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  // Serve React index.html for any unknown routes (frontend handles routing)
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

export default app;


