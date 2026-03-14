import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, studentSubjects, assignments } from "../shared/schema";

async function checkStudentSubjects() {
  try {
    console.log("🔍 Checking student-subject relationships...\n");
    
    // Check all users
    const allUsers = await db.select().from(users);
    console.log(`📊 Total users: ${allUsers.length}`);
    
    const students = allUsers.filter(u => u.role === 'student');
    const teachers = allUsers.filter(u => u.role === 'teacher');
    
    console.log(`👨‍🎓 Students: ${students.length}`);
    console.log(`👨‍🏫 Teachers: ${teachers.length}\n`);
    
    // Check all subjects
    const allSubjects = await db.select().from(subjects);
    console.log(`📚 Total subjects: ${allSubjects.length}\n`);
    
    // Check student-subject relationships
    const studentSubjectRelations = await db.select().from(studentSubjects);
    console.log(`🔗 Student-subject relationships: ${studentSubjectRelations.length}\n`);
    
    if (studentSubjectRelations.length === 0) {
      console.log("❌ No student-subject relationships found!");
      console.log("📝 This is why students can't see assignments.");
      console.log("💡 Need to enroll students in subjects.");
      
      // Show available students and subjects
      console.log("\n👨‍🎓 Available Students:");
      students.forEach(student => {
        console.log(`  - ${student.name} (${student.username}) - ID: ${student.id}`);
      });
      
      console.log("\n📚 Available Subjects:");
      allSubjects.forEach(subject => {
        console.log(`  - ${subject.name} (${subject.code}) - ID: ${subject.id}, Teacher: ${subject.teacherId}`);
      });
      
      // Create some sample relationships
      console.log("\n🔧 Creating sample student-subject relationships...");
      for (const student of students) {
        for (const subject of allSubjects) {
          await db.insert(studentSubjects).values({
            studentId: student.id,
            subjectId: subject.id
          });
          console.log(`✅ Enrolled ${student.name} in ${subject.name}`);
        }
      }
      
      console.log("\n🎉 Student-subject relationships created!");
    } else {
      console.log("✅ Student-subject relationships found:");
      studentSubjectRelations.forEach(rel => {
        const student = students.find(s => s.id === rel.studentId);
        const subject = allSubjects.find(s => s.id === rel.subjectId);
        console.log(`  - ${student?.name} → ${subject?.name}`);
      });
    }
    
    // Check assignments
    const allAssignments = await db.select().from(assignments);
    console.log(`\n📋 Total assignments: ${allAssignments.length}`);
    
    allAssignments.forEach(assignment => {
      const subject = allSubjects.find(s => s.id === assignment.subjectId);
      console.log(`  - ${assignment.title} (Subject: ${subject?.name}, Due: ${assignment.dueDate})`);
    });
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkStudentSubjects().then(() => {
  console.log("\n🎯 Check completed!");
  process.exit(0);
});
