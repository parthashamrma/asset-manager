import { useTeacherLeaves, useUpdateLeaveStatus } from "@/hooks/use-teacher";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, FileText } from "lucide-react";
import { format } from "date-fns";

export function TeacherLeaves() {
  const { data: leaves, isLoading } = useTeacherLeaves();
  const updateMutation = useUpdateLeaveStatus();
  const { toast } = useToast();

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await updateMutation.mutateAsync({ id, status });
      toast({ title: `Leave ${status}`, description: "The student has been notified." });
    } catch (err: any) {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const pendingLeaves = leaves?.filter((l: any) => l.status === 'pending') || [];
  const historyLeaves = leaves?.filter((l: any) => l.status !== 'pending') || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Leave Requests</h1>
        <p className="text-muted-foreground mt-1">Review and manage student leave applications.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Pending Requests ({pendingLeaves.length})</h3>
        {pendingLeaves.length === 0 ? (
          <Card className="border-dashed bg-muted/10 border-border">
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500/50" />
              <p>You're all caught up! No pending leave requests.</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingLeaves.map((leave: any) => (
              <Card key={leave.id} className="border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-0 flex flex-col sm:flex-row">
                  <div className="p-5 flex-1 border-b sm:border-b-0 sm:border-r border-border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg text-foreground">{leave.studentName || `Student #${leave.studentId}`}</h4>
                        <p className="text-sm text-muted-foreground">Applied for: {format(new Date(leave.date), 'MMM dd, yyyy')}</p>
                      </div>
                      <Badge variant="outline" className="capitalize bg-orange-50 text-orange-700 border-orange-200">
                        {leave.type}
                      </Badge>
                    </div>
                    <div className="mt-3 bg-muted/30 p-3 rounded-lg text-sm text-foreground">
                      <span className="font-medium text-muted-foreground block mb-1">Reason:</span>
                      "{leave.reason}"
                    </div>
                    {leave.documentUrl && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer">
                        <FileText className="w-4 h-4" /> View attached medical document
                      </div>
                    )}
                  </div>
                  <div className="p-5 bg-muted/10 flex sm:flex-col justify-end sm:justify-center gap-3 w-full sm:w-48">
                    <Button 
                      className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-sm"
                      onClick={() => handleAction(leave.id, 'approved')}
                      disabled={updateMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button 
                      variant="destructive"
                      className="w-full shadow-sm"
                      onClick={() => handleAction(leave.id, 'rejected')}
                      disabled={updateMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {historyLeaves.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent History</h3>
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historyLeaves.slice(0,5).map((leave: any) => (
                  <tr key={leave.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{leave.studentName || `#${leave.studentId}`}</td>
                    <td className="px-4 py-3">{format(new Date(leave.date), 'MMM dd, yyyy')}</td>
                    <td className="px-4 py-3 capitalize">{leave.type}</td>
                    <td className="px-4 py-3">
                      <Badge variant={leave.status === 'approved' ? 'default' : 'destructive'} 
                             className={leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                        {leave.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
