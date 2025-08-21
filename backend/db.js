// db.js - PostgreSQL Database Connection
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Database configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'your_database',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create PostgreSQL connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
};

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// User-related database functions
export const userQueries = {
  // Find user by email
  findByEmail: async (email) => {
    const result = await query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
    return result.rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const result = await query('SELECT * FROM users WHERE id = $1 AND is_active = true', [id]);
    return result.rows[0];
  },

  // Create new user
  create: async (email, hashedPassword, name) => {
    const result = await query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, hashedPassword, name]
    );
    return result.rows[0];
  },

  // Update user
  update: async (id, updates) => {
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];
    const result = await query(
      `UPDATE users SET ${setClause} WHERE id = $1 AND is_active = true RETURNING id, email, name, updated_at`,
      values
    );
    return result.rows[0];
  },

  // Soft delete user (set is_active to false)
  softDelete: async (id) => {
    const result = await query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  },

  // Get all users (admin function)
  getAll: async (limit = 50, offset = 0) => {
    const result = await query(
      'SELECT id, email, name, is_active, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }
};

export default pool;