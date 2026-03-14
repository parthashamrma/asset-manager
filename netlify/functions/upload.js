import { uploadFile, deleteFile, getFileUrl } from './supabase.js';
import { verifyToken } from './utils.js';

export async function handler(event, context) {
  const { httpMethod, path, headers, body } = event;
  
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
    // Verify authentication
    const decoded = verifyToken(headers.authorization || headers.Authorization);
    if (!decoded) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Unauthorized' })
      };
    }

    if (httpMethod === 'POST' && path === '/api/upload') {
      // Handle file upload from FormData
      const contentType = headers['content-type'] || headers['Content-Type'];
      
      if (!contentType.includes('multipart/form-data')) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Content-Type must be multipart/form-data' })
        };
      }

      // Parse multipart form data
      const formData = await parseMultipartFormData(event.body, contentType);
      const file = formData.get('file');
      
      if (!file) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'No file provided' })
        };
      }

      // Upload to Supabase
      const uploadResult = await uploadFile(file, 'documents');
      
      if (!uploadResult.success) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ 
            message: 'Upload failed',
            error: uploadResult.error 
          })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'File uploaded successfully',
          file: {
            name: uploadResult.fileName,
            url: uploadResult.publicUrl,
            path: uploadResult.path
          }
        })
      };
    }

    if (httpMethod === 'DELETE' && path.startsWith('/api/upload/')) {
      const filePath = path.replace('/api/upload/', '');
      
      // Delete file from Supabase
      const deleteResult = await deleteFile(filePath, 'documents');
      
      if (!deleteResult.success) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ 
            message: 'Delete failed',
            error: deleteResult.error 
          })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'File deleted successfully' })
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Upload function error:', error);
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

// Simple multipart form data parser for Netlify Functions
async function parseMultipartFormData(body, contentType) {
  // This is a simplified parser - in production, use a proper multipart parser
  // For now, we'll handle base64 encoded files from frontend
  
  try {
    const data = JSON.parse(body);
    const formData = new Map();
    
    if (data.file) {
      formData.set('file', {
        originalname: data.originalname || data.filename || 'file',
        mimetype: data.mimetype || 'application/octet-stream',
        buffer: Buffer.from(data.base64, 'base64')
      });
    }
    
    return formData;
  } catch (error) {
    console.error('Form parse error:', error);
    return new Map();
  }
}
