import { pgTable, serial, integer, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { subjects, users } from "./schema";

// Subject Notes table
export const subjectNotes = pgTable("subject_notes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  unit: varchar("unit", { length: 100 }).notNull(), // Unit 1, Unit 2, etc.
  topic: varchar("topic", { length: 255 }).notNull(), // Specific topic
  subjectId: integer("subject_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  fileUrl: text("file_url"), // Optional attachment
  isPublic: boolean("is_public").default(true), // Visible to students
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Relations
export const subjectNotesRelations = relations(subjectNotes, ({ one }) => ({
  subject: one(subjects, {
    fields: [subjectNotes.subjectId],
    references: [subjects.id]
  }),
  teacher: one(users, {
    fields: [subjectNotes.teacherId],
    references: [users.id]
  })
}));

// Zod schemas
export const insertSubjectNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  unit: z.string().min(1, "Unit is required"),
  topic: z.string().min(1, "Topic is required"),
  subjectId: z.number().min(1, "Subject ID is required"),
  teacherId: z.number().min(1, "Teacher ID is required"),
  fileUrl: z.string().optional(),
  isPublic: z.boolean().default(true)
});

export const updateSubjectNoteSchema = insertSubjectNoteSchema.partial();

// Types
export type SubjectNote = typeof subjectNotes.$inferSelect;
export type InsertSubjectNote = z.infer<typeof insertSubjectNoteSchema>;
export type UpdateSubjectNote = z.infer<typeof updateSubjectNoteSchema>;
