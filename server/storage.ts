import "dotenv/config";
import { db } from "./db";
import { 
  users, 
  subjects, 
  studentSubjects, 
  attendance, 
  leaves,
  assignments,
  assignmentSubmissions,
  teacherNotes
} from "../shared/schema";
import { subjectNotes } from "../shared/schema-notes";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import type { 
  User, 
  InsertUser,
  Subject, 
  InsertSubject,
  StudentSubject, 
  Attendance, 
  InsertAttendance,
  Leave,
  InsertLeave,
  Assignment,
  InsertAssignment,
  AssignmentSubmission,
  InsertAssignmentSubmission,
  TeacherNote,
  InsertTeacherNote,
  SubjectNote,
  InsertSubjectNote,
  UpdateSubjectNote
} from "../shared/schema";

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

  async getStudentsBySubject(subjectId: number): Promise<Array<{studentId: number, studentName: string, rollNumber: string}>> {
    const mappings = await db.select().from(studentSubjects).where(eq(studentSubjects.subjectId, subjectId));
    const studentIds = mappings.map(m => m.studentId);
    if (studentIds.length === 0) return [];
    
    // Use OR conditions instead of inArray
    const conditions = studentIds.map((id: number) => eq(users.id, id));
    const students = await db.select().from(users).where(or(...conditions));
    return students.map(student => ({
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.username
    }));
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

  async getAllPendingLeaves(): Promise<Array<Leave & { studentName: string, studentId: number, rollNumber: string }>> {
    const pendingLeaves = await db
      .select({
        id: leaves.id,
        studentId: leaves.studentId,
        date: leaves.date,
        reason: leaves.reason,
        status: leaves.status,
        type: leaves.type,
        documentUrl: leaves.documentUrl,
        studentName: users.name,
        rollNumber: users.username
      })
      .from(leaves)
      .leftJoin(users, eq(leaves.studentId, users.id))
      .where(eq(leaves.status, "pending"));
    
    return pendingLeaves;
  }

  async getAttendanceBySubjectAndDate(subjectId: number, date: Date): Promise<Attendance[]> {
    const targetDate = date.toISOString().split('T')[0];
    return db.select().from(attendance)
      .where(eq(attendance.subjectId, subjectId))
      .where(sql`DATE(${attendance.date}) = ${targetDate}`);
  }

  async updateLeaveStatus(id: number, status: string): Promise<Leave> {
    const [l] = await db.update(leaves)
      .set({ status })
      .where(eq(leaves.id, id))
      .returning();
    return l;
  }

  // Assignment methods
  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [a] = await db.insert(assignments).values(assignment).returning();
    return a;
  }

  async getAssignmentsByTeacher(teacherId: number): Promise<Assignment[]> {
    return db.select().from(assignments).where(eq(assignments.teacherId, teacherId));
  }

  async getAssignmentsByStudent(studentId: number): Promise<Assignment[]> {
    // Get assignments for subjects the student is enrolled in
    const studentSubjectEnrollments = await db.select().from(studentSubjects)
      .where(eq(studentSubjects.studentId, studentId));
    
    const subjectIds = studentSubjectEnrollments.map(ss => ss.subjectId);
    
    if (subjectIds.length === 0) return [];
    
    // Use a simpler approach with OR conditions
    const conditions = subjectIds.map((id: number) => eq(assignments.subjectId, id));
    return db.select().from(assignments)
      .where(or(...conditions));
  }

  async getAssignmentById(id: number): Promise<Assignment | null> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment || null;
  }

  async submitAssignment(submission: InsertAssignmentSubmission): Promise<AssignmentSubmission> {
    const [s] = await db.insert(assignmentSubmissions).values(submission).returning();
    return s;
  }

  async getSubmissionsByAssignment(assignmentId: number): Promise<AssignmentSubmission[]> {
    return db.select().from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.assignmentId, assignmentId));
  }

  async getSubmissionsByStudent(studentId: number): Promise<AssignmentSubmission[]> {
    return db.select().from(assignmentSubmissions)
      .where(eq(assignmentSubmissions.studentId, studentId));
  }

  async gradeSubmission(submissionId: number, score: number, feedback: string): Promise<AssignmentSubmission> {
    const [s] = await db.update(assignmentSubmissions)
      .set({ 
        score, 
        feedback, 
        status: 'graded',
        gradedAt: new Date()
      })
      .where(eq(assignmentSubmissions.id, submissionId))
      .returning();
    return s;
  }

  // Teacher notes methods
  async createTeacherNote(note: InsertTeacherNote): Promise<TeacherNote> {
    const [n] = await db.insert(teacherNotes).values(note).returning();
    return n;
  }

  async getNotesByTeacher(teacherId: number): Promise<TeacherNote[]> {
    return db.select().from(teacherNotes).where(eq(teacherNotes.teacherId, teacherId));
  }

  async getNotesByStudent(studentId: number): Promise<TeacherNote[]> {
    return db.select().from(teacherNotes)
      .where(eq(teacherNotes.studentId, studentId));
  }

  async getNotesByStudentAndSubject(studentId: number, subjectId: number): Promise<TeacherNote[]> {
    return db.select().from(teacherNotes)
      .where(and(
        eq(teacherNotes.studentId, studentId),
        eq(teacherNotes.subjectId, subjectId)
      ));
  }

  // Subject Notes methods
  async createSubjectNote(note: InsertSubjectNote): Promise<SubjectNote> {
    const [createdNote] = await db.insert(subjectNotes).values(note).returning();
    return createdNote;
  }

  async getSubjectNotesByTeacher(teacherId: number): Promise<SubjectNote[]> {
    return db.select().from(subjectNotes).where(eq(subjectNotes.teacherId, teacherId));
  }

  async getSubjectNotesBySubject(subjectId: number): Promise<SubjectNote[]> {
    return db.select().from(subjectNotes)
      .where(and(
        eq(subjectNotes.subjectId, subjectId),
        eq(subjectNotes.isPublic, true)
      ));
  }

  async getSubjectNotesByStudent(studentId: number): Promise<SubjectNote[]> {
    // Get subjects the student is enrolled in
    const studentSubjectEnrollments = await db.select().from(studentSubjects)
      .where(eq(studentSubjects.studentId, studentId));
    
    const subjectIds = studentSubjectEnrollments.map(ss => ss.subjectId);
    
    if (subjectIds.length === 0) return [];
    
    // Use OR conditions to get notes for all enrolled subjects
    const conditions = subjectIds.map((id: number) => eq(subjectNotes.subjectId, id));
    return db.select().from(subjectNotes)
      .where(and(
        or(...conditions),
        eq(subjectNotes.isPublic, true)
      ));
  }

  async updateSubjectNote(id: number, updates: UpdateSubjectNote): Promise<SubjectNote> {
    const [updatedNote] = await db.update(subjectNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subjectNotes.id, id))
      .returning();
    return updatedNote;
  }

  async getLeavesByStatus(status: string): Promise<Leave[]> {
    return db.select().from(leaves)
      .where(eq(leaves.status, status))
      .orderBy(leaves.createdAt, 'desc');
  }

  async deleteSubjectNote(id: number): Promise<void> {
    await db.delete(subjectNotes).where(eq(subjectNotes.id, id));
  }
}

export const storage = new DatabaseStorage();