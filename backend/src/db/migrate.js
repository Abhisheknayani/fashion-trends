import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url'; import { pool } from './pool.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname,'../../sql/001_schema.sql'),'utf8');
await pool.query(sql); console.log('Database schema created/updated successfully.'); await pool.end();
