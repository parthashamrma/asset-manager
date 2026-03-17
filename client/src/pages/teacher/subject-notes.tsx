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
import { Plus, Edit, Trash2, FileText, BookOpen, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SubjectNote {
  id: number;
  title: string;
  content: string;
  unit: string;
  topic: string;
  subjectId: number;
  teacherId: number;
  fileUrl?: string;
  isPublic: boolean;
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

export function TeacherSubjectNotes() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    unit: "",
    topic: "",
    subjectId: "",
    isPublic: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Common units
  const units = [
    "Unit 1", "Unit 2", "Unit 3", "Unit 4", 
    "Unit 5", "Unit 6", "Unit 7", "Unit 8",
    "Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4",
    "Chapter 5", "Chapter 6", "Chapter 7", "Chapter 8",
    "Module 1", "Module 2", "Module 3", "Module 4"
  ];

  // Fetch subjects
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["teacher-subjects"],
    queryFn: async () => {
      const response = await fetch("/api/teacher/subjects", { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch subjects");
      return response.json();
    }
  });

  // Fetch subject notes
  const { data: notes, isLoading } = useQuery<SubjectNote[]>({
    queryKey: ["teacher-subject-notes"],
    queryFn: async () => {
      const response = await fetch("/api/teacher/subject-notes", { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch subject notes");
      return response.json();
    }
  });

  // Create note mutation
  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      // Create download link for Cloudinary file
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleView = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const createNoteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const formDataToSend = new FormData();
      Object.keys(data).forEach(key => {
        const value = data[key as keyof typeof data];
        // Convert boolean to string for FormData
        if (typeof value === 'boolean') {
          formDataToSend.append(key, value.toString());
        } else {
          formDataToSend.append(key, value);
        }
      });
      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }

      const response = await fetch("/api/teacher/subject-notes", {
        method: "POST",
        credentials: 'include',
        body: formDataToSend
      });
      if (!response.ok) throw new Error("Failed to create subject note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-subject-notes"] });
      setIsCreateDialogOpen(false);
      setFormData({ title: "", content: "", unit: "", topic: "", subjectId: "", isPublic: true });
      setSelectedFile(null);
      toast({ title: "Success", description: "Subject note created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create subject note", variant: "destructive" });
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await fetch(`/api/teacher/subject-notes/${noteId}`, {
        method: "DELETE",
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to delete subject note");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-subject-notes"] });
      toast({ title: "Success", description: "Subject note deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete subject note", variant: "destructive" });
    }
  });

  const handleDelete = async (noteId: number) => {
    if (window.confirm('Are you sure you want to delete this subject note? This action cannot be undone.')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNoteMutation.mutate(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const filteredNotes = notes?.filter(note => {
    const subjectMatch = selectedSubject === "all" || note.subjectId.toString() === selectedSubject;
    const unitMatch = selectedUnit === "all" || note.unit === selectedUnit;
    return subjectMatch && unitMatch;
  });

  const groupedNotes = filteredNotes?.reduce((acc, note) => {
    const key = `${note.subjectName || 'Unknown'} - ${note.unit}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(note);
    return acc;
  }, {} as Record<string, SubjectNote[]>);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading subject notes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subject Notes</h1>
          <p className="text-muted-foreground">Create and manage study materials for your subjects</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Subject Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="unit">Unit/Chapter</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter note title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  placeholder="Enter specific topic"
                  required
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Enter the note content"
                  rows={6}
                  required
                />
              </div>
              <div>
                <Label htmlFor="file">Attach File (Optional)</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData({...formData, isPublic: checked})}
                />
                <Label htmlFor="public">Make visible to students</Label>
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
              {subjects?.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name} ({subject.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label htmlFor="filter-unit">Filter by Unit</Label>
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger>
              <SelectValue placeholder="All units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All units</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-6">
        {groupedNotes && Object.keys(groupedNotes).length > 0 ? (
          Object.entries(groupedNotes).map(([group, groupNotes]) => (
            <Card key={group}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {group}
                  <Badge variant="outline">{groupNotes.length} notes</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {groupNotes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{note.title}</h4>
                          <p className="text-sm text-muted-foreground">Topic: {note.topic}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary">{note.unit}</Badge>
                            {note.isPublic ? (
                              <Badge variant="default">Public</Badge>
                            ) : (
                              <Badge variant="outline">Private</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(note.id)}
                            disabled={deleteNoteMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm line-clamp-3">{note.content}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleView(note.fileUrl || '')}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          {note.fileUrl && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownload(note.fileUrl, `${note.title}.pdf`)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Subject Notes Found</h3>
              <p className="text-muted-foreground">
                {selectedSubject || selectedUnit 
                  ? "No notes match your current filters." 
                  : "No subject notes created yet. Create your first note to get started."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
