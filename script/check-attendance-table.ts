import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, attendance, studentSubjects } from "../shared/schema";

async function checkAttendanceTable() {
  try {
    console.log("🔍 Checking attendance table structure...");
    
    // Check attendance table structure
    const attendanceSchema = await db.select().from(attendance).limit(1);
    console.log("📊 Attendance table columns:");
    if (attendanceSchema.length > 0) {
      const columns = Object.keys(attendanceSchema[0]);
      columns.forEach(col => {
        console.log(`   ${col}: ${typeof attendanceSchema[0][col as keyof typeof attendanceSchema[0]]}`);
      });
    }
    
    // Check student-subject table structure
    const studentSubjectSchema = await db.select().from(studentSubjects).limit(1);
    console.log("🔗 Student-Subject table columns:");
    if (studentSubjectSchema.length > 0) {
      const columns = Object.keys(studentSubjectSchema[0]);
      columns.forEach(col => {
        console.log(`   ${col}: ${typeof studentSubjectSchema[0][col as keyof typeof studentSubjectSchema[0]]}`);
      });
    }
    
    // Check if there are attendance records
    const attendanceCount = await db.select().from(attendance);
    console.log(`📋 Total attendance records: ${attendanceCount.length}`);
    
    // Check if there are student-subject relationships
    const relationshipCount = await db.select().from(studentSubjects);
    console.log(`🔗 Total student-subject relationships: ${relationshipCount.length}`);
    
    if (attendanceCount.length > 0 && relationshipCount.length === 0) {
      console.log("⚠️  WARNING: Attendance records exist but no student-subject relationships!");
      console.log("This might cause issues with attendance marking.");
    }
    
    // Test creating a simple attendance record
    if (attendanceCount.length === 0) {
      console.log("\n🧪 Creating test attendance record...");
      const [testStudent] = await db.select().from(users).where(eq(users.username, "2513730014"));
      const [testSubject] = await db.select().from(subjects).where(eq(subjects.code, "MCA-6200"));
      
      if (testStudent && testSubject) {
        const testRecord = {
          subjectId: testSubject.id,
          studentId: testStudent.id,
          date: new Date(),
          timeSlot: "10:00",
          status: "present"
        };
        
        await db.insert(attendance).values(testRecord);
        console.log("✅ Test attendance record created successfully");
      } else {
        console.log("❌ Could not create test record - missing student or subject");
      }
    }
    
  } catch (error: any) {
    console.error("❌ Error checking attendance table:", error.message);
  }
}

checkAttendanceTable().then(() => {
  console.log("🏁 Attendance table check completed");
  process.exit(0);
});
