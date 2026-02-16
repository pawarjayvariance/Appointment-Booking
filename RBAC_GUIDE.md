# Role-Based Access Control (RBAC) Documentation

This project now supports RBAC with three primary roles: `user`, `doctor`, and `admin`.

## Roles Overview

| Role | Permissions | Default |
|------|-------------|---------|
| `user` | Can book appointments and manage own profile. | Yes |
| `doctor` | Can view and manage their own appointment schedule. | No |
| `admin` | Full access to all data, statistics, and system settings. | No |

## Implementation Details

### Database
- The Prisma `User` model includes a `role` field using a PostgreSQL `enum`.
- All new registrations default to the `user` role.

### Backend Authorization
- **JWT Payload**: User roles are included in the token: `{ userId: "...", role: "user" }`.
- **Middleware**: 
    - `authMiddleware`: Verifies the JWT and fetches the user from the database (including the role).
    - `authorize(...roles)`: A higher-order middleware that restricts access based on the user's role.
- **Protected Routes**:
    - `POST /api/bookings`: Restricted to `user` and `admin`.
    - `GET /api/doctor/appointments`: Restricted to `doctor` and `admin`.
    - `GET /api/admin/stats`: Restricted to `admin` only.

### Frontend Authorization
- The `AuthContext` stores the user object (including role) after a successful login.
- `App.jsx` uses conditional rendering to show different components based on the role:
    - `BookingPage` for `user`.
    - `DoctorDashboard` for `doctor`.
    - `AdminDashboard` for `admin`.

## How to Test

1. **New User**: Register a new account. By default, you will have the `user` role and see the booking page.
2. **Elevate Role**: To test other roles, manually update the `role` column in the `User` table for a specific user:
   ```sql
   UPDATE "User" SET role = 'admin' WHERE email = 'admin@example.com';
   ```
3. **Verify Protection**: Try to access protected routes via Postman or by manually changing the frontend state (backend checks will still block unauthorized actions).
