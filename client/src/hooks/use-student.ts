import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useStudentDashboard() {
  return useQuery({
    queryKey: [api.student.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.student.dashboard.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });
}

export function useStudentLeaves() {
  return useQuery({
    queryKey: [api.student.leaves.path],
    queryFn: async () => {
      const res = await fetch(api.student.leaves.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaves");
      return res.json();
    },
  });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.student.applyLeave.path, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to apply for leave");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.student.leaves.path] });
    },
  });
}
