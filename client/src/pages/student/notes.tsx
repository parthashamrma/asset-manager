import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, BookOpen, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StudentNote {
  id: number;
  teacherId: number;
  studentId: number;
  subjectId: number;
  note: string;
  type: string;
  isPrivate: boolean;
  createdAt: string;
  teacherName: string;
  subjectName: string;
}

export function StudentNotes() {
  // Fetch notes
  const { data: notes, isLoading } = useQuery<StudentNote[]>({
    queryKey: ["student-notes"],
    queryFn: async () => {
      const response = await fetch("/api/student/notes", { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch notes");
      return response.json();
    }
  });

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

  // Group notes by type
  const groupedNotes = notes?.reduce((acc, note) => {
    if (!acc[note.type]) {
      acc[note.type] = [];
    }
    acc[note.type].push(note);
    return acc;
  }, {} as Record<string, StudentNote[]>) || {};

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading notes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teacher Notes</h1>
        <p className="text-muted-foreground">View notes and feedback from your teachers</p>
      </div>

      {notes && notes.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedNotes).map(([type, typeNotes]) => (
            <Card key={type}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getTypeIcon(type)}
                  <CardTitle className="capitalize">{type} Notes</CardTitle>
                  <Badge variant="outline">{typeNotes.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {typeNotes.map((note) => (
                    <div key={note.id} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{note.note}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {note.teacherName}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {note.subjectName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getTypeBadge(note.type)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Notes Yet</h3>
            <p className="text-muted-foreground">
              Your teachers haven't added any notes for you yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Notes will appear here when teachers provide feedback or important information about your progress.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
