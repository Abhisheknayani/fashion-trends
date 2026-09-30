import pg from 'pg';
import { env } from '../config/env.js';
const { Pool } = pg;
export const pool = new Pool({ connectionString: env.databaseUrl, ssl: env.databaseUrl?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined, max: 10, idleTimeoutMillis: 30000 });
export const q = (text, params=[]) => pool.query(text, params);
