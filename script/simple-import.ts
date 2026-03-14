import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, studentSubjects } from "../shared/schema";
import bcrypt from "bcrypt";
import fs from 'fs';

async function simpleImport() {
  try {
    console.log("🚀 Starting simple student import...");
    
    // Get all subjects for mapping
    const allSubjects = await db.select().from(subjects);
    console.log(`Found ${allSubjects.length} subjects in database`);
    
    // Create subject code to ID mapping
    const subjectMap = new Map();
    allSubjects.forEach(s => {
      subjectMap.set(s.code, s.id);
      subjectMap.set(s.code.toLowerCase(), s.id);
    });
    
    // Read the sample CSV
    const csvContent = fs.readFileSync('students-sample.csv', 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📄 Processing ${lines.length - 1} students...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Skip header, process each student
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length < 2) continue; // Skip invalid rows
      
      const [rollNumber, name, email, phone, subjectsStr] = values;
      
      try {
        // Create student account
        const defaultPassword = rollNumber; // Use roll number as password
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        const [newStudent] = await db.insert(users).values({
          username: rollNumber,
          password: hashedPassword,
          name: name,
          role: 'student'
        }).returning();
        
        console.log(`✅ Created: ${name} (${rollNumber})`);
        
        // Enroll in subjects if specified
        if (subjectsStr) {
          const subjectCodes = subjectsStr.split(';').map(s => s.trim()).filter(s => s);
          
          for (const code of subjectCodes) {
            const subjectId = subjectMap.get(code);
            if (subjectId) {
              await db.insert(studentSubjects).values({
                studentId: newStudent.id,
                subjectId: subjectId
              });
              
              const subject = allSubjects.find(s => s.id === subjectId);
              console.log(`   📚 Enrolled: ${subject?.name} (${code})`);
            } else {
              console.log(`   ⚠️  Subject not found: ${code}`);
            }
          }
        }
        
        successCount++;
        
      } catch (error: any) {
        console.error(`❌ Error with ${rollNumber}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Import Complete!`);
    console.log(`✅ Success: ${successCount} students`);
    console.log(`❌ Errors: ${errorCount} students`);
    
    if (successCount > 0) {
      console.log(`\n🔑 Login Credentials:`);
      console.log(`   Username: Roll Number (e.g., MCA2024001)`);
      console.log(`   Password: Roll Number (same as username)`);
    }
    
  } catch (error) {
    console.error("❌ Import failed:", error);
  }
}

simpleImport().then(() => {
  console.log("🏁 Script finished");
  process.exit(0);
});
