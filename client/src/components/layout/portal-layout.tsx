import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  CalendarDays, 
  BarChart3, 
  LogOut,
  GraduationCap,
  Menu,
  FileText,
  BookOpen,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface PortalLayoutProps {
  children: ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const teacherNav = [
    { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { label: "Mark Attendance", href: "/teacher/attendance", icon: ClipboardCheck },
    { label: "Assignments", href: "/teacher/assignments", icon: FileText },
    { label: "Subject Notes", href: "/teacher/subject-notes", icon: BookOpen },
    { label: "Leave Requests", href: "/teacher/leaves", icon: CalendarDays },
    { label: "Analytics", href: "/teacher/analytics", icon: BarChart3 },
  ];

  const studentNav = [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "Timetable", href: "/student/timetable", icon: Calendar },
    { label: "Assignments", href: "/student/assignments", icon: FileText },
    { label: "Subject Notes", href: "/student/subject-notes", icon: BookOpen },
    { label: "My Leaves", href: "/student/leaves", icon: CalendarDays },
  ];

  const navItems = user?.role === 'teacher' ? teacherNav : studentNav;

  const NavLinks = () => (
    <div className="space-y-2">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <div className={`
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer
              ${isActive 
                ? 'bg-primary/10 text-primary font-medium' 
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }
            `}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-card">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">Attendsys Pro Portal</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <NavLinks />
        </div>
        
        <div className="p-4 border-t border-border">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.username}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-16 border-b border-border bg-card px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-lg">Attendsys Pro</span>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <div className="p-6 border-b border-border">
                <h1 className="font-display font-bold text-xl">Attendsys Pro Portal</h1>
                <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
              </div>
              <div className="flex-1 p-4">
                <NavLinks />
              </div>
              <div className="p-4 border-t border-border">
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
