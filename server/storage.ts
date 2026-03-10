import { db } from "./db";
import {
  users, subjects, studentSubjects, attendance, leaves,
  type User, type InsertUser, type Subject, type InsertSubject,
  type StudentSubject, type Attendance, type InsertAttendance,
  type Leave, type InsertLeave
} from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getSubjectsByTeacher(teacherId: number): Promise<Subject[]>;
  getStudentsBySubject(subjectId: number): Promise<User[]>;
  getStudentSubjects(studentId: number): Promise<Subject[]>;
  
  createSubject(subject: InsertSubject): Promise<Subject>;
  assignStudentToSubject(studentId: number, subjectId: number): Promise<void>;

  markAttendance(records: InsertAttendance[]): Promise<void>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceBySubject(subjectId: number): Promise<Attendance[]>;

  applyLeave(leave: InsertLeave): Promise<Leave>;
  getLeavesByStudent(studentId: number): Promise<Leave[]>;
  getAllPendingLeaves(): Promise<Leave[]>;
  updateLeaveStatus(id: number, status: string): Promise<Leave>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getSubjectsByTeacher(teacherId: number): Promise<Subject[]> {
    return db.select().from(subjects).where(eq(subjects.teacherId, teacherId));
  }

  async getStudentsBySubject(subjectId: number): Promise<User[]> {
    const mappings = await db.select().from(studentSubjects).where(eq(studentSubjects.subjectId, subjectId));
    const studentIds = mappings.map(m => m.studentId);
    if (studentIds.length === 0) return [];
    
    return db.select().from(users).where(inArray(users.id, studentIds));
  }

  async getStudentSubjects(studentId: number): Promise<Subject[]> {
    const mappings = await db.select().from(studentSubjects).where(eq(studentSubjects.studentId, studentId));
    const subjectIds = mappings.map(m => m.subjectId);
    if (subjectIds.length === 0) return [];
    
    return db.select().from(subjects).where(inArray(subjects.id, subjectIds));
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [s] = await db.insert(subjects).values(subject).returning();
    return s;
  }

  async assignStudentToSubject(studentId: number, subjectId: number): Promise<void> {
    await db.insert(studentSubjects).values({ studentId, subjectId });
  }

  async markAttendance(records: InsertAttendance[]): Promise<void> {
    if (records.length === 0) return;
    await db.insert(attendance).values(records);
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }

  async getAttendanceBySubject(subjectId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.subjectId, subjectId));
  }

  async applyLeave(leave: InsertLeave): Promise<Leave> {
    const [l] = await db.insert(leaves).values(leave).returning();
    return l;
  }

  async getLeavesByStudent(studentId: number): Promise<Leave[]> {
    return db.select().from(leaves).where(eq(leaves.studentId, studentId));
  }

  async getAllPendingLeaves(): Promise<Leave[]> {
    return db.select().from(leaves).where(eq(leaves.status, "pending"));
  }

  async updateLeaveStatus(id: number, status: string): Promise<Leave> {
    const [l] = await db.update(leaves)
      .set({ status })
      .where(eq(leaves.id, id))
      .returning();
    return l;
  }
}

export const storage = new DatabaseStorage();