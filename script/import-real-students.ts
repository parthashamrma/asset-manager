import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, studentSubjects } from "../shared/schema";
import bcrypt from "bcrypt";
import fs from 'fs';

async function importRealStudents() {
  try {
    console.log("🎓 Importing real MCA students...");
    
    // Read CSV file
    const csvContent = fs.readFileSync('students-real.csv', 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error("CSV file must have header and at least one student row");
    }
    
    // Get all subjects for mapping
    const allSubjects = await db.select().from(subjects);
    console.log(`📚 Found ${allSubjects.length} subjects in database`);
    
    // Enroll all students in all core subjects (MCA 2nd Semester)
    const coreSubjects = [
      'MCA-6200', // Indian Knowledge System
      'MCA-6201', // Data Structure using C
      'MCA-6202', // Java Programming
      'MCA-6203', // Operating System
      'MCA-6204', // Computer Networks
      'MCA-6205'  // Web Technologies
    ];
    
    const subjectMap = new Map();
    allSubjects.forEach(s => {
      subjectMap.set(s.code, s.id);
    });
    
    // Process students
    const students: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length < 2) continue; // Skip invalid rows
      
      const [id, name] = values;
      
      students.push({
        id,
        name,
        subjects: coreSubjects
      });
    }
    
    console.log(`📄 Found ${students.length} students to import`);
    
    // Import students
    let successCount = 0;
    let errorCount = 0;
    
    for (const studentData of students) {
      try {
        // Create student account
        const hashedPassword = await bcrypt.hash(studentData.id, 10); // Use ID as password
        
        const [newStudent] = await db.insert(users).values({
          username: studentData.id,
          password: hashedPassword,
          name: studentData.name,
          role: 'student'
        }).returning();
        
        console.log(`✅ Created: ${studentData.name} (${studentData.id})`);
        
        // Enroll in core subjects
        for (const subjectCode of studentData.subjects) {
          const subjectId = subjectMap.get(subjectCode);
          if (subjectId) {
            await db.insert(studentSubjects).values({
              studentId: newStudent.id,
              subjectId: subjectId
            });
            
            const subject = allSubjects.find(s => s.id === subjectId);
            console.log(`   📚 Enrolled: ${subject?.name} (${subjectCode})`);
          }
        }
        
        successCount++;
        
      } catch (error: any) {
        console.error(`❌ Error with ${studentData.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Import Complete!`);
    console.log(`✅ Successfully imported: ${successCount} students`);
    console.log(`❌ Failed to import: ${errorCount} students`);
    
    if (successCount > 0) {
      console.log(`\n🔑 Student Login Credentials:`);
      console.log(`   Username: Student ID (e.g., 2513730001)`);
      console.log(`   Password: Student ID (same as username)`);
      console.log(`\n📚 All students enrolled in core MCA 2nd Semester subjects`);
    }
    
  } catch (error: any) {
    console.error("❌ Import failed:", error.message);
  }
}

importRealStudents().then(() => {
  console.log("🏁 Real students import completed");
  process.exit(0);
});
