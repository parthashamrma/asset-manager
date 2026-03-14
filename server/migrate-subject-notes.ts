import "dotenv/config";
import { db } from "./db";
import { subjectNotes } from "../shared/schema-notes";

async function migrateSubjectNotes() {
  try {
    console.log("🔧 Creating subject notes table...");
    
    // Create subject_notes table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS subject_notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        unit VARCHAR(100) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        subject_id INTEGER NOT NULL REFERENCES subjects(id),
        teacher_id INTEGER NOT NULL REFERENCES users(id),
        file_url TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("✅ Subject notes table created successfully!");
    
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

migrateSubjectNotes().then(() => {
  console.log("🎉 Subject notes migration completed!");
  process.exit(0);
});
