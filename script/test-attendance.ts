import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, attendance, studentSubjects } from "../shared/schema";
import { eq } from "drizzle-orm";

async function testAttendance() {
  try {
    console.log("🧪 Testing attendance system...");
    
    // Check recent attendance records
    const recentAttendance = await db.select().from(attendance).limit(10);
    console.log(`📊 Recent attendance records: ${recentAttendance.length}`);
    
    if (recentAttendance.length > 0) {
      console.log("Recent attendance records:");
      recentAttendance.forEach((record, index) => {
        console.log(`  ${index + 1}. Student: ${record.studentId}, Subject: ${record.subjectId}, Date: ${record.date}, Status: ${record.status}, Time: ${record.timeSlot}`);
      });
    }
    
    // Check student-Subject relationships
    const relationships = await db.select().from(studentSubjects).limit(5);
    console.log(`🔗 Student-Subject relationships: ${relationships.length}`);
    
    // Test creating a sample attendance record
    console.log("\n🧪 Testing attendance Creation...");
    
    // Get a sample student and subject
    const [sampleStudent] = await db.select().from(users).where(eq(users.username, "2513730014"));
    const [sampleSubject] = await db.select().from(subjects).where(eq(subjects.code, "MCA-6200"));
    
    if (sampleStudent && sampleSubject) {
      console.log(`✅ Found sample student: ${sampleStudent.name}`);
      console.log(`✅ Found sample subject: ${sampleSubject.name}`);
      
      // Create test attendance record
      const testRecord = {
        subjectId: sampleSubject.id,
        studentId: sampleStudent.id,
        date: new Date(),
        timeSlot: "10:00-11:00",
        status: "present"
      };
      
      await db.insert(attendance).values(testRecord);
      console.log("✅ Created test attendance record");
      
      // Verify it was saved
      const savedRecords = await db.select().from(attendance)
        .where(eq(attendance.studentId, sampleStudent.id))
        .where(eq(attendance.subjectId, sampleSubject.id));
      
      console.log(`✅ Verification: Found ${savedRecords.length} records for this student/subject`);
      savedRecords.forEach(r => {
        console.log(`   Date: ${r.date}, Status: ${r.status}, Time: ${r.timeSlot}`);
      });
    } else {
      console.log("❌ Could not find sample student or subject");
    }
    
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
  }
}

testAttendance().then(() => {
  console.log("🏁 Attendance test completed");
  process.exit(0);
});
