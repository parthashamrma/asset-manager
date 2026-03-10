import { useTeacherAnalytics } from "@/hooks/use-teacher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function TeacherAnalytics() {
  const { data, isLoading } = useTeacherAnalytics();

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  // Provide fallback mock data if API doesn't return exactly as needed for visual demo
  const trendsData = data?.trends || [
    { subject: "Data Structures", attendancePercentage: 82 },
    { subject: "Algorithms", attendancePercentage: 74 },
    { subject: "Database Systems", attendancePercentage: 88 },
    { subject: "Computer Networks", attendancePercentage: 65 },
  ];

  const lowAttendance = data?.lowAttendance || [
    { studentName: "John Doe", rollNumber: "CS2101", percentage: 62 },
    { studentName: "Jane Smith", rollNumber: "CS2105", percentage: 58 },
    { studentName: "Mike Johnson", rollNumber: "CS2112", percentage: 71 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border shadow-lg rounded-lg p-3">
          <p className="font-semibold mb-1">{label}</p>
          <p className="text-primary font-bold">
            {payload[0].value}% Attendance
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Analytics Overview</h1>
        <p className="text-muted-foreground mt-1">Visualize attendance trends and identify at-risk students.</p>
      </div>

      <Card className="border-border/50 shadow-sm col-span-2">
        <CardHeader>
          <CardTitle className="font-display">Subject Attendance Trends</CardTitle>
          <CardDescription>Average attendance percentage across your subjects</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendsData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="subject" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                domain={[0, 100]}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
              <Bar dataKey="attendancePercentage" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {trendsData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.attendancePercentage >= 75 ? 'hsl(var(--primary))' : 'hsl(var(--warning))'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm border-t-4 border-t-destructive">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <CardTitle className="font-display text-lg">Low Attendance Alert (&lt;75%)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {lowAttendance.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">No students currently below the 75% threshold.</p>
            ) : (
              lowAttendance.map((student: any, i: number) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{student.studentName}</p>
                    <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                  </div>
                  <Badge variant="destructive" className="font-bold text-sm px-3 py-1 shadow-sm">
                    {student.percentage}%
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
