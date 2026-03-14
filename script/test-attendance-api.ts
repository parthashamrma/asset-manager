import "dotenv/config";
import { db } from "../server/db";
import { attendance, users, subjects } from "../shared/schema";
import { eq } from "drizzle-orm";

async function testAttendanceAPI() {
  try {
    console.log("🔍 Testing attendance API functionality...");
    
    // Test 1: Check if attendance records exist
    const allAttendance = await db.select().from(attendance).limit(5);
    console.log(`📊 Found ${allAttendance.length} attendance records`);
    
    if (allAttendance.length > 0) {
      console.log("Sample attendance record:");
      console.log(allAttendance[0]);
    }
    
    // Test 2: Check if we can get student info for attendance
    if (allAttendance.length > 0) {
      const studentId = allAttendance[0].studentId;
      const student = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
      
      if (student.length > 0) {
        console.log(`✅ Student found: ${student[0].name} (${student[0].username})`);
      } else {
        console.log(`❌ Student not found for ID: ${studentId}`);
      }
    }
    
    // Test 3: Check if we can get subject info
    if (allAttendance.length > 0) {
      const subjectId = allAttendance[0].subjectId;
      const subject = await db.select().from(subjects).where(eq(subjects.id, subjectId)).limit(1);
      
      if (subject.length > 0) {
        console.log(`✅ Subject found: ${subject[0].name} (${subject[0].code})`);
      } else {
        console.log(`❌ Subject not found for ID: ${subjectId}`);
      }
    }
    
    // Test 4: Simulate the API response format
    const testRecord = allAttendance[0];
    if (testRecord) {
      const formattedResponse = {
        ...testRecord,
        studentName: "TEST STUDENT",
        rollNumber: "TEST123"
      };
      console.log("📤 Simulated API response format:");
      console.log(JSON.stringify(formattedResponse, null, 2));
    }
    
  } catch (error: any) {
    console.error("❌ API test error:", error.message);
  }
}

testAttendanceAPI().then(() => {
  console.log("🏁 Attendance API test completed");
  process.exit(0);
});
