# Admin Dashboard Guide

This document explains how the Admin Dashboard works for viewing and filtering appointment data.

## Overview

The Admin Dashboard provides a comprehensive view of all appointments with:
- **Table display** with user, doctor, and appointment details
- **Nested filtering** (doctor → user name)
- **Pagination** (10 rows per page)
- **Admin-only access**

## Access Control

### Backend
- Route: `GET /api/admin/appointments`
- Protected by: `authMiddleware` + `authorize('admin')`
- Non-admin users receive: `403 Forbidden`

### Frontend
- Only visible when `user.role === 'admin'`
- Automatically shown when admin logs in

## Table Columns

| # | Column | Description |
|---|--------|-------------|
| 1 | Row Number | Serial number: `(page - 1) * 10 + index + 1` |
| 2 | User Name | Name of the user who booked |
| 3 | User Email | Email of the user |
| 4 | Doctor Name | Name of the assigned doctor |
| 5 | Appointment Time | Date and time of appointment |

## Filtering Logic

### Nested Filtering Flow

Filters are applied in this exact order:

1. **Doctor Filter** (Primary)
   - Dropdown with all doctors
   - Selecting a doctor filters the full dataset
   - Resets to page 1

2. **User Name Filter** (Secondary)
   - Text input for partial name search
   - Applied ONLY on doctor-filtered data
   - Case-insensitive partial match
   - Resets to page 1

**Example**:
- Initial: 100 appointments across all doctors
- Select "Dr. Smith": 30 appointments
- Type "john": 5 appointments (from Dr. Smith's 30)

### API Query Parameters

```
GET /api/admin/appointments?doctorId=<id>&userName=<name>&page=<num>&limit=10
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `doctorId` | No | Filter by specific doctor |
| `userName` | No | Filter by user name (partial match) |
| `page` | No | Page number (default: 1) |
| `limit` | No | Results per page (fixed: 10) |

## Pagination

- **Fixed**: 10 appointments per page
- **Controls**: Previous and Next buttons
- **Display**: "Page X of Y"
- **Behavior**:
  - Previous disabled on page 1
  - Next disabled on last page
  - Maintains filters when changing pages

## Backend Implementation

### Prisma Query

```javascript
const where = {};
if (doctorId) where.doctorId = doctorId;
if (userName) where.user = { name: { contains: userName, mode: 'insensitive' } };

const appointments = await prisma.appointment.findMany({
  where,
  include: { user: true, doctor: true, timeSlot: true },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit
});
```

### Response Format

```json
{
  "appointments": [
    {
      "id": "uuid",
      "user": { "name": "John Doe", "email": "john@example.com" },
      "doctor": { "name": "Dr. Smith", "specialization": "Cardiology" },
      "timeSlot": { "startTime": "2026-02-05T10:00:00Z" },
      "note": "Checkup"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 42,
    "limit": 10
  }
}
```

## Frontend Implementation

### State Management

```javascript
const [appointments, setAppointments] = useState([]);
const [selectedDoctorId, setSelectedDoctorId] = useState('');
const [userNameSearch, setUserNameSearch] = useState('');
const [currentPage, setCurrentPage] = useState(1);
```

### Filter Handlers

```javascript
// Doctor filter: resets page to 1
const handleDoctorChange = (e) => {
  setSelectedDoctorId(e.target.value);
  setCurrentPage(1);
};

// User name filter: resets page to 1
const handleUserNameChange = (e) => {
  setUserNameSearch(e.target.value);
  setCurrentPage(1);
};
```

### Data Fetching

```javascript
useEffect(() => {
  const params = new URLSearchParams({ page: currentPage, limit: 10 });
  if (selectedDoctorId) params.append('doctorId', selectedDoctorId);
  if (userNameSearch) params.append('userName', userNameSearch);
  
  // Fetch with filters
  axios.get(`/api/admin/appointments?${params}`, { headers: { Authorization: `Bearer ${token}` } });
}, [currentPage, selectedDoctorId, userNameSearch]);
```

## Testing

### 1. Access Control
```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Access dashboard (should succeed)
curl http://localhost:5000/api/admin/appointments \
  -H "Authorization: Bearer <admin_token>"
```

### 2. Filtering
```bash
# Filter by doctor
curl "http://localhost:5000/api/admin/appointments?doctorId=abc123" \
  -H "Authorization: Bearer <admin_token>"

# Nested filter (doctor + user name)
curl "http://localhost:5000/api/admin/appointments?doctorId=abc123&userName=john" \
  -H "Authorization: Bearer <admin_token>"
```

### 3. Pagination
```bash
# Page 2
curl "http://localhost:5000/api/admin/appointments?page=2&limit=10" \
  -H "Authorization: Bearer <admin_token>"
```

## UI States

### Loading
- Shows "Loading appointments..." while fetching

### Empty State
- Shows "No appointments found. Try adjusting your filters."
- Displayed when filtered result is empty

### Error State
- Shows error message in red box
- Displays API error or "Failed to fetch appointments"

## Database Query

To manually check appointments:

```sql
-- All appointments with user and doctor info
SELECT 
  a.id,
  u.name as user_name,
  u.email as user_email,
  d.name as doctor_name,
  ts."startTime" as appointment_time
FROM "Appointment" a
JOIN "User" u ON a."userId" = u.id
JOIN "Doctor" d ON a."doctorId" = d.id
JOIN "TimeSlot" ts ON a."timeSlotId" = ts.id
ORDER BY a."createdAt" DESC
LIMIT 10;
```

## Key Features

✅ **Admin-only access** - RBAC enforced on backend and frontend  
✅ **Nested filtering** - Doctor filter → User name filter  
✅ **Pagination** - 10 rows per page with prev/next controls  
✅ **Sorted by time** - Latest appointments first  
✅ **Responsive** - Table scrolls horizontally on small screens  
✅ **Loading states** - Clear feedback during data fetching  
✅ **Empty states** - Helpful message when no results found  
