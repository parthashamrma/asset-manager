import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Upload, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Assignment {
  id: number;
  title: string;
  description: string;
  subjectId: number;
  teacherId: number;
  dueDate: string;
  maxScore: number;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
  subjectName?: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  teacherId: number;
  semester: number;
}

interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  content: string;
  fileUrl?: string;
  score?: number;
  submittedAt: string;
  gradedAt?: string;
  feedback?: string;
  status: string;
}

export function StudentAssignments() {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [submissionContent, setSubmissionContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch assignments
  const { data: assignments, isLoading } = useQuery<Assignment[]>({
    queryKey: ["student-assignments"],
    queryFn: async () => {
      const response = await fetch("/api/student/assignments", { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    }
  });

  // Fetch student submissions
  const { data: submissions } = useQuery<Submission[]>({
    queryKey: ["student-submissions"],
    queryFn: async () => {
      const response = await fetch("/api/student/submissions", { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    }
  });

  // Submit assignment mutation
  const submitAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      const formData = new FormData();
      formData.append('content', submissionContent);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: "POST",
        credentials: 'include',
        body: formData
      });
      if (!response.ok) throw new Error("Failed to submit assignment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-submissions"] });
      setIsSubmitDialogOpen(false);
      setSubmissionContent("");
      setSelectedFile(null);
      toast({ title: "Success", description: "Assignment submitted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit assignment", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssignment) {
      submitAssignmentMutation.mutate(selectedAssignment.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const getSubmissionStatus = (assignmentId: number) => {
    const submission = submissions?.find(s => s.assignmentId === assignmentId);
    return submission;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary">Submitted</Badge>;
      case 'graded':
        return <Badge variant="default">Graded</Badge>;
      case 'returned':
        return <Badge variant="outline">Returned</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysRemaining = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assignments</h1>
        <p className="text-muted-foreground">View and submit your assignments</p>
      </div>

      <div className="grid gap-6">
        {assignments && assignments.length > 0 ? (
          assignments.map((assignment) => {
            const submission = getSubmissionStatus(assignment.id);
            const overdue = isOverdue(assignment.dueDate);
            const daysRemaining = getDaysRemaining(assignment.dueDate);
            
            return (
              <Card key={assignment.id} className={overdue && !submission ? "border-red-200" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{assignment.title}</CardTitle>
                      <p className="text-muted-foreground mt-1">{assignment.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-sm flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                        <span className="text-sm">Max Score: {assignment.maxScore}</span>
                        {submission && getStatusBadge(submission.status)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!submission && (
                        <div className="text-right">
                          {overdue ? (
                            <Badge variant="destructive" className="mb-2">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Overdue
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="mb-2">
                              <Clock className="w-3 h-3 mr-1" />
                              {daysRemaining} days left
                            </Badge>
                          )}
                        </div>
                      )}
                      {!submission && !overdue && (
                        <Dialog open={isSubmitDialogOpen && selectedAssignment?.id === assignment.id} onOpenChange={setIsSubmitDialogOpen}>
                          <DialogTrigger asChild>
                            <Button onClick={() => setSelectedAssignment(assignment)}>
                              <Upload className="w-4 h-4 mr-2" />
                              Submit Assignment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Submit Assignment: {assignment.title}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                              <div>
                                <Label htmlFor="content">Submission Content</Label>
                                <Textarea
                                  id="content"
                                  value={submissionContent}
                                  onChange={(e) => setSubmissionContent(e.target.value)}
                                  placeholder="Enter your assignment content or description"
                                  rows={4}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="file">Attach File (Optional)</Label>
                                <Input
                                  id="file"
                                  type="file"
                                  onChange={handleFileChange}
                                  accept=".pdf"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Supported format: PDF only (Max 10MB)
                                </p>
                              </div>
                              {selectedFile && (
                                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                                  <FileText className="w-4 h-4" />
                                  <span className="text-sm">{selectedFile.name}</span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedFile(null)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              )}
                              <Button type="submit" className="w-full" disabled={submitAssignmentMutation.isPending}>
                                {submitAssignmentMutation.isPending ? "Submitting..." : "Submit Assignment"}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                      {submission && (
                        <div className="space-y-2">
                          <Button variant="outline" disabled>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Already Submitted
                          </Button>
                          {submission.fileUrl && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={() => window.open(`http://localhost:3000${submission.fileUrl}`, '_blank')}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Submitted File
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {submission && (
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Your Submission</h4>
                      <p className="text-sm mb-3">{submission.content}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted on: {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                      
                      {submission.status === 'graded' && (
                        <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-green-800">
                              Grade: {submission.score}/{assignment.maxScore}
                            </span>
                            <Badge variant="default">Graded</Badge>
                          </div>
                          {submission.feedback && (
                            <div>
                              <p className="font-medium text-green-800 mb-1">Feedback:</p>
                              <p className="text-sm text-green-700">{submission.feedback}</p>
                            </div>
                          )}
                          <p className="text-xs text-green-600 mt-2">
                            Graded on: {submission.gradedAt ? new Date(submission.gradedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Assignments</h3>
              <p className="text-muted-foreground">
                No assignments have been assigned to you yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
