import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, studentSubjects, attendance, leaves } from "../shared/schema";

async function cleanDatabase() {
  try {
    console.log("Cleaning database of dummy records...");

    // Delete all records in order of dependencies
    console.log("Deleting attendance records...");
    await db.delete(attendance);

    console.log("Deleting student-subject relationships...");
    await db.delete(studentSubjects);

    console.log("Deleting leave records...");
    await db.delete(leaves);

    console.log("Deleting subjects...");
    await db.delete(subjects);

    console.log("Deleting users (keeping our MCA teachers)...");
    // Delete all users first, then re-insert only the MCA teachers
    await db.delete(users);

    console.log("Database cleaned successfully!");
    console.log("Re-inserting MCA teachers...");

    // Re-insert the MCA teachers
    const bcrypt = await import("bcrypt");
    const teachers = [
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

    for (const teacher of teachers) {
      await db.insert(users).values(teacher);
      console.log(`Re-inserted teacher: ${teacher.name}`);
    }

    console.log("Database cleanup completed!");

  } catch (error) {
    console.error("Error cleaning database:", error);
  }
}

cleanDatabase().then(() => {
  console.log("Clean script completed");
  process.exit(0);
});
