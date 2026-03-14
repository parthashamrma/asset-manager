import { db } from "../server/db";
import { subjects } from "../shared/schema";
import { eq } from "drizzle-orm";

async function fixSubjectNames() {
  console.log("🔧 Updating subject names in database...");
  
  try {
    // Update subjects table to replace "Discipline Specific Electives" with "MCA-6206(i) Artificial Intelligence"
    const updateResult = await db
      .update(subjects)
      .set({ 
        name: "MCA-6206(i) Artificial Intelligence"
      })
      .where(eq(subjects.name, "Discipline Specific Electives - I TOC"));
    
    console.log("✅ Subject name updated successfully");
    console.log("📊 Updated records:", updateResult);
    
    // Also check for any other variations
    const variations = [
      "Discipline Specific Electives",
      "Discipline Specific Electives - I TOC",
      "I TOC"
    ];
    
    for (const variation of variations) {
      const checkResult = await db
        .select()
        .from(subjects)
        .where(eq(subjects.name, variation));
      
      if (checkResult.length > 0) {
        console.log(`🔄 Found variation: "${variation}" - updating...`);
        await db
          .update(subjects)
          .set({ 
            name: "MCA-6206(i) Artificial Intelligence"
          })
          .where(eq(subjects.name, variation));
      }
    }
    
    console.log("🎉 All subject names updated successfully!");
    
  } catch (error) {
    console.error("❌ Error updating subject names:", error);
  }
}

// Run the fix
fixSubjectNames()
  .then(() => {
    console.log("✅ Subject name update completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed to update subject names:", error);
    process.exit(1);
  });
