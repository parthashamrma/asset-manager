import "dotenv/config";
import { db } from "../server/db";
import { users, subjects } from "../shared/schema";

async function seedSubjectsOnly() {
  try {
    console.log("Starting subjects seeding...");

    // Get existing teachers
    const teachers = await db.select().from(users);
    console.log(`Found ${teachers.length} teachers`);

    // Create subjects
    const subjectData = [
      { name: "Indian Knowledge System", code: "MCA-6200", semester: 2 },
      { name: "Inter Departmental Elective", code: "MCA ID-6001", semester: 2 },
      { name: "Computer Networks", code: "MCA-6204", semester: 2 },
      { name: "Data Structure using C", code: "MCA-6201", semester: 2 },
      { name: "Data Structure LAB IV", code: "MCA-6207P", semester: 2 },
      { name: "Web Technologies", code: "MCA-6205", semester: 2 },
      { name: "MCA-6206(i) Artificial Intelligence", code: "MCA-6206", semester: 2 },
      { name: "Web Technologies LAB VI", code: "MCA-6206P", semester: 2 },
      { name: "Operating System", code: "MCA-6203", semester: 2 },
      { name: "Java Programming LAB V", code: "MCA-6208P", semester: 2 },
      { name: "Java Programming", code: "MCA-6202", semester: 2 },
      { name: "Bridge Course", code: "MCA-6209", semester: 2 }
    ];

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

    // Insert subjects with teacher assignments
    for (const subject of subjectData) {
      const teacherUsername = subjectTeacherMap[subject.name];
      const teacher = teachers.find(t => t.username === teacherUsername);
      
      if (!teacher) {
        console.error(`Teacher not found for subject: ${subject.name}`);
        continue;
      }
      
      const [insertedSubject] = await db.insert(subjects).values({
        ...subject,
        teacherId: teacher.id
      }).returning();
      
      console.log(`✓ Created subject: ${subject.name} - Teacher: ${teacher.name}`);
    }

    console.log("✅ Subjects seeding completed successfully!");

  } catch (error) {
    console.error("Error seeding subjects:", error);
  }
}

seedSubjectsOnly().then(() => {
  console.log("Subjects script completed");
  process.exit(0);
});
