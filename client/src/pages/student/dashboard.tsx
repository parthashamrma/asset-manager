import { useStudentDashboard } from "@/hooks/use-student";
import { useAuth } from "@/hooks/use-auth";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, AlertCircle, FileText, BookOpen, CalendarDays, ArrowRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export function StudentDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useStudentDashboard();

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  // Fallback data
  const overallPercentage = data?.overallPercentage ?? 82;
  const subjects = data?.subjects ?? [
    { subjectName: "Data Structures", attended: 20, missed: 4, total: 24, percentage: 83 },
    { subjectName: "Algorithms", attended: 18, missed: 2, total: 20, percentage: 90 },
    { subjectName: "Computer Networks", attended: 14, missed: 6, total: 20, percentage: 70 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Attendsys Pro Portal</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name}. Here's your attendance standing.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Overall Status Card */}
        <Card className="lg:col-span-1 border-border/50 shadow-md bg-gradient-to-b from-card to-secondary/20 flex flex-col items-center justify-center p-8 text-center">
          <h3 className="font-display font-bold text-lg mb-6 text-muted-foreground">Overall Attendance</h3>
          <CircularProgress value={overallPercentage} size={180} strokeWidth={14} label="Total" />
          
          <div className="mt-8 text-sm max-w-[200px] text-balance">
            {overallPercentage >= 75 ? (
              <div className="flex items-center gap-2 text-emerald-600 justify-center">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">You're doing great! Keep it up.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive justify-center">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Warning: Below 75% threshold.</span>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions Card */}
        <Card className="lg:col-span-1 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/student/timetable">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">View Timetable</h4>
                    <p className="text-sm text-muted-foreground">Check class schedule</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link href="/student/leaves">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Leave Requests</h4>
                    <p className="text-sm text-muted-foreground">Apply for leave</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Breakdown Table */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Subject Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium rounded-t-lg">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Subject</th>
                    <th className="px-4 py-3">Attended</th>
                    <th className="px-4 py-3">Missed</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3 rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subjects.map((sub: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-4 font-medium text-foreground">{sub.subjectName}</td>
                      <td className="px-4 py-4 text-emerald-600 font-medium">{sub.attended}</td>
                      <td className="px-4 py-4 text-destructive font-medium">{sub.missed}</td>
                      <td className="px-4 py-4">{sub.total}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${sub.percentage >= 75 ? 'bg-emerald-500' : 'bg-destructive'}`}
                              style={{ width: `${sub.percentage}%` }}
                            />
                          </div>
                          <span className="font-bold w-10">{Math.round(sub.percentage)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
