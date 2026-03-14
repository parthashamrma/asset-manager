import "dotenv/config";
import { db } from "../server/db";
import { users, subjects, attendance } from "../shared/schema";

async function addCSVDownload() {
  try {
    console.log("📊 Adding CSV download functionality...");
    
    // Read the current routes file
    const fs = await import('fs');
    const path = await import('path');
    
    const routesPath = path.join(process.cwd(), 'server', 'routes.ts');
    let routesContent = fs.readFileSync(routesPath, 'utf-8');
    
    // Add the new CSV download endpoint
    const csvDownloadEndpoint = `
  // CSV DOWNLOAD ROUTE
  app.get('/api/teacher/download-attendance/:subjectId/:date', authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const { subjectId, date } = req.params;
      const teacherId = (req as any).user.id;
      
      // Get subject details
      const [subject] = await db.select().from(subjects).where(subjects.id.eq(parseInt(subjectId)));
      if (!subject || subject.teacherId !== teacherId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get all students enrolled in this subject
      const students = await db.select({
        studentId: users.id,
        studentName: users.name,
        rollNumber: users.username
      })
      .from(users)
      .innerJoin(studentSubjects, eq(users.id, studentSubjects.studentId))
      .where(eq(studentSubjects.subjectId, parseInt(subjectId)))
      .where(eq(users.role, 'student'));
      
      // Get attendance for this subject and date
      const attendanceRecords = await db.select().from(attendance)
        .where(eq(attendance.subjectId, parseInt(subjectId)))
        .where(eq(attendance.date, new Date(date)));
      
      // Create attendance map
      const attendanceMap = new Map();
      attendanceRecords.forEach(record => {
        attendanceMap.set(record.studentId, record.status);
      });
      
      // Create CSV content
      const csvHeader = 'Roll Number,Student Name,Status,Time Slot\\n';
      const csvRows = students.map(student => {
        const status = attendanceMap.get(student.studentId) || 'Not Marked';
        return `${student.rollNumber},${student.studentName},${status},${attendanceMap.get(student.studentId)?.timeSlot || ''}`;
      }).join('\\n');
      
      const csvContent = csvHeader + csvRows;
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', \`attachment; filename="attendance-\${subject.code}-\${date}.csv"\`);
      res.send(csvContent);
      
    } catch (error: any) {
      res.status(500).json({ message: "Error generating CSV", error: error.message });
    }
  });
`;
    
    // Insert the new endpoint before the return statement
    const returnStatement = 'return httpServer;';
    const insertPosition = routesContent.lastIndexOf(returnStatement);
    
    if (insertPosition !== -1) {
      const newRoutesContent = 
        routesContent.slice(0, insertPosition) + 
        csvDownloadEndpoint + 
        '\\n\\n  ' + 
        routesContent.slice(insertPosition);
      
      fs.writeFileSync(routesPath, newRoutesContent);
      console.log('✅ Added CSV download endpoint to routes.ts');
    } else {
      console.log('❌ Could not find insertion point in routes.ts');
    }
    
  } catch (error: any) {
    console.error('❌ Error adding CSV download:', error.message);
  }
}

addCSVDownload().then(() => {
  console.log('🏁 CSV download addition completed');
  process.exit(0);
});
