import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Download, Eye, Search, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
  teacherName?: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  teacherId: number;
  semester: number;
}

export function StudentSubjectNotes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState("all");

  // Common units
  const units = [
    "Unit 1", "Unit 2", "Unit 3", "Unit 4", 
    "Unit 5", "Unit 6", "Unit 7", "Unit 8",
    "Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4",
    "Chapter 5", "Chapter 6", "Chapter 7", "Chapter 8",
    "Module 1", "Module 2", "Module 3", "Module 4"
  ];

  // Fetch subject notes
  const { data: notes, isLoading } = useQuery<SubjectNote[]>({
    queryKey: ["student-subject-notes"],
    queryFn: async () => {
      const response = await fetch("/api/student/subject-notes", { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch subject notes");
      return response.json();
    }
  });

  // Fetch student subjects
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["student-subjects"],
    queryFn: async () => {
      const response = await fetch("/api/student/subjects", { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch subjects");
      return response.json();
    }
  });

  const filteredNotes = notes?.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === "all" || note.subjectId.toString() === selectedSubject;
    const matchesUnit = selectedUnit === "all" || note.unit === selectedUnit;
    return matchesSearch && matchesSubject && matchesUnit;
  });

  const groupedNotes = filteredNotes?.reduce((acc, note) => {
    const key = `${note.subjectName || 'Unknown'} - ${note.unit}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(note);
    return acc;
  }, {} as Record<string, SubjectNote[]>);

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

  const getUnitBadge = (unit: string) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800", 
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-yellow-100 text-yellow-800",
      "bg-indigo-100 text-indigo-800",
      "bg-red-100 text-red-800"
    ];
    const index = units.indexOf(unit);
    return colors[index % colors.length];
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading subject notes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subject Notes</h1>
        <p className="text-muted-foreground">View study materials and notes from your teachers</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 p-4 bg-muted rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes, topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1">
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
                    <div key={note.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">{note.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Topic: {note.topic} • By: {note.teacherName}
                          </p>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={getUnitBadge(note.unit)}>{note.unit}</Badge>
                            <Badge variant="secondary">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(note.createdAt).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
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
                      
                      <div className="mb-3">
                        <p className="text-sm line-clamp-3 text-muted-foreground">
                          {note.content}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          Subject: {note.subjectName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(note.updatedAt).toLocaleDateString()}
                        </p>
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
                {searchTerm || selectedSubject || selectedUnit
                  ? "No notes match your current filters." 
                  : "No subject notes available yet. Your teachers will add study materials here."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
