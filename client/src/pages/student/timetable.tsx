import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface TimetableEntry {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  room: string;
  type: "lecture" | "lab" | "tutorial" | "internship";
  department: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  teacherId: number;
  semester: number;
}

export function StudentTimetable() {
  const [selectedDay, setSelectedDay] = useState("all");
  const [currentWeek, setCurrentWeek] = useState(0);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Mock timetable data - in real app, this would come from API
  const mockTimetable: TimetableEntry[] = [
    // Monday
    {
      id: 1,
      day: "Monday",
      startTime: "10:00",
      endTime: "11:00",
      subject: "Indian Knowledge System",
      teacher: "Mr. Rohit",
      room: "MCA-6200",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 2,
      day: "Monday",
      startTime: "11:00",
      endTime: "12:00",
      subject: "Entrepreneurship",
      teacher: "Dr. Satish Sood",
      room: "MCA ID-6001",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 3,
      day: "Monday",
      startTime: "12:00",
      endTime: "13:00",
      subject: "Web Technologies",
      teacher: "Mr. Sachin Awasthi",
      room: "MCA-6205",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 4,
      day: "Monday",
      startTime: "13:30",
      endTime: "14:30",
      subject: "Data Structure using C",
      teacher: "Dr. Satish Sood",
      room: "MCA-6201",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 5,
      day: "Monday",
      startTime: "14:30",
      endTime: "15:30",
      subject: "Java Programming",
      teacher: "Mrs. Suman Bhardwaj",
      room: "MCA-6208P",
      type: "lab",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    // Tuesday
    {
      id: 6,
      day: "Tuesday",
      startTime: "10:00",
      endTime: "11:00",
      subject: "Indian Knowledge System",
      teacher: "Mr. Rohit",
      room: "MCA-6200",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 7,
      day: "Tuesday",
      startTime: "11:00",
      endTime: "12:00",
      subject: "Entrepreneurship",
      teacher: "Dr. Satish Sood",
      room: "MCA ID-6001",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 8,
      day: "Tuesday",
      startTime: "12:00",
      endTime: "13:00",
      subject: "Web Technologies",
      teacher: "Mr. Sachin Awasthi",
      room: "MCA-6205",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 9,
      day: "Tuesday",
      startTime: "13:30",
      endTime: "14:30",
      subject: "Data Structure using C",
      teacher: "Dr. Satish Sood",
      room: "MCA-6201",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 10,
      day: "Tuesday",
      startTime: "14:30",
      endTime: "15:30",
      subject: "Java Programming",
      teacher: "Mrs. Suman Bhardwaj",
      room: "MCA-6208P",
      type: "lab",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    // Wednesday
    {
      id: 11,
      day: "Wednesday",
      startTime: "10:00",
      endTime: "11:00",
      subject: "Artificial Intelligence",
      teacher: "Mr. Sachin Awasthi",
      room: "MCA-6206(i)",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 12,
      day: "Wednesday",
      startTime: "11:00",
      endTime: "12:00",
      subject: "Computer Networks",
      teacher: "Dr. Satish Sood",
      room: "MCA-6204",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 13,
      day: "Wednesday",
      startTime: "12:00",
      endTime: "13:00",
      subject: "Web Technologies",
      teacher: "Mr. Sachin Awasthi",
      room: "MCA-6205",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 14,
      day: "Wednesday",
      startTime: "13:30",
      endTime: "14:30",
      subject: "Data Structure using C",
      teacher: "Dr. Satish Sood",
      room: "MCA-6201",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 15,
      day: "Wednesday",
      startTime: "14:30",
      endTime: "15:30",
      subject: "Web Technologies",
      teacher: "Mr. Sachin Awasthi",
      room: "LAB VI",
      type: "lab",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    // Thursday
    {
      id: 16,
      day: "Thursday",
      startTime: "10:00",
      endTime: "11:00",
      subject: "Artificial Intelligence",
      teacher: "Mr. Sachin Awasthi",
      room: "MCA-6206(i)",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 17,
      day: "Thursday",
      startTime: "11:00",
      endTime: "12:00",
      subject: "Computer Networks",
      teacher: "Dr. Satish Sood",
      room: "MCA-6204",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 18,
      day: "Thursday",
      startTime: "12:00",
      endTime: "13:00",
      subject: "Operating System",
      teacher: "Mrs. Suman Bhardwaj",
      room: "MCA-6203",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 19,
      day: "Thursday",
      startTime: "13:30",
      endTime: "14:30",
      subject: "Java Programming",
      teacher: "Mrs. Suman Bhardwaj",
      room: "MCA-6202",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 20,
      day: "Thursday",
      startTime: "14:30",
      endTime: "15:30",
      subject: "Web Technologies",
      teacher: "Mr. Sachin Awasthi",
      room: "LAB VI",
      type: "lab",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    // Friday
    {
      id: 21,
      day: "Friday",
      startTime: "10:00",
      endTime: "11:00",
      subject: "Artificial Intelligence",
      teacher: "Mr. Sachin Awasthi",
      room: "MCA-6206(i)",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 22,
      day: "Friday",
      startTime: "11:00",
      endTime: "12:00",
      subject: "Computer Networks",
      teacher: "Dr. Satish Sood",
      room: "MCA-6204",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 23,
      day: "Friday",
      startTime: "12:00",
      endTime: "13:00",
      subject: "Operating System",
      teacher: "Mrs. Suman Bhardwaj",
      room: "MCA-6203",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 24,
      day: "Friday",
      startTime: "13:30",
      endTime: "14:30",
      subject: "Java Programming",
      teacher: "Mrs. Suman Bhardwaj",
      room: "MCA-6202",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 25,
      day: "Friday",
      startTime: "14:30",
      endTime: "15:30",
      subject: "Data Structure",
      teacher: "Dr. Satish Sood",
      room: "MCA-6207P",
      type: "lab",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    // Saturday
    {
      id: 26,
      day: "Saturday",
      startTime: "10:00",
      endTime: "11:00",
      subject: "Artificial Intelligence",
      teacher: "Mr. Sachin Awasthi",
      room: "MCA-6206(i)",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 27,
      day: "Saturday",
      startTime: "11:00",
      endTime: "12:00",
      subject: "Data Structure",
      teacher: "Dr. Satish Sood",
      room: "MCA-6207P",
      type: "lab",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 28,
      day: "Saturday",
      startTime: "12:00",
      endTime: "13:00",
      subject: "Operating System",
      teacher: "Mrs. Suman Bhardwaj",
      room: "MCA-6203",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 29,
      day: "Saturday",
      startTime: "13:30",
      endTime: "14:30",
      subject: "Java Programming",
      teacher: "Mrs. Suman Bhardwaj",
      room: "MCA-6202",
      type: "lecture",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    },
    {
      id: 30,
      day: "Saturday",
      startTime: "14:30",
      endTime: "15:30",
      subject: "Bridge Course",
      teacher: "Mrs. Suman Bhardwaj",
      room: "Bridge Course",
      type: "tutorial",
      department: "MCA - GOVT. COLLEGE DHARAMSHALA"
    }
  ];

  // In real app, fetch from API
  const { data: timetable = mockTimetable } = useQuery<TimetableEntry[]>({
    queryKey: ["student-timetable"],
    queryFn: async () => {
      // const response = await fetch("/api/student/timetable", { credentials: 'include' });
      // if (!response.ok) throw new Error("Failed to fetch timetable");
      // return response.json();
      return mockTimetable;
    }
  });

  const filteredTimetable = selectedDay === "all" 
    ? timetable 
    : timetable.filter(entry => entry.day === selectedDay);

  const groupedByDay = timetable.reduce((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = [];
    }
    acc[entry.day].push(entry);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  // Sort entries by start time
  Object.keys(groupedByDay).forEach(day => {
    groupedByDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "lecture": return "bg-blue-100 text-blue-800";
      case "lab": return "bg-green-100 text-green-800";
      case "tutorial": return "bg-purple-100 text-purple-800";
      case "internship": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCurrentDay = () => {
    const today = new Date();
    const dayIndex = today.getDay();
    return dayIndex === 0 ? "Monday" : days[dayIndex - 1];
  };

  const getCurrentTime = () => {
    return new Date().toTimeString().slice(0, 5);
  };

  const isCurrentClass = (entry: TimetableEntry) => {
    const now = getCurrentTime();
    return entry.day === getCurrentDay() && 
           now >= entry.startTime && 
           now <= entry.endTime;
  };

  const isUpcomingClass = (entry: TimetableEntry) => {
    const now = getCurrentTime();
    return entry.day === getCurrentDay() && 
           now < entry.startTime;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Timetable</h1>
        <p className="text-muted-foreground">View your class schedule and timings</p>
      </div>

      {/* Day Filter */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-xs">
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger>
              <SelectValue placeholder="All days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All days</SelectItem>
              {days.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          This Week
        </Button>
      </div>

      {/* Today's Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Today's Schedule - {getCurrentDay()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupedByDay[getCurrentDay()]?.length > 0 ? (
            <div className="space-y-3">
              {groupedByDay[getCurrentDay()].map((entry) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isCurrentClass(entry) 
                      ? 'border-primary bg-primary/5' 
                      : isUpcomingClass(entry)
                      ? 'border-green-200 bg-green-50'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">{entry.startTime}</div>
                      <div className="text-xs text-muted-foreground">{entry.endTime}</div>
                    </div>
                    <div>
                      <h4 className="font-semibold">{entry.subject}</h4>
                      <p className="text-sm text-muted-foreground">{entry.teacher}</p>
                      <p className="text-xs text-muted-foreground">{entry.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(entry.type)}>
                      {entry.type}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {entry.room}
                    </div>
                    {isCurrentClass(entry) && (
                      <Badge className="bg-primary text-primary-foreground">
                        Now
                      </Badge>
                    )}
                    {isUpcomingClass(entry) && (
                      <Badge className="bg-green-100 text-green-800">
                        Upcoming
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No classes scheduled for today</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Week View */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Full Week Schedule</h2>
        {selectedDay ? (
          // Single Day View
          <Card>
            <CardHeader>
              <CardTitle>{selectedDay}</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTimetable.length > 0 ? (
                <div className="space-y-3">
                  {filteredTimetable.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">{entry.startTime}</div>
                          <div className="text-xs text-muted-foreground">{entry.endTime}</div>
                        </div>
                        <div>
                          <h4 className="font-semibold">{entry.subject}</h4>
                          <p className="text-sm text-muted-foreground">{entry.teacher}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(entry.type)}>
                          {entry.type}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {entry.room}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No classes scheduled for {selectedDay}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          // Week View
          <div className="grid gap-4">
            {days.map((day) => (
              <Card key={day}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {day}
                    {day === getCurrentDay() && (
                      <Badge className="bg-primary text-primary-foreground">Today</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groupedByDay[day]?.length > 0 ? (
                    <div className="space-y-2">
                      {groupedByDay[day].map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="w-3 h-3" />
                              {entry.startTime} - {entry.endTime}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{entry.subject}</h4>
                              <p className="text-xs text-muted-foreground">{entry.teacher}</p>
                              <p className="text-xs text-muted-foreground">{entry.department}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${getTypeColor(entry.type)}`}>
                              {entry.type}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-2 h-2" />
                              {entry.room}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No classes scheduled
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
