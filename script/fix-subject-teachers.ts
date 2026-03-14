import "dotenv/config";
import { db } from "../server/db";
import { users, subjects } from "../shared/schema";
import { eq } from "drizzle-orm";

async function fixSubjectTeachers() {
  try {
    console.log("🔧 Fixing subject teacher assignments...");
    
    // Get all teachers and subjects
    const allUsers = await db.select().from(users);
    const teachers = allUsers.filter(u => u.role === 'teacher');
    const allSubjects = await db.select().from(subjects);
    
    console.log(`Found ${teachers.length} teachers and ${allSubjects.length} subjects`);
    
    // Create teacher mapping
    const teacherMap = new Map();
    teachers.forEach(t => {
      teacherMap.set(t.username, t.id);
    });
    
    // Subject-teacher mapping
    const subjectTeacherMap = {
      "Indian Knowledge System": "rohit",
      "Inter Departmental Elective": "satish", 
      "Computer Networks": "satish",
      "Data Structure using C": "satish",
      "Data Structure LAB IV": "satish",
      "Web Technologies": "sachin",
      "MCA-6206(i) Artificial Intelligence": "sachin",
      "Web Technologies LAB VI": "sachin",
      "Operating System": "suman",
      "Java Programming LAB V": "suman", 
      "Java Programming": "suman",
      "Bridge Course": "suman"
    };
    
    // Update each subject with correct teacher
    for (const subject of allSubjects) {
      const teacherUsername = subjectTeacherMap[subject.name];
      const teacherId = teacherMap.get(teacherUsername);
      
      if (teacherId) {
        await db.update(subjects)
          .set({ teacherId })
          .where(eq(subjects.id, subject.id));
        
        console.log(`✅ Updated ${subject.name} -> Teacher: ${teacherUsername} (ID: ${teacherId})`);
      } else {
        console.log(`⚠️  No teacher found for ${subject.name}`);
      }
    }
    
    // Verify the updates
    const updatedSubjects = await db.select().from(subjects);
    console.log(`\n📊 Verification:`);
    
    for (const teacher of teachers) {
      const teacherSubjects = updatedSubjects.filter(s => s.teacherId === teacher.id);
      console.log(`👨‍🏫 ${teacher.name} (${teacher.username}): ${teacherSubjects.length} subjects`);
      teacherSubjects.forEach(s => {
        console.log(`   📚 ${s.name} (${s.code})`);
      });
    }
    
  } catch (error: any) {
    console.error("❌ Error fixing subject teachers:", error.message);
  }
}

fixSubjectTeachers().then(() => {
  console.log("🏁 Subject teacher assignment completed");
  process.exit(0);
});
