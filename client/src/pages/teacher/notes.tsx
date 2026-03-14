import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, MessageSquare, User, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TeacherNote {
  id: number;
  teacherId: number;
  studentId: number;
  subjectId: number;
  note: string;
  type: string;
  isPrivate: boolean;
  createdAt: string;
  studentName: string;
  rollNumber: string;
  subjectName: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  teacherId: number;
  semester: number;
}

interface Student {
  studentId: number;
  studentName: string;
  rollNumber: string;
}

export function TeacherNotes() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [formData, setFormData] = useState({
    studentId: "",
    subjectId: "",
    note: "",
    type: "general",
    isPrivate: false
  });
  
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

  // Fetch students for selected subject
  const { data: students } = useQuery<Student[]>({
    queryKey: ["subject-students", selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return [];
      const response = await fetch(`/api/teacher/subjects/${selectedSubject}/students`, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    },
    enabled: !!selectedSubject
  });

  // Fetch notes
  const { data: notes, isLoading } = useQuery<TeacherNote[]>({
    queryKey: ["teacher-notes"],
    queryFn: async () => {
      const response = await fetch("/api/teacher/notes", { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch notes");
      return response.json();
    }
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/teacher/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-notes"] });
      setIsCreateDialogOpen(false);
      setFormData({ studentId: "", subjectId: "", note: "", type: "general", isPrivate: false });
      toast({ title: "Success", description: "Note created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create note", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNoteMutation.mutate(formData);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'general':
        return <Badge variant="secondary">General</Badge>;
      case 'assignment':
        return <Badge variant="default">Assignment</Badge>;
      case 'behavior':
        return <Badge variant="outline">Behavior</Badge>;
      case 'performance':
        return <Badge className="bg-purple-100 text-purple-800">Performance</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <BookOpen className="w-4 h-4" />;
      case 'behavior':
        return <User className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredNotes = notes?.filter(note => {
    const subjectMatch = selectedSubject === "all" || note.subjectId.toString() === selectedSubject;
    const studentMatch = selectedStudent === "all" || note.studentId.toString() === selectedStudent;
    return subjectMatch && studentMatch;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading notes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teacher Notes</h1>
          <p className="text-muted-foreground">Create and manage student notes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={formData.subjectId} onValueChange={(value) => {
                  setFormData({...formData, subjectId: value, studentId: ""});
                  setSelectedSubject(value);
                }}>
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
                <Label htmlFor="student">Student</Label>
                <Select 
                  value={formData.studentId} 
                  onValueChange={(value) => setFormData({...formData, studentId: value})}
                  disabled={!selectedSubject}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {students && students.length > 0 ? students.map((student) => (
                      <SelectItem key={student.studentId} value={student.studentId.toString()}>
                        {student.studentName} ({student.rollNumber})
                      </SelectItem>
                    )) : (
                      <SelectItem value="none" disabled>No students available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Note Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select note type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="assignment">Assignment Related</SelectItem>
                    <SelectItem value="behavior">Behavior</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="note">Note Content</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  placeholder="Enter your note about the student"
                  rows={4}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="private"
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) => setFormData({...formData, isPrivate: checked})}
                />
                <Label htmlFor="private">Private note (only visible to you)</Label>
              </div>
              <Button type="submit" className="w-full" disabled={createNoteMutation.isPending}>
                {createNoteMutation.isPending ? "Creating..." : "Create Note"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 p-4 bg-muted rounded-lg">
        <div className="flex-1">
          <Label htmlFor="filter-subject">Filter by Subject</Label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger>
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects && subjects.length > 0 ? subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name} ({subject.code})
                </SelectItem>
              )) : null}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="filter-student">Filter by Student</Label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="All students" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All students</SelectItem>
              {students && students.length > 0 ? students.map((student) => (
                <SelectItem key={student.studentId} value={student.studentId.toString()}>
                  {student.studentName} ({student.rollNumber})
                </SelectItem>
              )) : null}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes List */}
      <div className="grid gap-4">
        {filteredNotes && filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(note.type)}
                    <div>
                      <h3 className="font-semibold">{note.studentName}</h3>
                      <p className="text-sm text-muted-foreground">{note.rollNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(note.type)}
                    {note.isPrivate && (
                      <Badge variant="outline">Private</Badge>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm mb-2">{note.note}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Subject: {note.subjectName}</span>
                    <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notes Found</h3>
              <p className="text-muted-foreground">
                {selectedSubject || selectedStudent 
                  ? "No notes match your current filters." 
                  : "No notes created yet. Create your first note to get started."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
