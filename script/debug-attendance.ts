import "dotenv/config";
import { db } from "../server/db";
import { attendance } from "../shared/schema";

async function debugAttendance() {
  try {
    console.log("🔍 Debugging attendance system...");
    
    // Check recent attendance records
    const recentAttendance = await db.select().from(attendance).orderBy(attendance.date).limit(10);
    console.log(`📊 Recent attendance records: ${recentAttendance.length}`);
    
    if (recentAttendance.length > 0) {
      console.log("Recent attendance records:");
      recentAttendance.forEach((record, index) => {
        console.log(`  ${index + 1}. Date: ${record.date}, Student: ${record.studentId}, Subject: ${record.subjectId}, Status: ${record.status}, Time: ${record.timeSlot}`);
      });
    }
    
    // Check all attendance records count
    const allAttendance = await db.select().from(attendance);
    console.log(`📊 Total attendance records in database: ${allAttendance.length}`);
    
    // Check student-subject relationships
    const relationships = await db.select().from(attendance.schema.studentSubjects);
    console.log(`🔗 Student-Subject relationships: ${relationships.length}`);
    
    // Check for any duplicate records for today
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = await db.select().from(attendance)
      .where(eq(attendance.date, today));
    
    console.log(`📅 Today's attendance records: ${todayRecords.length}`);
    
    if (todayRecords.length > 0) {
      console.log("Today's records:");
      todayRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. Student: ${record.studentId}, Subject: ${record.subjectId}, Status: ${record.status}`);
      });
    }
    
  } catch (error: any) {
    console.error("❌ Debug error:", error.message);
  }
}

debugAttendance().then(() => {
  console.log("🏁 Debug completed");
  process.exit(0);
});
