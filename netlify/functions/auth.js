import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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
      
      // Find user in database
      const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
      
      if (user.length === 0) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }

      const userData = user[0];
      
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
        
        // Get user from database
        const user = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
        
        if (user.length === 0) {
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
              id: user[0].id,
              username: user[0].username,
              role: user[0].role,
              name: user[0].name
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
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}
