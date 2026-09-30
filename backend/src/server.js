import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { env } from './config/env.js';
import { pool } from './db/pool.js';

import auth from './routes/auth.js';
import catalog from './routes/catalog.js';
import shop from './routes/shop.js';
import admin from './routes/admin.js';

import {
  notFound,
  errorHandler
} from './middleware/error.js';

const app = express();


// ==================================================
// BASIC APP CONFIGURATION
// ==================================================

app.set('trust proxy', 1);


// ==================================================
// SECURITY
// ==================================================
//
// Frontend:
// http://localhost:5173
//
// Backend:
// http://localhost:5000
//
// Product images:
// http://localhost:5000/uploads/products/...
//
// crossOriginResourcePolicy is set to "cross-origin"
// so the frontend can display images served by the
// backend on a different localhost port.
// ==================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    },

    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "http://localhost:5000",
          "http://localhost:5173"
        ],

        connectSrc: [
          "'self'",
          "http://localhost:5000",
          "http://localhost:5173"
        ],

        scriptSrc: [
          "'self'"
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'"
        ],

        fontSrc: [
          "'self'",
          "data:"
        ],

        objectSrc: [
          "'none'"
        ],

        baseUri: [
          "'self'"
        ],

        frameAncestors: [
          "'self'"
        ]
      }
    }
  })
);


// ==================================================
// PERFORMANCE
// ==================================================

app.use(compression());


// ==================================================
// CORS
// ==================================================

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);


// ==================================================
// JSON BODY PARSER
// ==================================================

app.use(
  express.json({
    limit: '1mb'
  })
);


// ==================================================
// RATE LIMITING
// ==================================================

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);


// ==================================================
// PRODUCT IMAGE UPLOADS
// ==================================================
//
// Files are stored in:
//
// backend/uploads/products/
//
// They are accessible through:
//
// http://localhost:5000/uploads/products/<filename>
//
// ==================================================

app.use(
  '/uploads',
  express.static(
    path.resolve(
      process.cwd(),
      'uploads'
    ),
    {
      fallthrough: true,
      index: false
    }
  )
);


// ==================================================
// HEALTH CHECK
// ==================================================

app.get(
  '/api/health',
  async (req, res) => {

    try {

      await pool.query('SELECT 1');

      res.json({
        status: 'ok',
        service: 'fashion-trends-api',
        time: new Date().toISOString()
      });

    } catch (error) {

      console.error(
        'Health check failed:',
        error
      );

      res.status(503).json({
        status: 'degraded',
        database: false
      });

    }

  }
);


// ==================================================
// API ROUTES
// ==================================================

app.use(
  '/api/auth',
  auth
);

app.use(
  '/api/catalog',
  catalog
);

app.use(
  '/api/shop',
  shop
);

app.use(
  '/api/admin',
  admin
);


// ==================================================
// 404 HANDLER
// ==================================================

app.use(
  notFound
);


// ==================================================
// GLOBAL ERROR HANDLER
// ==================================================

app.use(
  errorHandler
);


// ==================================================
// START SERVER
// ==================================================

app.listen(
  env.port,
  () => {

    console.log(
      '---------------------------------------------'
    );

    console.log(
      `Fashion Trends API running on http://localhost:${env.port}`
    );

    console.log(
      `Product images available at http://localhost:${env.port}/uploads/products`
    );

    console.log(
      `Frontend: ${env.clientUrl}`
    );

    console.log(
      '---------------------------------------------'
    );

  }
);