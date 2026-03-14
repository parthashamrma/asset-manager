import "dotenv/config";
import { db } from "../server/db";
import { users, studentSubjects, attendance, leaves, subjects } from "../shared/schema";

async function cleanStudents() {
  try {
    console.log("🧹 Cleaning all dummy students from database...");
    
    // Check current data
    const allUsers = await db.select().from(users);
    const students = allUsers.filter(u => u.role === 'student');
    const teachers = allUsers.filter(u => u.role === 'teacher');
    
    console.log(`Found ${students.length} students to remove`);
    console.log(`Found ${teachers.length} teachers to keep`);
    
    if (students.length > 0) {
      console.log("Removing students:", students.map(s => `${s.name} (${s.username})`));
      
      // Delete in correct order to respect foreign key constraints
      await db.delete(attendance);
      console.log("✅ Deleted all attendance records");
      
      await db.delete(studentSubjects);
      console.log("✅ Deleted all student-subject relationships");
      
      // Delete only student users
      await db.delete(users).where(users.role.eq('student'));
      console.log("✅ Deleted all student users");
    } else {
      console.log("No students found to delete");
    }
    
    // Verify cleanup
    const finalUsers = await db.select().from(users);
    const finalStudents = finalUsers.filter(u => u.role === 'student');
    const finalTeachers = finalUsers.filter(u => u.role === 'teacher');
    
    console.log(`\n📊 Final Database State:`);
    console.log(`👨‍🏫 Teachers: ${finalTeachers.length}`);
    console.log(`👨‍🎓 Students: ${finalStudents.length}`);
    console.log(`📚 Subjects: ${await db.select().from(subjects).then(s => s.length)}`);
    console.log(`📋 Attendance: ${await db.select().from(attendance).then(a => a.length)}`);
    console.log(`📄 Leaves: ${await db.select().from(leaves).then(l => l.length)}`);
    
    if (finalStudents.length === 0) {
      console.log(`\n✅ All dummy students successfully removed!`);
      console.log(`\n🔑 Teacher accounts remain active:`);
      teachers.forEach(t => {
        console.log(`   ${t.name} (${t.username})`);
      });
    }
    
  } catch (error: any) {
    console.error("❌ Error cleaning students:", error.message);
  }
}

cleanStudents().then(() => {
  console.log("🏁 Student cleanup completed");
  process.exit(0);
});
