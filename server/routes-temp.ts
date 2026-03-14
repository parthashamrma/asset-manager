// Backup of analytics endpoint before fixing
app.get(api.teacher.analytics.path, authenticateJWT, requireRole('teacher'), async (req, res) => {
    try {
      const teacherId = (req as any).user.id;
      const subjects = await storage.getSubjectsByTeacher(teacherId);
      
      // Calculate real analytics
      let totalPendingLeaves = 0;
      let totalTodayClasses = 0;
      let totalAttendanceRecords = 0;
      
      for (const sub of subjects) {
        const attendance = await storage.getAttendanceBySubject(sub.id);
        const students = await storage.getStudentsBySubject(sub.id);
        
        // Count today's classes (simplified)
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = attendance.filter(a => a.date.toISOString().split('T')[0] === today);
        if (todayAttendance.length > 0) {
          totalTodayClasses += 1;
        }
        
        // Count pending leaves for this teacher's subjects
        const subjectStudentIds = students.map(s => s.studentId);
        const pendingLeaves = await storage.getAllPendingLeaves();
        const teacherPendingLeaves = pendingLeaves.filter(leave => 
          subjectStudentIds.includes(leave.studentId)
        );
        totalPendingLeaves += teacherPendingLeaves.length;
        
        totalAttendanceRecords += attendance.length;
      }
      
      // Calculate overall attendance percentage
      const overallAttendance = totalAttendanceRecords > 0 ? 
        Math.round((totalAttendanceRecords.filter(a => a.status === 'present' || a.status === 'excused').length / totalAttendanceRecords) * 100) : 0;
      
      res.status(200).json({
        pendingLeaves: totalPendingLeaves,
        todayClasses: totalTodayClasses,
        overallAttendance
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
