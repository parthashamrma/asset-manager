import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, studentSubjects, attendance, leaves } from "../shared/schema";
import bcrypt from "bcrypt";

async function completeClean() {
  try {
    console.log("Performing complete database cleanup...");

    // Check what's in the database first
    console.log("Checking current data...");
    
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users:`, allUsers.map(u => ({ username: u.username, role: u.role })));
    
    const allSubjects = await db.select().from(subjects);
    console.log(`Found ${allSubjects.length} subjects:`, allSubjects.map(s => ({ name: s.name, code: s.code })));
    
    const allAttendance = await db.select().from(attendance);
    console.log(`Found ${allAttendance.length} attendance records`);
    
    const allLeaves = await db.select().from(leaves);
    console.log(`Found ${allLeaves.length} leave records:`, allLeaves.map(l => ({ status: l.status, type: l.type })));
    
    const allStudentSubjects = await db.select().from(studentSubjects);
    console.log(`Found ${allStudentSubjects.length} student-subject relationships`);

    // Delete everything in the correct order
    console.log("\nDeleting all records...");
    
    await db.delete(attendance);
    console.log("✓ Deleted attendance records");
    
    await db.delete(studentSubjects);
    console.log("✓ Deleted student-subject relationships");
    
    await db.delete(leaves);
    console.log("✓ Deleted leave records");
    
    await db.delete(subjects);
    console.log("✓ Deleted subjects");
    
    await db.delete(users);
    console.log("✓ Deleted all users");

    // Re-insert only the MCA teachers
    console.log("\nRe-inserting MCA teachers...");
    
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
      console.log(`✓ Re-inserted teacher: ${teacher.name} (${teacher.username})`);
    }

    // Verify the cleanup
    console.log("\nVerifying cleanup...");
    const finalUsers = await db.select().from(users);
    const finalSubjects = await db.select().from(subjects);
    const finalAttendance = await db.select().from(attendance);
    const finalLeaves = await db.select().from(leaves);
    const finalStudentSubjects = await db.select().from(studentSubjects);

    console.log(`Final state: ${finalUsers.length} users, ${finalSubjects.length} subjects, ${finalAttendance.length} attendance, ${finalLeaves.length} leaves, ${finalStudentSubjects.length} student-subjects`);

    console.log("\n✅ Complete database cleanup finished!");

  } catch (error) {
    console.error("Error during complete cleanup:", error);
  }
}

completeClean().then(() => {
  console.log("Complete clean script finished");
  process.exit(0);
});
