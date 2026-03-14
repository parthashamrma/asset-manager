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
      // Mock authentication for demo
      const { username, password } = JSON.parse(body);
      
      // Mock user data (replace with real authentication)
      const users = {
        'sachin': { id: 29, username: 'sachin', role: 'teacher', name: 'Mr. Sachin Awasthi' },
        '2513730040': { id: 70, username: '2513730040', role: 'student', name: 'PARTH SHARMA' }
      };

      if ((username === 'sachin' && password === 'sachin') || 
          (username === '2513730040' && password === '123456')) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            user: users[username],
            token: 'mock-jwt-token-' + Date.now()
          })
        };
      } else {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }
    }

    if (httpMethod === 'GET' && path === '/api/auth/me') {
      // Mock current user check
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          user: { id: 29, username: 'sachin', role: 'teacher', name: 'Mr. Sachin Awasthi' }
        })
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Endpoint not found' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}
