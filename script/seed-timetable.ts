import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, studentSubjects, attendance } from "../shared/schema";
import bcrypt from "bcrypt";

async function seedTimetable() {
  try {
    console.log("Starting timetable seeding...");

    // Create teacher accounts
    const teachers = [
      {
        username: "rohit",
        password: "rohit123",
        name: "Mr. Rohit",
        role: "teacher" as const
      },
      {
        username: "satish",
        password: "satish123", 
        name: "Dr. Satish Sood",
        role: "teacher" as const
      },
      {
        username: "sachin",
        password: "sachin123",
        name: "Mr. Sachin Awasthi", 
        role: "teacher" as const
      },
      {
        username: "suman",
        password: "suman123",
        name: "Mrs. Suman Bhardwaj",
        role: "teacher" as const
      }
    ];

    // Insert teachers
    const insertedTeachers = [];
    for (const teacher of teachers) {
      const hashedPassword = await bcrypt.hash(teacher.password, 10);
      const [insertedTeacher] = await db.insert(users).values({
        ...teacher,
        password: hashedPassword
      }).returning();
      insertedTeachers.push(insertedTeacher);
      console.log(`Created teacher: ${teacher.name} (${teacher.username})`);
    }

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

    // Insert subjects with teacher assignments
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

    const insertedSubjects = [];
    for (const subject of subjectData) {
      const teacherUsername = subjectTeacherMap[subject.name];
      const teacher = insertedTeachers.find(t => t.username === teacherUsername);
      
      const [insertedSubject] = await db.insert(subjects).values({
        ...subject,
        teacherId: teacher!.id
      }).returning();
      
      insertedSubjects.push(insertedSubject);
      console.log(`Created subject: ${subject.name} - Teacher: ${teacher!.name}`);
    }

    console.log("Timetable seeding completed successfully!");
    console.log("\nTeacher Login Credentials:");
    console.log("============================");
    teachers.forEach(teacher => {
      console.log(`${teacher.name}:`);
      console.log(`  Username: ${teacher.username}`);
      console.log(`  Password: ${teacher.password}`);
      console.log("");
    });

  } catch (error) {
    console.error("Error seeding timetable:", error);
  }
}

seedTimetable().then(() => {
  console.log("Seed script completed");
  process.exit(0);
});
