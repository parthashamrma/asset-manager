import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, studentSubjects } from "../shared/schema";
import { eq } from "drizzle-orm";

async function enrollAllSubjects() {
  try {
    console.log("🎓 Enrolling all students in all subjects...");
    
    // Clear all existing student-subject relationships
    await db.delete(studentSubjects);
    console.log("🗑️ Cleared all existing student-subject relationships");
    
    // Get all students and subjects
    const allStudents = await db.select().from(users).where(eq(users.role, 'student'));
    const allSubjects = await db.select().from(subjects);
    
    console.log(`👥 Found ${allStudents.length} students and ${allSubjects.length} subjects`);
    
    // Enroll every student in every subject
    let totalEnrollments = 0;
    
    for (const student of allStudents) {
      for (const subject of allSubjects) {
        await db.insert(studentSubjects).values({
          studentId: student.id,
          subjectId: subject.id
        });
        totalEnrollments++;
      }
      
      if ((allStudents.indexOf(student) + 1) % 10 === 0) {
        console.log(`✅ Enrolled ${allStudents.indexOf(student) + 1}/${allStudents.length}: ${student.name} in all ${allSubjects.length} subjects`);
      }
    }
    
    console.log(`\n✅ Total enrollments created: ${totalEnrollments}`);
    console.log(`📊 Each student now has ${allSubjects.length} subjects`);
    
    // Show subject distribution
    console.log("\n📚 Subject Distribution:");
    const subjectCounts = new Map();
    
    for (const subject of allSubjects) {
      const count = await db.select().from(studentSubjects)
        .where(eq(studentSubjects.subjectId, subject.id));
      subjectCounts.set(subject.code, count.length);
    }
    
    subjectCounts.forEach((count, subjectCode) => {
      const subject = allSubjects.find(s => s.code === subjectCode);
      console.log(`   ${subject.name} (${subjectCode}): ${count} students`);
    });
    
  } catch (error: any) {
    console.error("❌ Error enrolling students:", error.message);
  }
}

enrollAllSubjects().then(() => {
  console.log("🏁 All subjects enrollment completed");
  process.exit(0);
});
