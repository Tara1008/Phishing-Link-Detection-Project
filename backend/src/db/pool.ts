import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ----------------------------------------------------------------
// Connection pool — shared across all requests
// ----------------------------------------------------------------
/*export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'phishguard',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: '+00:00',
});
*/

console.log("ENV:", {
  MYSQLHOST: process.env.MYSQLHOST,
  MYSQLPORT: process.env.MYSQLPORT,
  MYSQLUSER: process.env.MYSQLUSER,
  MYSQLDATABASE: process.env.MYSQLDATABASE,
});

export const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: Number(process.env.MYSQLPORT),
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: '+00:00',
});


// ----------------------------------------------------------------
// Bootstrap — create DB + tables from schema.sql on first run
// ----------------------------------------------------------------
export async function bootstrapDatabase(): Promise<void> {
  // First connect WITHOUT database to create it if missing
  const bootstrapConn = await mysql.createConnection({
    host: process.env.MYSQLHOST ,
    port: Number(process.env.MYSQLPORT) || 3306,
    user: process.env.MYSQLUSER ,
    password: process.env.MYSQLPASSWORD ,
    database: process.env.MYSQLDATABASE,
    multipleStatements: true,
  });

  try {
    console.log("BOOTSTRAP DATABASE RUNNING");
    let schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    }
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log("SCHEMA PATH:", schemaPath);
//    console.log("Using schema file:", schemaPath);
    console.log(sql.substring(0, 200));

    // Execute each statement individually (mysql2 multipleStatements)
    await bootstrapConn.query(sql);
    const [tables] = await bootstrapConn.query("SHOW TABLES");
    console.log("TABLES:", tables);
    console.log('✅  Database schema initialised');
  } catch (err) {
    console.error('❌  Database bootstrap failed:', err);
    throw err;
  } finally {
    await bootstrapConn.end();
  }
}

// ----------------------------------------------------------------
// Health-check helper
// ----------------------------------------------------------------
export async function testConnection(): Promise<boolean> {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch {
    return false;
  }
}
