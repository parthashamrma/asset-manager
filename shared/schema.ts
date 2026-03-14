import { pgTable, text, serial, integer, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
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
  code: text("code").notNull(),
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
  studentId: integer("student_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  date: timestamp("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  status: text("status").notNull(), // 'present' | 'absent' | 'excused'
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  type: text("type").notNull(),
  reason: text("reason").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull(), // 'pending' | 'approved' | 'rejected'
  documentUrl: text("document_url"),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  subjectId: integer("subject_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  dueDate: timestamp("due_date").notNull(),
  maxScore: integer("max_score").default(10),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull(),
  studentId: integer("student_id").notNull(),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  score: integer("score"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  gradedAt: timestamp("graded_at"),
  feedback: text("feedback"),
  status: varchar("status").default("submitted") // submitted, graded, returned
});

export const teacherNotes = pgTable("teacher_notes", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  studentId: integer("student_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  note: text("note").notNull(),
  type: varchar("type").default("general"), // general, assignment, behavior, etc.
  isPrivate: boolean("is_private").default(false), // visible only to teacher
  createdAt: timestamp("created_at").defaultNow()
});

export const usersRelations = relations(users, ({ one, many }) => ({
  subjects: many(subjects),
  studentSubjects: many(studentSubjects),
  attendance: many(attendance),
  leaves: many(leaves),
  assignmentsCreated: many(assignments),
  assignmentSubmissions: many(assignmentSubmissions),
  teacherNotes: many(teacherNotes)
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  teacher: one(users, {
    fields: [subjects.teacherId],
    references: [users.id]
  }),
  studentSubjects: many(studentSubjects),
  attendance: many(attendance),
  assignments: many(assignments),
  teacherNotes: many(teacherNotes)
}));

export const studentSubjectsRelations = relations(studentSubjects, ({ one }) => ({
  student: one(users, {
    fields: [studentSubjects.studentId],
    references: [users.id]
  }),
  subject: one(subjects, {
    fields: [studentSubjects.subjectId],
    references: [subjects.id]
  })
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(users, {
    fields: [attendance.studentId],
    references: [users.id]
  }),
  subject: one(subjects, {
    fields: [attendance.subjectId],
    references: [subjects.id]
  })
}));

export const leavesRelations = relations(leaves, ({ one }) => ({
  student: one(users, {
    fields: [leaves.studentId],
    references: [users.id]
  })
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [assignments.subjectId],
    references: [subjects.id]
  }),
  teacher: one(users, {
    fields: [assignments.teacherId],
    references: [users.id]
  }),
  submissions: many(assignmentSubmissions)
}));

export const assignmentSubmissionsRelations = relations(assignmentSubmissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [assignmentSubmissions.assignmentId],
    references: [assignments.id]
  }),
  student: one(users, {
    fields: [assignmentSubmissions.studentId],
    references: [users.id]
  })
}));

export const teacherNotesRelations = relations(teacherNotes, ({ one }) => ({
  teacher: one(users, {
    fields: [teacherNotes.teacherId],
    references: [users.id]
  }),
  student: one(users, {
    fields: [teacherNotes.studentId],
    references: [users.id]
  }),
  subject: one(subjects, {
    fields: [teacherNotes.subjectId],
    references: [subjects.id]
  })
}));

export const insertUserSchema = createInsertSchema(users);
export const insertSubjectSchema = createInsertSchema(subjects);
export const insertStudentSubjectSchema = createInsertSchema(studentSubjects);
export const insertAttendanceSchema = createInsertSchema(attendance);
export const insertLeaveSchema = createInsertSchema(leaves);
export const insertAssignmentSchema = createInsertSchema(assignments);
export const insertAssignmentSubmissionSchema = createInsertSchema(assignmentSubmissions);
export const insertTeacherNoteSchema = createInsertSchema(teacherNotes);

export type User = typeof users.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type StudentSubject = typeof studentSubjects.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Leave = typeof leaves.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type TeacherNote = typeof teacherNotes.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type InsertAssignmentSubmission = z.infer<typeof insertAssignmentSubmissionSchema>;
export type InsertTeacherNote = z.infer<typeof insertTeacherNoteSchema>;

// Import and export subject notes
import { subjectNotes, insertSubjectNoteSchema, updateSubjectNoteSchema } from "./schema-notes";
export type SubjectNote = typeof subjectNotes.$inferSelect;
export type InsertSubjectNote = z.infer<typeof insertSubjectNoteSchema>;
export type UpdateSubjectNote = z.infer<typeof updateSubjectNoteSchema>;
