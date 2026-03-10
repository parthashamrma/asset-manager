import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Components
import { AuthGuard } from "@/components/auth/auth-guard";
import { PortalLayout } from "@/components/layout/portal-layout";

// Pages
import { LandingPage } from "@/pages/landing";
import { TeacherDashboard } from "@/pages/teacher/dashboard";
import { TeacherAttendance } from "@/pages/teacher/attendance";
import { TeacherLeaves } from "@/pages/teacher/leaves";
import { TeacherAnalytics } from "@/pages/teacher/analytics";
import { StudentDashboard } from "@/pages/student/dashboard";
import { StudentLeaves } from "@/pages/student/leaves";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />

      {/* Teacher Routes */}
      <Route path="/teacher">
        <AuthGuard allowedRoles={['teacher']}>
          <PortalLayout><TeacherDashboard /></PortalLayout>
        </AuthGuard>
      </Route>
      <Route path="/teacher/attendance">
        <AuthGuard allowedRoles={['teacher']}>
          <PortalLayout><TeacherAttendance /></PortalLayout>
        </AuthGuard>
      </Route>
      <Route path="/teacher/leaves">
        <AuthGuard allowedRoles={['teacher']}>
          <PortalLayout><TeacherLeaves /></PortalLayout>
        </AuthGuard>
      </Route>
      <Route path="/teacher/analytics">
        <AuthGuard allowedRoles={['teacher']}>
          <PortalLayout><TeacherAnalytics /></PortalLayout>
        </AuthGuard>
      </Route>

      {/* Student Routes */}
      <Route path="/student">
        <AuthGuard allowedRoles={['student']}>
          <PortalLayout><StudentDashboard /></PortalLayout>
        </AuthGuard>
      </Route>
      <Route path="/student/leaves">
        <AuthGuard allowedRoles={['student']}>
          <PortalLayout><StudentLeaves /></PortalLayout>
        </AuthGuard>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
