import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useTeacherSubjects, useSubjectStudents, useMarkAttendance } from "@/hooks/use-teacher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCheck, UserX, AlertCircle, Users, Download } from "lucide-react";

export function TeacherAttendance() {
  const { toast } = useToast();
  const { data: subjects, isLoading: loadingSubjects } = useTeacherSubjects();
  
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [timeSlot, setTimeSlot] = useState<string>("");
  
  // Local state to track selections before submitting
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, 'present'|'absent'|'excused'>>({});

  const subjectId = selectedSubject ? parseInt(selectedSubject) : null;
  const { data: students, isLoading: loadingStudents } = useSubjectStudents(subjectId);
  const markMutation = useMarkAttendance();

  // Initialize attendance records when students load
  useEffect(() => {
    if (students && students.length > 0) {
      const initial: Record<number, 'present'|'absent'|'excused'> = {};
      students.forEach((s: any) => {
        initial[s.studentId] = 'absent'; // Default to absent
      });
      setAttendanceRecords(initial);
    }
  }, [students]);

  // Reset when subject changes
  useEffect(() => {
    setAttendanceRecords({});
  }, [selectedSubject]);

  // Handle individual student status change
  const handleStatusChange = (studentId: number, status: 'present'|'absent'|'excused') => {
    setAttendanceRecords(prev => {
      const newRecords = { ...prev };
      newRecords[studentId] = status;
      return newRecords;
    });
  };

  // Handle "Mark All Present"
  const handleMarkAllPresent = (checked: boolean) => {
    if (students && students.length > 0) {
      const newRecords: Record<number, 'present'|'absent'|'excused'> = {};
      students.forEach((s: any) => {
        newRecords[s.studentId] = checked ? 'present' : 'absent';
      });
      setAttendanceRecords(newRecords);
    }
  };

  const onSubmit = async () => {
    if (!subjectId || !date || !timeSlot) {
      toast({ title: "Incomplete details", description: "Please fill all class details.", variant: "destructive" });
      return;
    }

    // Create records payload
    const recordsPayload = Object.entries(attendanceRecords).map(([id, status]) => ({
      studentId: parseInt(id),
      status
    }));

    console.log("🔍 Submitting attendance:", {
      subjectId,
      date,
      timeSlot,
      attendanceRecords,
      recordsPayload,
      students: students.map(s => ({
        studentId: s.studentId,
        studentName: s.studentName,
        rollNumber: s.rollNumber
      }))
    });

    try {
      console.log("📤 Sending to API...");
      const response = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          date,
          timeSlot,
          records: recordsPayload
        }),
        credentials: 'include'
      });

      console.log("📤 API Response:", response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ API Error:", errorData);
        toast({ 
          title: "Error", 
          description: `Failed to save attendance: ${errorData}`, 
          variant: "destructive" 
        });
        return;
      }

      const result = await response.json();
      console.log("✅ API Result:", result);
      
      if (result.message) {
        toast({ title: "Success", description: result.message });
        
        // Reset form
        setSelectedSubject("");
        setTimeSlot("");
        setAttendanceRecords({});
        
        console.log("✅ Attendance saved and form reset");
      } else {
        toast({ title: "Error", description: "Failed to save attendance", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("❌ Submission error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const downloadAttendanceCSV = async () => {
    if (!subjectId || !date) {
      toast({ title: "Error", description: "Please select a subject and date first", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`/api/teacher/download-attendance/${subjectId}/${date}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${subjectId}-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "Attendance CSV downloaded successfully" });
    } catch (error: any) {
      console.error("❌ CSV download error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Mark Attendance</h1>
        <p className="text-muted-foreground mt-1">Record daily class attendance.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg">Class Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>Subject</Label>
            {loadingSubjects ? <Loader2 className="animate-spin w-5 h-5 text-muted-foreground" /> : (
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
              >
                <option value="">Select a subject...</option>
                {subjects?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Time Slot</Label>
            <Input type="time" value={timeSlot} onChange={e => setTimeSlot(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {subjectId && students && (
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <div className="bg-secondary/50 p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-semibold">Student List ({students.length})</h3>
            <div className="flex items-center space-x-2">
              <Switch id="mark-all" onCheckedChange={handleMarkAllPresent} />
              <Label htmlFor="mark-all" className="cursor-pointer">Mark All Present</Label>
            </div>
          </div>
          <div className="divide-y divide-border">
            {students.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Users className="w-12 h-12 mb-3 text-muted" />
                <p>No students enrolled in this subject.</p>
              </div>
            ) : (
              students.map((student: any) => (
                <div key={student.studentId} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{student.studentName || `Student #${student.studentId}`}</p>
                    <p className="text-xs text-muted-foreground">{student.rollNumber || `ID: ${student.studentId}`}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={attendanceRecords[student.studentId] === 'present' ? 'default' : 'outline'}
                      className={attendanceRecords[student.studentId] === 'present' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                      onClick={() => handleStatusChange(student.studentId, 'present')}
                    >
                      <UserCheck className="w-4 h-4 mr-1" /> Present
                    </Button>
                    <Button 
                      size="sm" 
                      variant={attendanceRecords[student.studentId] === 'absent' ? 'destructive' : 'outline'}
                      onClick={() => handleStatusChange(student.studentId, 'absent')}
                    >
                      <UserX className="w-4 h-4 mr-1" /> Absent
                    </Button>
                    <Button 
                      size="sm" 
                      variant={attendanceRecords[student.studentId] === 'excused' ? 'secondary' : 'outline'}
                      className={attendanceRecords[student.studentId] === 'excused' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200' : ''}
                      onClick={() => handleStatusChange(student.studentId, 'excused')}
                    >
                      <AlertCircle className="w-4 h-4 mr-1" /> Excused
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {students.length > 0 && (
            <div className="p-4 bg-muted/20 border-t border-border flex justify-between gap-2">
              <Button 
                onClick={onSubmit} 
                disabled={markMutation.isPending || !date || !timeSlot}
                className="w-full md:w-auto shadow-md"
              >
                {markMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Attendance"}
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => downloadAttendanceCSV()}
                disabled={!subjectId}
                className="shadow-md"
              >
                📊 Download CSV
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
