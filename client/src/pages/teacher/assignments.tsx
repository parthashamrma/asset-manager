import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Plus, Eye, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

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
  studentName: string;
  rollNumber: string;
}

export function TeacherAssignments() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectId: "",
    dueDate: "",
    maxScore: 10
  });
  const [gradingData, setGradingData] = useState<{[key: number]: {score: number, feedback: string}}>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch subjects
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["teacher-subjects"],
    queryFn: async () => {
      const response = await fetch("/api/teacher/subjects", { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch subjects");
      return response.json();
    }
  });

  // Fetch assignments
  const { data: assignments, isLoading } = useQuery<Assignment[]>({
    queryKey: ["teacher-assignments"],
    queryFn: async () => {
      const response = await fetch("/api/teacher/assignments", { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    }
  });

  // Fetch submissions for selected assignment
  const { data: submissions } = useQuery<Submission[]>({
    queryKey: ["assignment-submissions", selectedAssignment?.id],
    queryFn: async () => {
      if (!selectedAssignment) return [];
      const response = await fetch(`/api/teacher/assignments/${selectedAssignment.id}/submissions`, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
    enabled: !!selectedAssignment
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create assignment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      setIsCreateDialogOpen(false);
      setFormData({ title: "", description: "", subjectId: "", dueDate: "", maxScore: 10 });
      toast({ title: "Success", description: "Assignment created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create assignment", variant: "destructive" });
    }
  });

  // Grade submission mutation
  const gradeSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, score, feedback }: {submissionId: number, score: number, feedback: string}) => {
      const response = await fetch(`/api/teacher/submissions/${submissionId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ score, feedback })
      });
      if (!response.ok) throw new Error("Failed to grade submission");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignment-submissions", selectedAssignment?.id] });
      toast({ title: "Success", description: "Submission graded successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to grade submission", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAssignmentMutation.mutate(formData);
  };

  const handleGrade = (submissionId: number) => {
    const grading = gradingData[submissionId];
    if (grading) {
      gradeSubmissionMutation.mutate({
        submissionId,
        score: grading.score,
        feedback: grading.feedback
      });
    }
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Create and manage assignments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter assignment title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter assignment description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={formData.subjectId} onValueChange={(value) => setFormData({...formData, subjectId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxScore">Max Score</Label>
                <Input
                  id="maxScore"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({...formData, maxScore: parseInt(e.target.value)})}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={createAssignmentMutation.isPending}>
                {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {/* Assignments List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments && assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{assignment.title}</h3>
                      <p className="text-sm text-muted-foreground">{assignment.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                        <span className="text-sm">Max Score: {assignment.maxScore}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedAssignment(assignment)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Submissions
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No assignments created yet</p>
                <p className="text-sm text-muted-foreground">Create your first assignment to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submissions View */}
        {selectedAssignment && (
          <Card>
            <CardHeader>
              <CardTitle>Submissions for {selectedAssignment.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions && submissions.length > 0 ? (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold">{submission.studentName}</h4>
                          <p className="text-sm text-muted-foreground">{submission.rollNumber}</p>
                          <p className="text-sm">Submitted: {new Date(submission.submittedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(submission.status)}
                          {submission.fileUrl && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`http://localhost:3000${submission.fileUrl}`, '_blank')}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View File
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Submission Content:</p>
                        <p className="text-sm bg-muted p-3 rounded">{submission.content}</p>
                      </div>

                      {submission.status !== 'graded' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`score-${submission.id}`}>Score (out of {selectedAssignment.maxScore})</Label>
                              <Input
                                id={`score-${submission.id}`}
                                type="number"
                                min="0"
                                max={selectedAssignment.maxScore}
                                value={gradingData[submission.id]?.score || ""}
                                onChange={(e) => setGradingData({
                                  ...gradingData,
                                  [submission.id]: {
                                    ...gradingData[submission.id],
                                    score: parseInt(e.target.value) || 0,
                                    feedback: gradingData[submission.id]?.feedback || ""
                                  }
                                })}
                                placeholder="Enter score"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`feedback-${submission.id}`}>Feedback</Label>
                            <Textarea
                              id={`feedback-${submission.id}`}
                              value={gradingData[submission.id]?.feedback || ""}
                              onChange={(e) => setGradingData({
                                ...gradingData,
                                [submission.id]: {
                                  ...gradingData[submission.id],
                                  score: gradingData[submission.id]?.score || 0,
                                  feedback: e.target.value
                                }
                              })}
                              placeholder="Enter feedback"
                              rows={3}
                            />
                          </div>
                          <Button
                            onClick={() => handleGrade(submission.id)}
                            disabled={gradeSubmissionMutation.isPending || !gradingData[submission.id]?.score}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Grade Submission
                          </Button>
                        </div>
                      )}

                      {submission.status === 'graded' && (
                        <div className="bg-green-50 p-3 rounded">
                          <p className="font-medium text-green-800">
                            Score: {submission.score}/{selectedAssignment.maxScore}
                          </p>
                          {submission.feedback && (
                            <p className="text-sm text-green-700 mt-1">Feedback: {submission.feedback}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No submissions yet</p>
                  <p className="text-sm text-muted-foreground">Students haven't submitted this assignment</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
