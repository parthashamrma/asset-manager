import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, subjects, attendance, studentSubjects, leaves } from '../../shared/schema.js';
import { eq, and, count, sum } from 'drizzle-orm';
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

      // Get teacher's subjects
      const teacherSubjects = await db.select().from(subjects).where(eq(subjects.teacherId, decoded.id));
      
      // Get total students
      const totalStudents = await db.select({ count: count() }).from(studentSubjects);
      
      // Get attendance statistics
      const attendanceStats = await db.select({
        subjectName: subjects.name,
        attended: count(attendance.id),
        total: count(studentSubjects.studentId)
      })
      .from(subjects)
      .leftJoin(studentSubjects, eq(subjects.id, studentSubjects.subjectId))
      .leftJoin(attendance, and(
        eq(attendance.subjectId, subjects.id),
        eq(attendance.studentId, studentSubjects.studentId),
        eq(attendance.status, 'present')
      ))
      .where(eq(subjects.teacherId, decoded.id))
      .groupBy(subjects.name);

      // Get pending leaves
      const pendingLeaves = await db.select({ count: count() }).from(leaves).where(eq(leaves.status, 'pending'));

      // Calculate overall attendance rate
      const totalAttended = attendanceStats.reduce((sum, stat) => sum + (stat.attended || 0), 0);
      const totalPossible = attendanceStats.reduce((sum, stat) => sum + (stat.total || 0), 0);
      const attendanceRate = totalPossible > 0 ? (totalAttended / totalPossible) * 100 : 0;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          totalStudents: totalStudents[0]?.count || 0,
          totalSubjects: teacherSubjects.length,
          attendanceRate: Math.round(attendanceRate * 10) / 10,
          pendingLeaves: pendingLeaves[0]?.count || 0,
          subjects: attendanceStats.map(stat => ({
            subjectName: stat.subjectName,
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

      // Get student's subjects
      const studentSubjectsData = await db.select({
        subjectName: subjects.name,
        subjectId: subjects.id
      })
      .from(studentSubjects)
      .leftJoin(subjects, eq(subjects.id, studentSubjects.subjectId))
      .where(eq(studentSubjects.studentId, decoded.id));

      // Get attendance for each subject
      const attendanceData = await Promise.all(
        studentSubjectsData.map(async (subject) => {
          const attendanceRecords = await db.select({
            attended: count(attendance.id)
          })
          .from(attendance)
          .where(and(
            eq(attendance.subjectId, subject.subjectId),
            eq(attendance.studentId, decoded.id),
            eq(attendance.status, 'present')
          ));

          return {
            subjectName: subject.subjectName,
            attended: attendanceRecords[0]?.attended || 0,
            total: 20, // Assuming 20 classes per subject
            percentage: Math.round(((attendanceRecords[0]?.attended || 0) / 20) * 100)
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
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}
