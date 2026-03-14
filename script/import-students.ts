import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, studentSubjects } from "../shared/schema";
import bcrypt from "bcrypt";
import fs from 'fs';

interface StudentData {
  roll_number: string;
  name: string;
  email?: string;
  phone?: string;
  subjects?: string[]; // Subject codes
}

async function importStudentsFromCSV(csvFilePath: string) {
  try {
    console.log("Starting student import from CSV...");
    
    // Read CSV file
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error("CSV file must have header and at least one student row");
    }
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    console.log("CSV Headers:", headers);
    
    // Get all subjects for mapping
    const allSubjects = await db.select().from(subjects);
    const subjectMap = new Map(allSubjects.map(s => [s.code.toLowerCase(), s]));
    
    // Process students
    const students: StudentData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const student: any = {};
      
      headers.forEach((header, index) => {
        student[header] = values[index] || '';
      });
      
      // Parse subjects if provided
      if (student.subjects) {
        student.subjects = student.subjects.split(';').map((s: string) => s.trim()).filter((s: string) => s);
      }
      
      students.push(student as StudentData);
    }
    
    console.log(`Found ${students.length} students to import`);
    
    // Import students
    let successCount = 0;
    let errorCount = 0;
    
    for (const studentData of students) {
      try {
        // Check if student already exists
        const existingStudent = await db.select().from(users)
          .where(users.username.eq(studentData.roll_number));
        
        if (existingStudent.length > 0) {
          console.log(`⚠️  Student ${studentData.roll_number} already exists, skipping...`);
          continue;
        }
        
        // Create student account
        const defaultPassword = studentData.roll_number; // Use roll number as default password
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        const [newStudent] = await db.insert(users).values({
          username: studentData.roll_number,
          password: hashedPassword,
          name: studentData.name,
          role: 'student'
        }).returning();
        
        console.log(`✅ Created student: ${studentData.name} (${studentData.roll_number})`);
        
        // Enroll in subjects if specified
        if (studentData.subjects && studentData.subjects.length > 0) {
          for (const subjectCode of studentData.subjects) {
            const subject = subjectMap.get(subjectCode.toLowerCase());
            if (subject) {
              await db.insert(studentSubjects).values({
                studentId: newStudent.id,
                subjectId: subject.id
              });
              console.log(`   📚 Enrolled in: ${subject.name} (${subject.code})`);
            } else {
              console.log(`   ⚠️  Subject not found: ${subjectCode}`);
            }
          }
        }
        
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error importing student ${studentData.roll_number}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Import completed!`);
    console.log(`✅ Successfully imported: ${successCount} students`);
    console.log(`❌ Failed to import: ${errorCount} students`);
    
    if (successCount > 0) {
      console.log(`\n📝 Default passwords are set to roll numbers`);
      console.log(`🔑 Students can login with their roll number as password`);
    }
    
  } catch (error) {
    console.error("Error importing students:", error);
  }
}

// Check if CSV file path is provided
const csvPath = process.argv[2];
if (!csvPath) {
  console.log("Usage: npx tsx script/import-students.ts <path-to-csv-file>");
  console.log("\nCSV Format:");
  console.log("roll_number,name,email,phone,subjects");
  console.log("MCA001,John Smith,john@email.com,9876543210,MCA-6200;MCA-6201;MCA-6203");
  console.log("MCA002,Jane Doe,jane@email.com,9876543211,MCA-6200;MCA-6204;MCA-6205");
  process.exit(1);
}

importStudentsFromCSV(csvPath).then(() => {
  console.log("Import script completed");
  process.exit(0);
});
