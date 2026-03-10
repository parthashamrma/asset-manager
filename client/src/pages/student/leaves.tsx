import { useState } from "react";
import { useStudentLeaves, useApplyLeave } from "@/hooks/use-student";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, PlusCircle, Paperclip } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function StudentLeaves() {
  const { data: leaves, isLoading } = useStudentLeaves();
  const applyMutation = useApplyLeave();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await applyMutation.mutateAsync(formData);
      toast({ title: "Application Submitted", description: "Your leave request is pending approval." });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Failed to submit", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Leave Applications</h1>
          <p className="text-muted-foreground mt-1">Apply for leave and track status.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-md shadow-primary/20">
              <PlusCircle className="w-4 h-4 mr-2" /> Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">New Leave Application</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" name="date" required />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select name="type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="personal">Personal</option>
                    <option value="medical">Medical</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea name="reason" rows={3} required placeholder="Briefly explain your reason for leave..." />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Supporting Document (Optional)
                </Label>
                <Input type="file" name="document" className="cursor-pointer file:text-primary file:bg-primary/10 file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 hover:file:bg-primary/20" />
                <p className="text-xs text-muted-foreground">Attach medical certificate if applicable.</p>
              </div>

              <Button type="submit" className="w-full" disabled={applyMutation.isPending}>
                {applyMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Submit Application"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg">Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : !leaves || leaves.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>You haven't applied for any leaves yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaves.map((leave: any) => (
                <div key={leave.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/10 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-foreground">{format(new Date(leave.date), 'MMMM dd, yyyy')}</span>
                      <Badge variant="outline" className="capitalize text-xs">{leave.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-lg truncate">{leave.reason}</p>
                  </div>
                  <div className="mt-3 sm:mt-0 flex items-center">
                    <Badge 
                      variant="secondary" 
                      className={`font-medium px-3 py-1 ${
                        leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {leave.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
