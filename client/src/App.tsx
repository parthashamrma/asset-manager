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
import { TeacherAttendanceRecords } from "@/pages/teacher/attendance-records";
import { TeacherAnalytics } from "@/pages/teacher/analytics";
import { TeacherAssignments } from "@/pages/teacher/assignments";
import { TeacherSubjectNotes } from "@/pages/teacher/subject-notes";
import { StudentDashboard } from "@/pages/student/dashboard";
import { StudentLeaves } from "@/pages/student/leaves";
import { StudentAssignments } from "@/pages/student/assignments";
import { StudentSubjectNotes } from "@/pages/student/subject-notes";
import { StudentTimetable } from "@/pages/student/timetable";

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
      <Route path="/teacher/attendance-records">
        <AuthGuard allowedRoles={['teacher']}>
          <PortalLayout><TeacherAttendanceRecords /></PortalLayout>
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
      <Route path="/teacher/assignments">
        <AuthGuard allowedRoles={['teacher']}>
          <PortalLayout><TeacherAssignments /></PortalLayout>
        </AuthGuard>
      </Route>
      <Route path="/teacher/subject-notes">
        <AuthGuard allowedRoles={['teacher']}>
          <PortalLayout><TeacherSubjectNotes /></PortalLayout>
        </AuthGuard>
      </Route>

      {/* Student Routes */}
      <Route path="/student">
        <AuthGuard allowedRoles={['student']}>
          <PortalLayout><StudentDashboard /></PortalLayout>
        </AuthGuard>
      </Route>
      <Route path="/student/timetable">
        <AuthGuard allowedRoles={['student']}>
          <PortalLayout><StudentTimetable /></PortalLayout>
        </AuthGuard>
      </Route>
      <Route path="/student/leaves">
        <AuthGuard allowedRoles={['student']}>
          <PortalLayout><StudentLeaves /></PortalLayout>
        </AuthGuard>
      </Route>
      <Route path="/student/assignments">
        <AuthGuard allowedRoles={['student']}>
          <PortalLayout><StudentAssignments /></PortalLayout>
        </AuthGuard>
      </Route>
      <Route path="/student/subject-notes">
        <AuthGuard allowedRoles={['student']}>
          <PortalLayout><StudentSubjectNotes /></PortalLayout>
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
