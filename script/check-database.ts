import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, studentSubjects } from "../shared/schema";

async function checkDatabase() {
  try {
    console.log("🔍 Checking database state...");
    
    // Check users
    const allUsers = await db.select().from(users);
    const students = allUsers.filter(u => u.role === 'student');
    const teachers = allUsers.filter(u => u.role === 'teacher');
    
    console.log(`👥 Users: ${allUsers.length} total`);
    console.log(`👨‍🎓 Students: ${students.length}`);
    console.log(`👨‍🏫 Teachers: ${teachers.length}`);
    
    // Check subjects
    const allSubjects = await db.select().from(subjects);
    console.log(`📚 Subjects: ${allSubjects.length}`);
    
    if (allSubjects.length > 0) {
      console.log("❌ No subjects found!");
    } else {
      console.log("✅ Subjects found:");
      allSubjects.forEach(s => {
        console.log(`   ${s.name} (${s.code}) - Teacher ID: ${s.teacherId}`);
      });
    }
    
    // Check student-subject relationships
    const allStudentSubjects = await db.select().from(studentSubjects);
    console.log(`🔗 Student-Subject Relationships: ${allStudentSubjects.length}`);
    
    if (allStudentSubjects.length === 0) {
      console.log("❌ No student-subject relationships found!");
    } else {
      // Show sample relationships
      console.log("✅ Sample relationships:");
      for (let i = 0; i < Math.min(5, allStudentSubjects.length); i++) {
        const rel = allStudentSubjects[i];
        console.log(`   Student ${rel.studentId} -> Subject ${rel.subjectId}`);
      }
    }
    
    // Check if teachers have subjects assigned
    for (const teacher of teachers) {
      const teacherSubjects = allSubjects.filter(s => s.teacherId === teacher.id);
      console.log(`👨‍🏫 ${teacher.name} has ${teacherSubjects.length} subjects:`);
      teacherSubjects.forEach(s => {
        console.log(`   - ${s.name} (${s.code})`);
      });
    }
    
  } catch (error: any) {
    console.error("❌ Error checking database:", error.message);
  }
}

checkDatabase().then(() => {
  console.log("🏁 Database check completed");
  process.exit(0);
});
