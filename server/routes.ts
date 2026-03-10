import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

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
      
      // In a real app we'd compare hashed passwords
      if (!user || user.password !== password) {
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
    res.status(200).json(students.map(s => {
      const { password, ...rest } = s;
      return rest;
    }));
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

  app.post(api.student.applyLeave.path, authenticateJWT, requireRole('student'), upload.single('document'), async (req, res) => {
    try {
      const studentId = (req as any).user.id;
      const { type, reason, date } = req.body;
      const documentUrl = req.file ? `/uploads/${req.file.filename}` : null;

      const leave = await storage.applyLeave({
        studentId,
        type,
        reason,
        date: new Date(date),
        documentUrl
      });
      
      res.status(201).json(leave);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Seed DB script to run on startup
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const teacher = await storage.getUserByUsername("T001");
  if (!teacher) {
    const t = await storage.createUser({
      username: "T001",
      password: "password",
      role: "teacher",
      name: "Dr. Smith"
    });
    const s1 = await storage.createUser({
      username: "S001",
      password: "password",
      role: "student",
      name: "Alice Johnson"
    });
    const s2 = await storage.createUser({
      username: "S002",
      password: "password",
      role: "student",
      name: "Bob Williams"
    });

    const sub1 = await storage.createSubject({
      name: "Computer Science 101",
      code: "CS101",
      teacherId: t.id,
      semester: 1
    });

    await storage.assignStudentToSubject(s1.id, sub1.id);
    await storage.assignStudentToSubject(s2.id, sub1.id);

    await storage.markAttendance([
      { subjectId: sub1.id, studentId: s1.id, date: new Date(), timeSlot: "10:00 AM", status: "present" },
      { subjectId: sub1.id, studentId: s2.id, date: new Date(), timeSlot: "10:00 AM", status: "absent" }
    ]);
  }
}
