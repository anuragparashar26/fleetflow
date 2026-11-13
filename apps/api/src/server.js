import express from 'express';
import cors from 'cors';
import { loadEnv } from './utils/loadEnv.js';

import authRoutes from './modules/platform/routes/auth.routes.js';
import workspaceRoute from './modules/platform/routes/workspace.routes.js';
import memberRoute from './modules/platform/routes/member.routes.js';
import fleetRoutes from './modules/fleet/routes/fleet.routes.js';
import errorHandlerMiddleware from './middleware/errorHandler.middleware.js';
import loggerMiddleware from './middleware/logger.middleware.js';

loadEnv();


const app = express();
const port = process.env.PORT || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

// Versioned API router
const v1Router = express.Router();

// Base route
v1Router.get('/', (_req, res) => {
  res.json({ 
    message: "Welcome to the FleetFlow API",
    version: "1.0.0",
    about: "This API serves as the backend for the FleetFlow platform, providing endpoints for fleet & logistics operations and workspace management.",
    endpoints: {
      "/": "GET - API info",
      "/health": "GET - Health check",
    },
  });
})

// Health check
v1Router.get('/health', (_req, res) => {
  res.json({ status: "OK", service: 'api', timestamp: new Date().toISOString() });
})

//Protect Routes after public endpoints
// Custom middlewares// Middlewares
v1Router.use(loggerMiddleware);

// Platform routes
v1Router.use('/auth', authRoutes);
v1Router.use('/workspaces', workspaceRoute)
v1Router.use('/members', memberRoute)

// Fleet & logistics routes
v1Router.use('/fleet', fleetRoutes)

app.use('/api/v1', v1Router);



// Global error handler (should be last)
app.use(errorHandlerMiddleware);


if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`API Listening on http://localhost:${port}/api/v1`);
  });
}

export default app;