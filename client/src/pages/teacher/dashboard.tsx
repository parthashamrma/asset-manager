import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Users, CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function TeacherDashboard() {
  const { user } = useAuth();
  
  // Mock summary stats (ideally fetched from an overview endpoint)
  const stats = [
    { title: "Classes Today", value: "3", icon: Users, color: "text-blue-500", bg: "bg-blue-100" },
    { title: "Pending Leaves", value: "5", icon: CalendarDays, color: "text-orange-500", bg: "bg-orange-100" },
    { title: "Overall Attendance", value: "84%", icon: ClipboardCheck, color: "text-emerald-500", bg: "bg-emerald-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, Prof. {user?.name}</h1>
        <p className="text-muted-foreground mt-1">Here is what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-display font-bold text-foreground">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/teacher/attendance">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Mark Attendance</h4>
                    <p className="text-sm text-muted-foreground">Record attendance for today's classes</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link href="/teacher/leaves">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Review Leaves</h4>
                    <p className="text-sm text-muted-foreground">5 pending student requests</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Placeholder for a mini-schedule or notices */}
        <Card className="border border-border/50 shadow-sm bg-gradient-to-br from-card to-secondary/30">
          <CardHeader>
            <CardTitle className="font-display">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {['10:00 AM - CS101', '01:00 PM - CS202', '03:30 PM - CS305'].map((slot, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-primary">{slot.split(' - ')[0]}</div>
                    </div>
                    <div className="text-foreground font-medium">{slot.split(' - ')[1]}</div>
                    <div className="text-sm text-muted-foreground">Room 402</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
