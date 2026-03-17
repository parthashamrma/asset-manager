-- Asset Manager Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Student Subjects (enrollment)
CREATE TABLE IF NOT EXISTS student_subjects (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'excused')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('personal', 'medical')),
  reason TEXT NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  document_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Assignment Submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded')),
  grade VARCHAR(10),
  feedback TEXT,
  graded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subject Notes table
CREATE TABLE IF NOT EXISTS subject_notes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  unit VARCHAR(100) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teacher Notes table (if using)
CREATE TABLE IF NOT EXISTS teacher_notes (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('general', 'behavioral', 'academic')),
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id::text);

-- Create policies for subjects
CREATE POLICY "Teachers can view own subjects" ON subjects
  FOR SELECT USING (auth.uid() = teacher_id::text);

CREATE POLICY "Teachers can update own subjects" ON subjects
  FOR ALL USING (auth.uid() = teacher_id::text);

-- Create policies for student_subjects
CREATE POLICY "Students can view own enrollments" ON student_subjects
  FOR SELECT USING (auth.uid() = student_id::text);

-- Create policies for attendance
CREATE POLICY "Teachers can manage attendance" ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM subjects 
      WHERE subjects.id = attendance.subject_id 
      AND subjects.teacher_id = auth.uid()::text
    )
  );

CREATE POLICY "Students can view own attendance" ON attendance
  FOR SELECT USING (auth.uid() = student_id::text);

-- Create policies for leaves
CREATE POLICY "Students can manage own leaves" ON leaves
  FOR ALL USING (auth.uid() = student_id::text);

CREATE POLICY "Teachers can view student leaves" ON leaves
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM student_subjects ss
      JOIN subjects s ON s.id = ss.subject_id
      WHERE ss.student_id = leaves.student_id 
      AND s.teacher_id = auth.uid()::text
    )
  );

-- Create policies for assignments
CREATE POLICY "Teachers can manage own assignments" ON assignments
  FOR ALL USING (auth.uid() = (SELECT teacher_id FROM subjects WHERE id = assignments.subject_id));

CREATE POLICY "Students can view relevant assignments" ON assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM student_subjects 
      WHERE student_id = auth.uid()::text 
      AND subject_id = assignments.subject_id
    )
  );

-- Create policies for assignment_submissions
CREATE POLICY "Students can manage own submissions" ON assignment_submissions
  FOR ALL USING (auth.uid() = student_id::text);

CREATE POLICY "Teachers can view submissions" ON assignment_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subjects 
      WHERE subjects.id = assignment_submissions.assignment_id 
      AND subjects.teacher_id = auth.uid()::text
    )
  );

-- Create policies for subject_notes
CREATE POLICY "Teachers can manage own notes" ON subject_notes
  FOR ALL USING (auth.uid() = teacher_id::text);

CREATE POLICY "Students can view public notes" ON subject_notes
  FOR SELECT USING (
    is_public = true 
    AND EXISTS (
      SELECT 1 FROM student_subjects 
      WHERE student_id = auth.uid()::text 
      AND subject_id = subject_notes.subject_id
    )
  );

-- Create policies for teacher_notes
CREATE POLICY "Teachers can manage own notes" ON teacher_notes
  FOR ALL USING (auth.uid() = teacher_id::text);

CREATE POLICY "Students can view own notes" ON teacher_notes
  FOR SELECT USING (auth.uid() = student_id::text);
