import "dotenv/config";
import { db } from "../server/db";
import { users, studentSubjects, attendance, leaves, subjects } from "../shared/schema";

async function simpleCleanStudents() {
  try {
    console.log("🧹 Cleaning all dummy students from database...");
    
    // Get all users
    const allUsers = await db.select().from(users);
    const students = allUsers.filter(u => u.role === 'student');
    const teachers = allUsers.filter(u => u.role === 'teacher');
    
    console.log(`Found ${students.length} students to remove`);
    console.log(`Found ${teachers.length} teachers to keep`);
    
    if (students.length > 0) {
      console.log("Removing students:", students.map(s => `${s.name} (${s.username})`));
      
      // Delete all attendance first (foreign key constraint)
      await db.delete(attendance);
      console.log("✅ Deleted all attendance records");
      
      // Delete all student-subject relationships
      await db.delete(studentSubjects);
      console.log("✅ Deleted all student-subject relationships");
      
      // Delete all student users
      await db.delete(users);
      console.log("✅ Deleted all users (will re-create teachers)");
      
      // Re-create only teachers
      const bcrypt = await import("bcrypt");
      const teacherAccounts = [
        {
          username: "rohit",
          password: await bcrypt.hash("rohit123", 10),
          name: "Mr. Rohit",
          role: "teacher" as const
        },
        {
          username: "satish",
          password: await bcrypt.hash("satish123", 10),
          name: "Dr. Satish Sood",
          role: "teacher" as const
        },
        {
          username: "sachin", 
          password: await bcrypt.hash("sachin123", 10),
          name: "Mr. Sachin Awasthi",
          role: "teacher" as const
        },
        {
          username: "suman",
          password: await bcrypt.hash("suman123", 10),
          name: "Mrs. Suman Bhardwaj",
          role: "teacher" as const
        }
      ];
      
      for (const teacher of teacherAccounts) {
        await db.insert(users).values(teacher);
        console.log(`✅ Re-created teacher: ${teacher.name}`);
      }
    } else {
      console.log("No students found to delete");
    }
    
    // Verify cleanup
    const finalUsers = await db.select().from(users);
    const finalStudents = finalUsers.filter(u => u.role === 'student');
    const finalTeachers = finalUsers.filter(u => u.role === 'teacher');
    const allSubjects = await db.select().from(subjects);
    const allAttendance = await db.select().from(attendance);
    const allLeaves = await db.select().from(leaves);
    
    console.log(`\n📊 Final Database State:`);
    console.log(`👨‍🏫 Teachers: ${finalTeachers.length}`);
    console.log(`👨‍🎓 Students: ${finalStudents.length}`);
    console.log(`📚 Subjects: ${allSubjects.length}`);
    console.log(`📋 Attendance: ${allAttendance.length}`);
    console.log(`📄 Leaves: ${allLeaves.length}`);
    
    if (finalStudents.length === 0) {
      console.log(`\n✅ All dummy students successfully removed!`);
      console.log(`\n🔑 Teacher accounts remain active:`);
      finalTeachers.forEach(t => {
        console.log(`   ${t.name} (${t.username})`);
      });
    }
    
  } catch (error: any) {
    console.error("❌ Error cleaning students:", error.message);
  }
}

simpleCleanStudents().then(() => {
  console.log("🏁 Student cleanup completed");
  process.exit(0);
});
