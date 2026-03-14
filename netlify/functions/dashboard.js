import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
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
  const { httpMethod, path, headers } = event;
  
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

    if (httpMethod === 'GET' && path === '/api/teacher/dashboard') {
      if (decoded.role !== 'teacher') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Access denied' })
        };
      }

      // Get teacher's subjects using raw SQL
      const subjectsQuery = `
        SELECT id, name, code, teacher_id, semester 
        FROM subjects 
        WHERE teacher_id = $1
      `;
      const teacherSubjects = await client.unsafe(subjectsQuery, [decoded.id]);
      
      // Get total students
      const studentsQuery = `SELECT COUNT(*) as count FROM student_subjects`;
      const totalStudentsResult = await client.unsafe(studentsQuery);
      
      // Get attendance statistics using raw SQL
      const attendanceQuery = `
        SELECT 
          s.name as subject_name,
          COUNT(a.id) as attended,
          COUNT(ss.student_id) as total
        FROM subjects s
        LEFT JOIN student_subjects ss ON s.id = ss.subject_id
        LEFT JOIN attendance a ON (
          a.subject_id = s.id AND 
          a.student_id = ss.student_id AND 
          a.status = 'present'
        )
        WHERE s.teacher_id = $1
        GROUP BY s.name
      `;
      const attendanceStats = await client.unsafe(attendanceQuery, [decoded.id]);

      // Get pending leaves
      const leavesQuery = `SELECT COUNT(*) as count FROM leaves WHERE status = 'pending'`;
      const pendingLeavesResult = await client.unsafe(leavesQuery);

      // Calculate overall attendance rate
      const totalAttended = attendanceStats.reduce((sum, stat) => sum + (stat.attended || 0), 0);
      const totalPossible = attendanceStats.reduce((sum, stat) => sum + (stat.total || 0), 0);
      const attendanceRate = totalPossible > 0 ? (totalAttended / totalPossible) * 100 : 0;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          totalStudents: parseInt(totalStudentsResult[0]?.count || 0),
          totalSubjects: teacherSubjects.length,
          attendanceRate: Math.round(attendanceRate * 10) / 10,
          pendingLeaves: parseInt(pendingLeavesResult[0]?.count || 0),
          subjects: attendanceStats.map(stat => ({
            subjectName: stat.subject_name,
            attended: stat.attended || 0,
            total: stat.total || 0,
            percentage: stat.total > 0 ? Math.round((stat.attended / stat.total) * 100) : 0
          }))
        })
      };
    }

    if (httpMethod === 'GET' && path === '/api/student/dashboard') {
      if (decoded.role !== 'student') {
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Access denied' })
        };
      }

      // Get student's subjects using raw SQL
      const subjectsQuery = `
        SELECT s.name as subject_name, s.id as subject_id
        FROM student_subjects ss
        LEFT JOIN subjects s ON s.id = ss.subject_id
        WHERE ss.student_id = $1
      `;
      const studentSubjectsData = await client.unsafe(subjectsQuery, [decoded.id]);

      // Get attendance for each subject
      const attendanceData = await Promise.all(
        studentSubjectsData.map(async (subject) => {
          const attendanceQuery = `
            SELECT COUNT(*) as attended
            FROM attendance
            WHERE subject_id = $1 AND student_id = $2 AND status = 'present'
          `;
          const attendanceResult = await client.unsafe(attendanceQuery, [subject.subject_id, decoded.id]);

          return {
            subjectName: subject.subject_name,
            attended: parseInt(attendanceResult[0]?.attended || 0),
            total: 20, // Assuming 20 classes per subject
            percentage: Math.round(((parseInt(attendanceResult[0]?.attended || 0)) / 20) * 100)
          };
        })
      );

      // Calculate overall percentage
      const totalAttended = attendanceData.reduce((sum, data) => sum + data.attended, 0);
      const totalPossible = attendanceData.reduce((sum, data) => sum + data.total, 0);
      const overallPercentage = totalPossible > 0 ? (totalAttended / totalPossible) * 100 : 0;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          overallPercentage: Math.round(overallPercentage * 10) / 10,
          subjects: attendanceData
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
    console.error('Dashboard function error:', error);
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
