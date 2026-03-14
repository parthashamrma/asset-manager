import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { verifyToken, getCorsHeaders, handlePreflight } from './utils.js';

// Database connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

export async function handler(event, context) {
  const { httpMethod, path, body, headers } = event;
  
  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return handlePreflight();
  }

  try {
    if (httpMethod === 'POST' && path === '/api/auth/login') {
      const { username, password } = JSON.parse(body);
      
      // Find user in database - use raw SQL to avoid schema import issues
      const userQuery = `
        SELECT id, username, password, name, role 
        FROM users 
        WHERE username = $1
        LIMIT 1
      `;
      const userResult = await client.unsafe(userQuery, [username]);
      
      if (userResult.length === 0) {
        return {
          statusCode: 401,
          headers: getCorsHeaders(),
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      const userData = userResult[0];
      
      // Compare hashed passwords using bcrypt
      if (!(await bcrypt.compare(password, userData.password))) {
        return {
          statusCode: 401,
          headers: getCorsHeaders(),
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: userData.id, username: userData.username, role: userData.role },
        process.env.SESSION_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          user: {
            id: userData.id,
            username: userData.username,
            role: userData.role,
            name: userData.name
          },
          token
        })
      };
    }

    if (httpMethod === 'GET' && path === '/api/auth/me') {
      const decoded = verifyToken(headers.authorization || headers.Authorization);
      
      if (!decoded) {
        return {
          statusCode: 401,
          headers: getCorsHeaders(),
          body: JSON.stringify({ message: 'Unauthorized' })
        };
      }

      // Get user from database - use raw SQL
      const userQuery = `
        SELECT id, username, name, role 
        FROM users 
        WHERE id = $1
        LIMIT 1
      `;
      const userResult = await client.unsafe(userQuery, [decoded.id]);
      
      if (userResult.length === 0) {
        return {
          statusCode: 401,
          headers: getCorsHeaders(),
          body: JSON.stringify({ message: 'User not found' })
        };
      }

      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          user: {
            id: userResult[0].id,
            username: userResult[0].username,
            role: userResult[0].role,
            name: userResult[0].name
          }
        })
      };
    }

    if (httpMethod === 'POST' && path === '/api/auth/logout') {
      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: JSON.stringify({ message: 'Logged out successfully' })
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers: getCorsHeaders(),
      body: JSON.stringify({ message: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Auth function error:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error.message 
      })
    };
  }
}
