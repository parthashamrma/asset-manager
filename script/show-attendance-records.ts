import "dotenv/config";
import { db } from "../server/db";
import { attendance, users, subjects } from "../shared/schema";
import { eq } from "drizzle-orm";

async function showAttendanceRecords() {
  try {
    console.log("📊 Showing all attendance records in database...\n");
    
    // Get all attendance records
    const allAttendance = await db.select().from(attendance);
    console.log(`📋 Total attendance records: ${allAttendance.length}`);
    
    if (allAttendance.length === 0) {
      console.log("❌ No attendance records found in database yet.");
      console.log("\n💡 To save attendance:");
      console.log("   1. Log in as a teacher");
      console.log("   2. Go to Attendance page");
      console.log("   3. Select a subject, date, and time slot");
      console.log("   4. Mark students as Present/Absent/Excused");
      console.log("   5. Click 'Save Attendance'");
      return;
    }
    
    // Show recent attendance records with student and subject details
    console.log("\n📄 Recent Attendance Records:");
    console.log("=" .repeat(80));
    
    for (let i = 0; i < Math.min(10, allAttendance.length); i++) {
      const record = allAttendance[i];
      
      // Get student and subject details
      const [student] = await db.select().from(users).where(eq(users.id, record.studentId));
      const [subject] = await db.select().from(subjects).where(eq(subjects.id, record.subjectId));
      
      console.log(`\n${i + 1}. 📅 Date: ${record.date.toISOString().split('T')[0]}`);
      console.log(`   ⏰ Time Slot: ${record.timeSlot}`);
      console.log(`   👤 Student: ${student?.name || 'Unknown'} (${student?.username || 'Unknown'})`);
      console.log(`   📚 Subject: ${subject?.name || 'Unknown'} (${subject?.code || 'Unknown'})`);
      console.log(`   ✅ Status: ${record.status.toUpperCase()}`);
      console.log(`   🆔 Record ID: ${record.id}`);
    }
    
    // Show attendance records by date
    console.log("\n📅 Attendance by Date:");
    const attendanceByDate = new Map();
    
    for (const record of allAttendance) {
      const date = record.date.toISOString().split('T')[0];
      if (!attendanceByDate.has(date)) {
        attendanceByDate.set(date, []);
      }
      attendanceByDate.get(date)!.push(record);
    }
    
    attendanceByDate.forEach((records, date) => {
      console.log(`   ${date}: ${records.length} attendance records`);
    });
    
    // Show attendance records by subject
    console.log("\n📚 Attendance by Subject:");
    const attendanceBySubject = new Map();
    
    for (const record of allAttendance) {
      if (!attendanceBySubject.has(record.subjectId)) {
        attendanceBySubject.set(record.subjectId, { count: 0, records: [] });
      }
      attendanceBySubject.get(record.subjectId)!.count++;
      attendanceBySubject.get(record.subjectId)!.records.push(record);
    }
    
    for (const [subjectId, data] of attendanceBySubject) {
      const [subject] = await db.select().from(subjects).where(eq(subjects.id, subjectId));
      console.log(`   ${subject?.name || 'Unknown'}: ${data.count} records`);
    }
    
    console.log("\n📍 Database Location:");
    console.log("   📊 Database: PostgreSQL");
    console.log("   🗄️ Table: attendance");
    console.log("   🔗 Connection: postgresql://postgres:Parth@localhost:5432/Attendance-system");
    
  } catch (error: any) {
    console.error("❌ Error showing attendance records:", error.message);
  }
}

showAttendanceRecords().then(() => {
  console.log("\n🏁 Attendance records display completed");
  process.exit(0);
});
