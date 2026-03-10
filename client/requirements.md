## Packages
recharts | Beautiful charting library for attendance analytics and dashboards
date-fns | Robust date formatting and manipulation for attendance and leaves
lucide-react | High-quality icons for the UI

## Notes
- Authentication uses HTTP-only cookies. The `/api/auth/me` endpoint returns `{ user: { role: 'teacher' | 'student', ... } }` which dictates portal access.
- Student Leave application expects a `multipart/form-data` submission to handle optional document uploads.
- The UI relies on a modern CSS variable system defined in `index.css`.
- Tailwind's default configuration is assumed to support the custom CSS variables.
