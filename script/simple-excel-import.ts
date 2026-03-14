import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, studentSubjects } from "../shared/schema";
import bcrypt from "bcrypt";
import * as XLSX from 'xlsx';

async function simpleExcelImport(excelFilePath: string) {
  try {
    console.log("📊 Starting Excel student import...");
    
    // Read Excel file
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`📄 Found ${data.length} rows in Excel sheet`);
    
    // Get all subjects for mapping
    const allSubjects = await db.select().from(subjects);
    console.log(`📚 Found ${allSubjects.length} subjects in database`);
    
    // Create subject code to ID mapping
    const subjectMap = new Map<string, number>();
    allSubjects.forEach(s => {
      subjectMap.set(s.code, s.id);
      subjectMap.set(s.code.toLowerCase(), s.id);
    });
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      
      try {
        // Try different column name variations
        const rollNumber = row['roll_number'] || row['Roll Number'] || row['rollno'] || row['RollNo'] || row['username'];
        const name = row['name'] || row['Name'] || row['student_name'] || row['Student Name'];
        const email = row['email'] || row['Email'] || row['email_id'] || '';
        const phone = row['phone'] || row['Phone'] || row['mobile'] || row['contact'] || '';
        const subjectsStr = row['subjects'] || row['Subjects'] || row['subject_codes'] || '';
        
        if (!rollNumber || !name) {
          console.log(`⚠️  Skipping row ${i + 1}: Missing roll number or name`);
          errorCount++;
          continue;
        }
        
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
          // Handle different subject separators
          let subjectCodes: string[] = [];
          if (subjectsStr.includes(';')) {
            subjectCodes = subjectsStr.split(';').map((s: string) => s.trim()).filter((s: string) => s);
          } else if (subjectsStr.includes(',')) {
            subjectCodes = subjectsStr.split(',').map((s: string) => s.trim()).filter((s: string) => s);
          } else {
            subjectCodes = subjectsStr.split(' ').map((s: string) => s.trim()).filter((s: string) => s);
          }
          
          for (const code of subjectCodes) {
            const subjectId = subjectMap.get(code);
            if (subjectId) {
              await db.insert(studentSubjects).values({
                studentId: newStudent.id,
                subjectId: subjectId
              });
              
              const subject = allSubjects.find((s: any) => s.id === subjectId);
              console.log(`   📚 Enrolled: ${subject?.name} (${code})`);
            } else {
              console.log(`   ⚠️  Subject not found: ${code}`);
            }
          }
        }
        
        successCount++;
        
      } catch (error: any) {
        console.error(`❌ Error with row ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Excel Import Complete!`);
    console.log(`✅ Success: ${successCount} students`);
    console.log(`❌ Errors: ${errorCount} students`);
    
    if (successCount > 0) {
      console.log(`\n🔑 Login Credentials:`);
      console.log(`   Username: Roll Number from Excel`);
      console.log(`   Password: Roll Number (same as username)`);
    }
    
  } catch (error: any) {
    console.error("❌ Excel import failed:", error.message);
  }
}

// Check if Excel file path is provided
const excelPath = process.argv[2];
if (!excelPath) {
  console.log("Usage: npx tsx script/simple-excel-import.ts <path-to-excel-file>");
  console.log("\n✅ Excel Import Ready!");
  console.log("\n📋 Excel Format (column names can vary):");
  console.log("Roll Number | Name | Email | Phone | Subjects");
  console.log("MCA001 | John Smith | john@email.com | 9876543210 | MCA-6200;MCA-6201;MCA-6203");
  console.log("MCA002 | Jane Doe | jane@email.com | 9876543211 | MCA-6200;MCA-6204;MCA-6205");
  console.log("\n🔧 Supported column names:");
  console.log("Roll Number: roll_number, Roll Number, rollno, RollNo, username");
  console.log("Name: name, Name, student_name, Student Name");
  console.log("Email: email, Email, email_id");
  console.log("Phone: phone, Phone, mobile, contact");
  console.log("Subjects: subjects, Subjects, subject_codes");
  console.log("\n📚 Available Subject Codes:");
  console.log("MCA-6200, MCA-6201, MCA-6202, MCA-6203, MCA-6204, MCA-6205");
  process.exit(1);
}

simpleExcelImport(excelPath).then(() => {
  console.log("🏁 Excel import script finished");
  process.exit(0);
});
