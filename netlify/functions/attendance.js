import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, subjects, attendance, studentSubjects } from '../../shared/schema.js';
import { eq, and, count } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

// Database connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
const db = drizzle(client);

// Helper function to verify JWT token
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.SESSION_SECRET || 'fallback-secret');
  } catch (error) {
    return null;
  }
}

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
    // Verify authentication
    const decoded = verifyToken(headers.authorization || headers.Authorization);
    if (!decoded) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Unauthorized' })
      };
    }

    if (httpMethod === 'GET' && path === '/api/teacher/attendance') {
      if (decoded.role !== 'teacher') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Access denied' })
        };
      }

      // Get teacher's subjects
      const teacherSubjects = await db.select().from(subjects).where(eq(subjects.teacherId, decoded.id));
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(teacherSubjects)
      };
    }

    if (httpMethod === 'GET' && path.startsWith('/api/teacher/attendance/')) {
      if (decoded.role !== 'teacher') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Access denied' })
        };
      }

      const subjectId = parseInt(path.split('/').pop());
      
      // Get students enrolled in this subject
      const students = await db.select({
        studentId: studentSubjects.studentId,
        studentName: users.name,
        rollNumber: users.username
      })
      .from(studentSubjects)
      .leftJoin(users, eq(users.id, studentSubjects.studentId))
      .where(eq(studentSubjects.subjectId, subjectId));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(students)
      };
    }

    if (httpMethod === 'POST' && path.startsWith('/api/teacher/attendance/')) {
      if (decoded.role !== 'teacher') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Access denied' })
        };
      }

      const subjectId = parseInt(path.split('/').pop());
      const { date, timeSlot, attendanceRecords } = JSON.parse(body);

      // Insert attendance records
      const attendanceData = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId: parseInt(studentId),
        subjectId,
        date: new Date(date),
        timeSlot,
        status
      }));

      await db.insert(attendance).values(attendanceData);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Attendance marked successfully' })
      };
    }

    // Default response
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Attendance function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}
