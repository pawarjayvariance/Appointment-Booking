# User-Appointment Relationship Guide

This document explains how the User-Appointment relationship works in the booking system.

## Overview

Every appointment is now **required** to be associated with an authenticated user. This ensures:
- Proper data ownership
- Authorization and access control
- Audit trail of who booked what

## Database Relationship

```
User (1) ──────< Appointment (many)
             │
             └─ userId (required foreign key)
```

### Schema Definition

```prisma
model User {
  id           String        @id @default(uuid())
  name         String
  email        String        @unique
  passwordHash String
  role         Role          @default(user)
  createdAt    DateTime      @default(now())
  appointments Appointment[] // One user can have many appointments
}

model Appointment {
  id         String   @id @default(uuid())
  doctorId   String
  doctor     Doctor   @relation(fields: [doctorId], references: [id])
  timeSlotId String   @unique
  timeSlot   TimeSlot @relation(fields: [timeSlotId], references: [id])
  name       String
  email      String
  note       String?
  createdAt  DateTime @default(now())
  userId     String   // Required - must reference a valid User
  user       User     @relation(fields: [userId], references: [id])

  @@index([doctorId])
  @@index([userId])
}
```

## How Appointments Are Created

### 1. User Authentication
- User logs in via `/api/auth/login`
- Receives JWT containing `{ userId, role }`
- JWT is stored in localStorage on the client

### 2. Booking Request
- User selects a time slot and submits booking
- Frontend sends request to `POST /api/bookings` with:
  ```json
  {
    "doctorId": "...",
    "timeSlotId": "...",
    "note": "Optional note"
  }
  ```
- **Note**: `name` and `email` are NOT sent by the client

### 3. Backend Processing
- `authMiddleware` validates JWT and attaches `req.user`
- `authorize('user', 'admin')` checks if user has permission
- `createBooking` extracts user data:
  ```javascript
  const userId = req.user.id;
  const name = req.user.name;
  const email = req.user.email;
  ```
- Appointment is created with authenticated user's data

### 4. Result
- Appointment is stored with:
  - `userId`: From JWT (cannot be manipulated by client)
  - `name`, `email`: From authenticated user record
  - `doctorId`, `timeSlotId`, `note`: From request body

## Authorization Rules

### Creating Appointments
- **Required**: User must be authenticated
- **Allowed roles**: `user`, `admin`
- **Restriction**: Cannot create appointments for other users

### Updating Appointments
- **Owner**: User can update their own appointments
- **Admin**: Can update any appointment
- **Doctor**: Can update appointments assigned to them
- **Others**: Receive `403 Forbidden`

### Viewing Appointments
- Currently, `getAppointmentBySlot` is public (no auth required)
- Consider adding authorization if needed

## Security Features

✅ **Server-side validation**: `userId` comes from JWT, not client  
✅ **Role-based access**: Different permissions for user/doctor/admin  
✅ **Ownership verification**: Users can only modify their own data  
✅ **Required relationship**: All appointments must have a valid user  

## Migration History

### Initial State
- `userId` was optional (`String?`)
- Appointments could exist without a user

### Migration: `enforce_user_appointment`
- Made `userId` required
- Created system user for orphaned appointments
- All existing appointments assigned to system user

## Testing

### Create Appointment Test
```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Create Appointment (with token)
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "doctorId":"...",
    "timeSlotId":"...",
    "note":"Test appointment"
  }'
```

### Authorization Test
```bash
# Try to update another user's appointment
# Should return 403 Forbidden
curl -X PUT http://localhost:5000/api/appointments/APPOINTMENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{"note":"Trying to modify"}'
```

## Database Queries

```sql
-- View all appointments with user info
SELECT 
  a.id, 
  a.name, 
  a.email, 
  u.email as user_email, 
  u.role 
FROM "Appointment" a
JOIN "User" u ON a."userId" = u.id;

-- Check for orphaned appointments (should be 0)
SELECT COUNT(*) FROM "Appointment" WHERE "userId" IS NULL;

-- View system user's appointments
SELECT * FROM "Appointment" 
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'system@booking.internal');
```
