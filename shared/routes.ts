import { z } from 'zod';
import { insertUserSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ user: z.any() }),
        401: z.object({ message: z.string() })
      }
    },
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.object({ user: z.any() }),
        400: z.object({ message: z.string() })
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.object({ user: z.any() }),
        401: z.object({ message: z.string() })
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() })
      }
    }
  },
  teacher: {
    subjects: {
      method: 'GET' as const,
      path: '/api/teacher/subjects' as const,
      responses: {
        200: z.array(z.any())
      }
    },
    subjectStudents: {
      method: 'GET' as const,
      path: '/api/teacher/subjects/:id/students' as const,
      responses: {
        200: z.array(z.any())
      }
    },
    markAttendance: {
      method: 'POST' as const,
      path: '/api/teacher/attendance' as const,
      input: z.object({
        subjectId: z.number(),
        date: z.string(),
        timeSlot: z.string(),
        records: z.array(z.object({
          studentId: z.number(),
          status: z.enum(['present', 'absent', 'excused'])
        }))
      }),
      responses: {
        201: z.object({ message: z.string() })
      }
    },
    leaves: {
      method: 'GET' as const,
      path: '/api/teacher/leaves' as const,
      responses: {
        200: z.array(z.any())
      }
    },
    updateLeave: {
      method: 'POST' as const,
      path: '/api/teacher/leaves/:id/status' as const,
      input: z.object({ status: z.enum(['approved', 'rejected']) }),
      responses: {
        200: z.any()
      }
    },
    analytics: {
      method: 'GET' as const,
      path: '/api/teacher/analytics' as const,
      responses: {
        200: z.object({
          trends: z.array(z.object({ subject: z.string(), attendancePercentage: z.number() })),
          lowAttendance: z.array(z.object({ studentName: z.string(), rollNumber: z.string(), percentage: z.number() }))
        })
      }
    }
  },
  student: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/student/dashboard' as const,
      responses: {
        200: z.object({
          overallPercentage: z.number(),
          subjects: z.array(z.object({
            subjectName: z.string(),
            attended: z.number(),
            missed: z.number(),
            total: z.number(),
            percentage: z.number()
          }))
        })
      }
    },
    leaves: {
      method: 'GET' as const,
      path: '/api/student/leaves' as const,
      responses: {
        200: z.array(z.any())
      }
    },
    applyLeave: {
      method: 'POST' as const,
      path: '/api/student/leaves/apply' as const,
      responses: {
        201: z.any()
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
