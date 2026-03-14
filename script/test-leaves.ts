import "dotenv/config";
import { db } from "../server/db";
import { leaves, users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function testLeaves() {
  try {
    console.log("🔍 Testing leave data with student information...");
    
    // Test the getAllPendingLeaves functionality
    const pendingLeaves = await db
      .select({
        id: leaves.id,
        studentId: leaves.studentId,
        date: leaves.date,
        reason: leaves.reason,
        status: leaves.status,
        type: leaves.type,
        documentUrl: leaves.documentUrl,
        studentName: users.name,
        rollNumber: users.username
      })
      .from(leaves)
      .leftJoin(users, eq(leaves.studentId, users.id))
      .where(eq(leaves.status, "pending"));
    
    console.log(`📋 Found ${pendingLeaves.length} pending leave requests`);
    
    if (pendingLeaves.length > 0) {
      console.log("\n📄 Leave requests with student info:");
      pendingLeaves.forEach((leave, index) => {
        console.log(`  ${index + 1}. Student: ${leave.studentName} (${leave.rollNumber})`);
        console.log(`     Leave ID: ${leave.id}, Date: ${leave.date}`);
        console.log(`     Reason: ${leave.reason}, Type: ${leave.type}`);
        console.log(`     Status: ${leave.status}`);
      });
    } else {
      console.log("✅ No pending leave requests found");
    }
    
    // Check if there are any leaves at all
    const allLeaves = await db.select().from(leaves);
    console.log(`\n📊 Total leaves in database: ${allLeaves.length}`);
    
    if (allLeaves.length > 0) {
      console.log("Sample leave record (without student info):");
      console.log(allLeaves[0]);
    }
    
  } catch (error: any) {
    console.error("❌ Error testing leaves:", error.message);
  }
}

testLeaves().then(() => {
  console.log("🏁 Leave test completed");
  process.exit(0);
});
