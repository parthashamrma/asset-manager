import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeacherSubjects } from "@/hooks/use-teacher";
import { useToast } from "@/hooks/use-toast";
import { Search, Calendar, Users, Download, Filter } from "lucide-react";

export function TeacherAttendanceRecords() {
  const { data: subjects } = useTeacherSubjects();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAttendanceRecords = async () => {
    if (!selectedSubject) return;
    
    setIsLoading(true);
    try {
      const url = selectedDate 
        ? `/api/teacher/attendance/${selectedSubject}?date=${selectedDate}`
        : `/api/teacher/attendance/${selectedSubject}`;
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data);
      } else {
        toast({ title: "Error", description: "Failed to fetch attendance records", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      fetchAttendanceRecords();
    }
  }, [selectedSubject, selectedDate]);

  const downloadExcel = async () => {
    if (!selectedSubject) {
      toast({ title: "Error", description: "Please select a subject first", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`/api/teacher/download-attendance/${selectedSubject}${selectedDate ? `/${selectedDate}` : ''}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-records-${selectedSubject}${selectedDate ? `-${selectedDate}` : ''}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({ title: "Success", description: "Attendance records downloaded successfully" });
      } else {
        toast({ title: "Error", description: "Failed to download Excel file", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'absent': return 'bg-red-100 text-red-700 border-red-200';
      case 'excused': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'excused': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Attendance Records</h1>
        <p className="text-muted-foreground mt-1">View and manage all saved attendance records.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <select 
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a subject</option>
                {subjects?.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date (Optional)</Label>
              <Input 
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="Filter by date"
              />
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={fetchAttendanceRecords}
                  disabled={!selectedSubject || isLoading}
                  className="flex-1"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isLoading ? "Loading..." : "Search"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={downloadExcel}
                  disabled={!selectedSubject}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {attendanceRecords.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Attendance Records ({attendanceRecords.length})
              </div>
              <Badge variant="outline" className="text-sm">
                {selectedDate ? format(new Date(selectedDate), 'MMM dd, yyyy') : 'All Dates'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Time Slot</th>
                    <th className="text-left p-3 font-medium">Student Name</th>
                    <th className="text-left p-3 font-medium">Roll Number</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record: any, index: number) => (
                    <tr key={record.id} className={`border-b border-border hover:bg-muted/30 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                      <td className="p-3">
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-3">{record.timeSlot}</td>
                      <td className="p-3 font-medium">{record.studentName}</td>
                      <td className="p-3 text-muted-foreground">{record.rollNumber}</td>
                      <td className="p-3">
                        <Badge className={`capitalize ${getStatusColor(record.status)}`}>
                          <span className="mr-1">{getStatusIcon(record.status)}</span>
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {attendanceRecords.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted" />
                <p>No attendance records found for the selected criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedSubject && attendanceRecords.length === 0 && !isLoading && (
        <Card className="border-dashed bg-muted/10 border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mb-3 text-muted" />
            <p>No attendance records found for this subject.</p>
            <p className="text-sm mt-2">Try marking attendance for this subject first.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
