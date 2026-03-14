import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Import schema directly - copy the users schema here since imports might fail
const users = {
  id: 'id',
  username: 'username',
  password: 'password',
  name: 'name',
  role: 'role'
};

// Database connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

export async function handler(event, context) {
  const { httpMethod, path, body, headers } = event;
  
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
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
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      const userData = userResult[0];
      
      // Compare hashed passwords using bcrypt
      if (!(await bcrypt.compare(password, userData.password))) {
        return {
          statusCode: 401,
          headers: corsHeaders,
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
        headers: corsHeaders,
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
      const authHeader = headers.authorization || headers.Authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Unauthorized' })
        };
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'fallback-secret');
        
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
            headers: corsHeaders,
            body: JSON.stringify({ message: 'User not found' })
          };
        }

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            user: {
              id: userResult[0].id,
              username: userResult[0].username,
              role: userResult[0].role,
              name: userResult[0].name
            }
          })
        };
      } catch (jwtError) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Invalid token' })
        };
      }
    }

    if (httpMethod === 'POST' && path === '/api/auth/logout') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Logged out successfully' })
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Auth function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error.message 
      })
    };
  }
}
