import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Faculty ID or Roll Number
  password: text("password").notNull(),
  role: text("role").notNull(), // 'teacher' | 'student'
  name: text("name").notNull(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  teacherId: integer("teacher_id").notNull(),
  semester: integer("semester").notNull(),
});

export const studentSubjects = pgTable("student_subjects", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  subjectId: integer("subject_id").notNull(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  studentId: integer("student_id").notNull(),
  date: timestamp("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  status: text("status").notNull(), // 'present', 'absent', 'excused'
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  type: text("type").notNull(), // 'medical', 'personal'
  reason: text("reason").notNull(),
  documentUrl: text("document_url"), // For medical certificates
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
});

export const usersRelations = relations(users, ({ many }) => ({
  subjects: many(subjects),
  studentSubjects: many(studentSubjects),
  attendance: many(attendance),
  leaves: many(leaves),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  teacher: one(users, {
    fields: [subjects.teacherId],
    references: [users.id],
  }),
  students: many(studentSubjects),
  attendance: many(attendance),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertLeaveSchema = createInsertSchema(leaves).omit({ id: true, status: true });

export type User = typeof users.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type StudentSubject = typeof studentSubjects.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Leave = typeof leaves.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;
