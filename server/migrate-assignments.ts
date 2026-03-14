import "dotenv/config";
import { db } from "./db";
import { assignments, assignmentSubmissions, teacherNotes } from "../shared/schema";

async function migrateAssignments() {
  try {
    console.log("🔧 Creating assignment and notes tables...");
    
    // Create assignments table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        subject_id INTEGER NOT NULL REFERENCES subjects(id),
        teacher_id INTEGER NOT NULL REFERENCES users(id),
        due_date TIMESTAMP NOT NULL,
        max_score INTEGER DEFAULT 10,
        file_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create assignment_submissions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES assignments(id),
        student_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        file_url TEXT,
        score INTEGER,
        submitted_at TIMESTAMP DEFAULT NOW(),
        graded_at TIMESTAMP,
        feedback TEXT,
        status VARCHAR(50) DEFAULT 'submitted'
      )
    `);
    
    // Create teacher_notes table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS teacher_notes (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL REFERENCES users(id),
        student_id INTEGER NOT NULL REFERENCES users(id),
        subject_id INTEGER NOT NULL REFERENCES subjects(id),
        note TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'general',
        is_private BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("✅ Assignment and notes tables created successfully!");
    
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

migrateAssignments().then(() => {
  console.log("🎉 Migration completed!");
  process.exit(0);
});
