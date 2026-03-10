import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useTeacherSubjects() {
  return useQuery({
    queryKey: [api.teacher.subjects.path],
    queryFn: async () => {
      const res = await fetch(api.teacher.subjects.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json();
    },
  });
}

export function useSubjectStudents(subjectId: number | null) {
  return useQuery({
    queryKey: [api.teacher.subjectStudents.path, subjectId],
    queryFn: async () => {
      if (!subjectId) return [];
      const url = buildUrl(api.teacher.subjectStudents.path, { id: subjectId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
    enabled: !!subjectId,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.teacher.markAttendance.input>) => {
      const res = await fetch(api.teacher.markAttendance.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark attendance");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teacher.analytics.path] });
    },
  });
}

export function useTeacherLeaves() {
  return useQuery({
    queryKey: [api.teacher.leaves.path],
    queryFn: async () => {
      const res = await fetch(api.teacher.leaves.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaves");
      return res.json();
    },
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'approved' | 'rejected' }) => {
      const url = buildUrl(api.teacher.updateLeave.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update leave status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.teacher.leaves.path] });
    },
  });
}

export function useTeacherAnalytics() {
  return useQuery({
    queryKey: [api.teacher.analytics.path],
    queryFn: async () => {
      const res = await fetch(api.teacher.analytics.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });
}
