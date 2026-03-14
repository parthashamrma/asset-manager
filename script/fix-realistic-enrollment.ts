import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, studentSubjects } from "../shared/schema";
import { eq } from "drizzle-orm";

async function fixRealisticEnrollment() {
  try {
    console.log("🎓 Fixing realistic student enrollment...");
    
    // Clear all existing student-subject relationships
    await db.delete(studentSubjects);
    console.log("🗑️ Cleared all existing student-subject relationships");
    
    // Get all students and subjects
    const allStudents = await db.select().from(users).where(eq(users.role, 'student'));
    const allSubjects = await db.select().from(subjects);
    
    console.log(`👥 Found ${allStudents.length} students and ${allSubjects.length} subjects`);
    
    // Create realistic subject assignments
    const subjectAssignments = new Map();
    
    // Distribute students across subjects realistically
    // Each student gets 3-4 subjects, not all 6
    const subjectsPerStudent = 4;
    
    // Subject distribution strategy
    const subjectDistribution = {
      // Core subjects for all students
      'MCA-6200': [], // Indian Knowledge System - everyone takes this
      'MCA-6201': [], // Data Structure using C - core
      'MCA-6202': [], // Java Programming - core
      'MCA-6203': [], // Operating System - core
      
      // Specialized subjects - distributed among students
      'MCA-6204': [], // Computer Networks - some students
      'MCA-6205': [], // Web Technologies - some students
      'MCA-6206': [], // MCA-6206(i) Artificial Intelligence - some students
      'MCA-6207P': [], // Data Structure LAB - some students
      'MCA-6208P': [], // Java Programming LAB - some students
      'MCA-6209': []  // Bridge Course - some students
    };
    
    // Distribute students to subjects
    let studentIndex = 0;
    for (const student of allStudents) {
      const assignedSubjects = [];
      
      // Everyone gets core subjects
      assignedSubjects.push('MCA-6200'); // Indian Knowledge System
      assignedSubjects.push('MCA-6201'); // Data Structure using C
      assignedSubjects.push('MCA-6202'); // Java Programming
      assignedSubjects.push('MCA-6203'); // Operating System
      
      // Distribute specialized subjects based on student index
      const specializedIndex = studentIndex % 6;
      
      if (specializedIndex === 0) {
        assignedSubjects.push('MCA-6204'); // Computer Networks
        assignedSubjects.push('MCA-6207P'); // Data Structure LAB
      } else if (specializedIndex === 1) {
        assignedSubjects.push('MCA-6205'); // Web Technologies
        assignedSubjects.push('MCA-6206'); // MCA-6206(i) Artificial Intelligence
      } else if (specializedIndex === 2) {
        assignedSubjects.push('MCA-6208P'); // Java Programming LAB
        assignedSubjects.push('MCA-6209'); // Bridge Course
      } else if (specializedIndex === 3) {
        assignedSubjects.push('MCA-6204'); // Computer Networks
        assignedSubjects.push('MCA-6205'); // Web Technologies
      } else if (specializedIndex === 4) {
        assignedSubjects.push('MCA-6206'); // MCA-6206(i) Artificial Intelligence
        assignedSubjects.push('MCA-6207P'); // Data Structure LAB
      } else if (specializedIndex === 5) {
        assignedSubjects.push('MCA-6208P'); // Java Programming LAB
        assignedSubjects.push('MCA-6209'); // Bridge Course
      }
      
      // Enroll student in their assigned subjects
      for (const subjectCode of assignedSubjects) {
        const subject = allSubjects.find(s => s.code === subjectCode);
        if (subject) {
          await db.insert(studentSubjects).values({
            studentId: student.id,
            subjectId: subject.id
          });
          
          if (!subjectAssignments.has(subjectCode)) {
            subjectAssignments.set(subjectCode, []);
          }
          subjectAssignments.get(subjectCode)!.push(student.username);
        }
      }
      
      studentIndex++;
    }
    
    console.log("\n📊 Subject Distribution:");
    subjectAssignments.forEach((students, subjectCode) => {
      const subject = allSubjects.find(s => s.code === subjectCode);
      console.log(`   ${subject.name} (${subjectCode}): ${students.length} students`);
      console.log(`      Students: ${students.slice(0, 5).join(', ')}${students.length > 5 ? '...' : ''}`);
    });
    
    // Verify total enrollments
    const totalEnrollments = await db.select().from(studentSubjects);
    console.log(`\n✅ Total enrollments created: ${totalEnrollments.length}`);
    
    // Show sample student assignments
    console.log("\n👥 Sample Student Assignments:");
    for (let i = 0; i < Math.min(5, allStudents.length); i++) {
      const student = allStudents[i];
      const studentEnrollments = totalEnrollments.filter(e => e.studentId === student.id);
      const enrolledSubjects = studentEnrollments.map(e => {
        const subject = allSubjects.find(s => s.id === e.subjectId);
        return subject?.code || 'Unknown';
      });
      
      console.log(`   ${student.name} (${student.username}): ${enrolledSubjects.join(', ')}`);
    }
    
  } catch (error: any) {
    console.error("❌ Error fixing enrollment:", error.message);
  }
}

fixRealisticEnrollment().then(() => {
  console.log("🏁 Realistic enrollment completed");
  process.exit(0);
});
