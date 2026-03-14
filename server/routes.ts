import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import jwt from "jsonwebtoken";
import multer, { diskStorage } from "multer";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import * as XLSX from 'xlsx';
import { db } from "./db";
import { users, subjects, studentSubjects, attendance, leaves } from "../shared/schema";
import { eq } from "drizzle-orm";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Setup multer for file uploads (PDF only)
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    // Accept PDF files only
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      // Ensure .pdf extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
    }
  })
});

const JWT_SECRET = process.env.SESSION_SECRET || 'supersecretjwtkey';

// Middleware to check JWT
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    (req as any).user = user;
    next();
  });
};

const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const express = (await import("express")).default;
  const cookieParser = (await import("cookie-parser")).default;
  
  app.use(cookieParser());
  app.use('/uploads', express.static('uploads'));

  // AUTH ROUTES
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { username, password } = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      // Compare hashed passwords
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json({ user: userWithoutPassword });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(input);
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.auth.me.path, authenticateJWT, async (req, res) => {
    const jwtUser = (req as any).user;
    const user = await storage.getUser(jwtUser.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });
  });

  app.post(api.auth.logout.path, (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: "Logged out" });
  });

  // TEACHER ROUTES
  app.get(api.teacher.subjects.path, authenticateJWT, requireRole('teacher'), async (req, res) => {
    const user = (req as any).user;
    const subjects = await storage.getSubjectsByTeacher(user.id);
    res.status(200).json(subjects);
  });

  app.get(api.teacher.subjectStudents.path, authenticateJWT, requireRole('teacher'), async (req, res) => {
    const subjectId = parseInt(req.params.id);
    const students = await storage.getStudentsBySubject(subjectId);
    res.status(200).json(students);
  });

  app.post(api.teacher.markAttendance.path, authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const { subjectId, date, timeSlot, records } = api.teacher.markAttendance.input.parse(req.body);
      const insertRecords = records.map(r => ({
        subjectId,
        date: new Date(date),
        timeSlot,
        studentId: r.studentId,
        status: r.status
      }));

      await storage.markAttendance(insertRecords);
      res.status(201).json({ message: "Attendance marked successfully" });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.teacher.leaves.path, authenticateJWT, requireRole('teacher'), async (req, res) => {
    const leaves = await storage.getAllPendingLeaves();
    res.status(200).json(leaves);
  });

  app.get('/api/teacher/attendance/:subjectId', authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const subjectId = parseInt(req.params.subjectId);
      const date = req.query.date as string;
      
      let attendanceRecords;
      if (date) {
        // Get attendance for specific date
        attendanceRecords = await storage.getAttendanceBySubjectAndDate(subjectId, new Date(date));
      } else {
        // Get all attendance for subject
        attendanceRecords = await storage.getAttendanceBySubject(subjectId);
      }
      
      // Join with student information
      const recordsWithStudents = await Promise.all(
        attendanceRecords.map(async (record) => {
          const student = await storage.getUser(record.studentId);
          return {
            ...record,
            studentName: student?.name || 'Unknown',
            rollNumber: student?.username || 'Unknown'
          };
        })
      );
      
      res.status(200).json(recordsWithStudents);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  app.post(api.teacher.updateLeave.path, authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const { status } = api.teacher.updateLeave.input.parse(req.body);
      const id = parseInt(req.params.id);
      const updated = await storage.updateLeaveStatus(id, status);
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.teacher.analytics.path, authenticateJWT, requireRole('teacher'), async (req, res) => {
    // Generate analytics
    const teacherId = (req as any).user.id;
    const subjects = await storage.getSubjectsByTeacher(teacherId);
    
    const trends = [];
    const lowAttendance = [];

    for (const sub of subjects) {
      const attendance = await storage.getAttendanceBySubject(sub.id);
      const students = await storage.getStudentsBySubject(sub.id);
      
      if (attendance.length > 0) {
        const presentOrExcused = attendance.filter(a => a.status === 'present' || a.status === 'excused').length;
        trends.push({
          subject: sub.name,
          attendancePercentage: (presentOrExcused / attendance.length) * 100
        });
      } else {
        trends.push({ subject: sub.name, attendancePercentage: 0 });
      }

      // Check low attendance for students in this subject
      // Simplified: per subject attendance
      const subjectSessions = new Set(attendance.map(a => a.date.toISOString() + a.timeSlot)).size;
      if (subjectSessions > 0) {
        for (const student of students) {
          const studentAtt = attendance.filter(a => a.studentId === student.id);
          const attended = studentAtt.filter(a => a.status === 'present' || a.status === 'excused').length;
          const percentage = (attended / subjectSessions) * 100;
          if (percentage < 75) {
            lowAttendance.push({
              studentName: student.name,
              rollNumber: student.username,
              percentage
            });
          }
        }
      }
    }

    res.status(200).json({ trends, lowAttendance });
  });

  // STUDENT ROUTES
  app.get(api.student.dashboard.path, authenticateJWT, requireRole('student'), async (req, res) => {
    const studentId = (req as any).user.id;
    const subjects = await storage.getStudentSubjects(studentId);
    const allAttendance = await storage.getAttendanceByStudent(studentId);

    let totalClasses = 0;
    let totalAttendedOrExcused = 0;
    const subjectStats = [];

    for (const sub of subjects) {
      // Find all sessions for this subject
      const subjectAllAttendance = await storage.getAttendanceBySubject(sub.id);
      const subjectSessions = new Set(subjectAllAttendance.map(a => a.date.toISOString() + a.timeSlot)).size;
      
      const studentAtt = allAttendance.filter(a => a.subjectId === sub.id);
      const attended = studentAtt.filter(a => a.status === 'present' || a.status === 'excused').length;
      const missed = studentAtt.filter(a => a.status === 'absent').length;
      
      // Calculate missing from subjectSessions if student has no record (assumed absent or not recorded)
      const trueMissed = subjectSessions - attended; 

      totalClasses += subjectSessions;
      totalAttendedOrExcused += attended;

      subjectStats.push({
        subjectName: sub.name,
        attended,
        missed: trueMissed,
        total: subjectSessions,
        percentage: subjectSessions > 0 ? (attended / subjectSessions) * 100 : 0
      });
    }

    const overallPercentage = totalClasses > 0 ? (totalAttendedOrExcused / totalClasses) * 100 : 0;

    res.status(200).json({
      overallPercentage,
      subjects: subjectStats
    });
  });

  app.get(api.student.leaves.path, authenticateJWT, requireRole('student'), async (req, res) => {
    const studentId = (req as any).user.id;
    const leaves = await storage.getLeavesByStudent(studentId);
    res.status(200).json(leaves);
  });

  app.post('/api/student/leaves/apply', authenticateJWT, requireRole('student'), upload.single('document'), async (req, res) => {
    try {
      const studentId = (req as any).user.id;
      const { type, reason, date } = req.body;
      const documentUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const leave = await storage.applyLeave({
        studentId,
        type,
        reason,
        date: new Date(date),
        documentUrl,
        status: 'pending'
      });
      
      res.status(201).json(leave);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Seed DB script to run on startup - DISABLED to prevent dummy data
  // seedDatabase().catch(console.error);

  app.get('/api/teacher/download-attendance/:subjectId', authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const subjectId = parseInt(req.params.subjectId);
      const date = req.query.date as string;
      
      let attendanceRecords;
      if (date) {
        attendanceRecords = await storage.getAttendanceBySubjectAndDate(subjectId, new Date(date));
      } else {
        attendanceRecords = await storage.getAttendanceBySubject(subjectId);
      }
      
      // Join with student information
      const recordsWithStudents = await Promise.all(
        attendanceRecords.map(async (record) => {
          const student = await storage.getUser(record.studentId);
          return {
            ...record,
            studentName: student?.name || 'Unknown',
            rollNumber: student?.username || 'Unknown'
          };
        })
      );
      
      // Create Excel workbook with proper formatting
      const wb = XLSX.utils.book_new();
      
      // Create CSV-style data (tab-separated values)
      const csvData = recordsWithStudents.map(record => [
        record.date.toISOString().split('T')[0],
        record.timeSlot || '',
        record.studentName || '',
        record.rollNumber || '',
        record.status || ''
      ]);
      
      // Add headers as first row
      const headers = ['Date', 'Time Slot', 'Student Name', 'Roll Number', 'Status'];
      const allData = [headers, ...csvData];
      
      const ws = XLSX.utils.aoa_to_sheet(allData);
      
      // Set column widths
      const colWidths = [
        { wch: 15 }, // Date
        { wch: 20 }, // Time Slot
        { wch: 35 }, // Student Name
        { wch: 18 }, // Roll Number
        { wch: 12 }  // Status
      ];
      ws['!cols'] = colWidths;
      
      wb.SheetNames.push('Attendance Records');
      wb.Sheets.push(ws);
      
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const dateStr = date || '';
      res.setHeader('Content-Disposition', `attachment; filename="attendance-${subjectId}${dateStr ? `-${dateStr}` : ''}.xlsx"`);
      res.send(excelBuffer);
    } catch (error: any) {
      console.error('Excel download error:', error);
      res.status(500).json({ message: "Failed to download Excel file: " + error.message });
    }
  });

  // Assignment routes
  app.post('/api/teacher/assignments', authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const teacherId = (req as any).user.id;
      const { title, description, subjectId, dueDate, maxScore = 10 } = req.body;
      
      const assignment = await storage.createAssignment({
        title,
        description,
        subjectId,
        teacherId,
        dueDate: new Date(dueDate),
        maxScore
      });
      
      res.status(201).json(assignment);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create assignment" });
    }
  });

  app.get('/api/teacher/assignments', authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const teacherId = (req as any).user.id;
      const assignments = await storage.getAssignmentsByTeacher(teacherId);
      res.status(200).json(assignments);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get('/api/student/assignments', authenticateJWT, requireRole('student'), async (req, res) => {
    try {
      const studentId = (req as any).user.id;
      const assignments = await storage.getAssignmentsByStudent(studentId);
      res.status(200).json(assignments);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post('/api/student/assignments/:id/submit', authenticateJWT, requireRole('student'), upload.single('file'), async (req, res) => {
    try {
      const studentId = (req as any).user.id;
      const assignmentId = parseInt(req.params.id);
      const { content } = req.body;
      const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
      
      const submission = await storage.submitAssignment({
        assignmentId,
        studentId,
        content,
        fileUrl
      });
      
      res.status(201).json(submission);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to submit assignment" });
    }
  });

  app.get('/api/teacher/assignments/:id/submissions', authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const submissions = await storage.getSubmissionsByAssignment(assignmentId);
      
      // Join with student information
      const submissionsWithStudents = await Promise.all(
        submissions.map(async (submission) => {
          const student = await storage.getUser(submission.studentId);
          return {
            ...submission,
            studentName: student?.name || 'Unknown',
            rollNumber: student?.username || 'Unknown'
          };
        })
      );
      
      res.status(200).json(submissionsWithStudents);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post('/api/teacher/submissions/:id/grade', authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const { score, feedback } = req.body;
      
      const gradedSubmission = await storage.gradeSubmission(submissionId, score, feedback);
      res.status(200).json(gradedSubmission);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to grade submission" });
    }
  });

  app.get('/api/student/submissions', authenticateJWT, requireRole('student'), async (req, res) => {
    try {
      const studentId = (req as any).user.id;
      const submissions = await storage.getSubmissionsByStudent(studentId);
      res.status(200).json(submissions);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Teacher notes routes
  app.post('/api/teacher/notes', authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const teacherId = (req as any).user.id;
      const { studentId, subjectId, note, type = 'general', isPrivate = false } = req.body;
      
      // If "all" students selected, create notes for all students in the subject
      if (studentId === 'all') {
        const students = await storage.getStudentsBySubject(parseInt(subjectId));
        const notes = [];
        
        for (const student of students) {
          const teacherNote = await storage.createTeacherNote({
            teacherId,
            studentId: student.studentId,
            subjectId: parseInt(subjectId),
            note,
            type,
            isPrivate
          });
          notes.push(teacherNote);
        }
        
        res.status(201).json({ message: `Notes created for ${notes.length} students`, notes });
      } else {
        // Create note for single student
        const teacherNote = await storage.createTeacherNote({
          teacherId,
          studentId: parseInt(studentId),
          subjectId: parseInt(subjectId),
          note,
          type,
          isPrivate
        });
        
        res.status(201).json(teacherNote);
      }
    } catch (error: any) {
      res.status(400).json({ message: "Failed to create note" });
    }
  });

  app.get('/api/teacher/notes', authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const teacherId = (req as any).user.id;
      const notes = await storage.getNotesByTeacher(teacherId);
      
      // Join with student information
      const notesWithStudents = await Promise.all(
        notes.map(async (note) => {
          const student = await storage.getUser(note.studentId);
          const subject = await db.select().from(subjects).where(eq(subjects.id, note.subjectId)).limit(1);
          return {
            ...note,
            studentName: student?.name || 'Unknown',
            rollNumber: student?.username || 'Unknown',
            subjectName: subject[0]?.name || 'Unknown'
          };
        })
      );
      
      res.status(200).json(notesWithStudents);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get('/api/student/notes', authenticateJWT, requireRole('student'), async (req, res) => {
    try {
      const studentId = (req as any).user.id;
      const notes = await storage.getNotesByStudent(studentId);
      
      // Filter out private notes and join with teacher/subject info
      const publicNotes = notes.filter(note => !note.isPrivate);
      const notesWithDetails = await Promise.all(
        publicNotes.map(async (note) => {
          const teacher = await storage.getUser(note.teacherId);
          const subject = await db.select().from(subjects).where(eq(subjects.id, note.subjectId)).limit(1);
          return {
            ...note,
            teacherName: teacher?.name || 'Unknown',
            subjectName: subject[0]?.name || 'Unknown'
          };
        })
      );
      
      res.status(200).json(notesWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  // Subject Notes routes
  app.post('/api/teacher/subject-notes', authenticateJWT, requireRole('teacher'), upload.single('file'), async (req, res) => {
    try {
      const teacherId = (req as any).user.id;
      const { title, content, unit, topic, subjectId, isPublic } = req.body;
      
      const noteData = {
        title,
        content,
        unit,
        topic,
        subjectId: parseInt(subjectId),
        teacherId,
        isPublic: isPublic === 'true',
        fileUrl: req.file ? `/uploads/${req.file.filename}` : undefined
      };
      
      const subjectNote = await storage.createSubjectNote(noteData);
      res.status(201).json(subjectNote);
    } catch (error: any) {
      console.error('Create subject note error:', error);
      res.status(400).json({ message: "Failed to create subject note: " + error.message });
    }
  });

  app.get('/api/teacher/subject-notes', authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const teacherId = (req as any).user.id;
      const notes = await storage.getSubjectNotesByTeacher(teacherId);
      
      // Join with subject info
      const notesWithDetails = await Promise.all(
        notes.map(async (note) => {
          const subject = await db.select().from(subjects).where(eq(subjects.id, note.subjectId)).limit(1);
          return {
            ...note,
            subjectName: subject[0]?.name || 'Unknown'
          };
        })
      );
      
      res.status(200).json(notesWithDetails);
    } catch (error: any) {
      console.error('Fetch subject notes error:', error);
      res.status(500).json({ message: "Failed to fetch subject notes" });
    }
  });

  app.get('/api/student/subject-notes', authenticateJWT, requireRole('student'), async (req, res) => {
    try {
      const studentId = (req as any).user.id;
      const notes = await storage.getSubjectNotesByStudent(studentId);
      
      // Join with teacher and subject info
      const notesWithDetails = await Promise.all(
        notes.map(async (note) => {
          const teacher = await storage.getUser(note.teacherId);
          const subject = await db.select().from(subjects).where(eq(subjects.id, note.subjectId)).limit(1);
          return {
            ...note,
            teacherName: teacher?.name || 'Unknown',
            subjectName: subject[0]?.name || 'Unknown'
          };
        })
      );
      
      res.status(200).json(notesWithDetails);
    } catch (error: any) {
      console.error('Fetch student subject notes error:', error);
      res.status(500).json({ message: "Failed to fetch subject notes" });
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));

  return httpServer;
}
