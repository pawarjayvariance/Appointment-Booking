i am making appointment booking project using prompt engineering and here is my progress till now you can read the my previus prompts and learn about my project so you can give me accurate and correct reponse based on that. 

here is my old prompts : 


1) prompt 

You are a senior full-stack engineer and system architect.

Generate a complete, production-ready appointment booking web application.

=====================
TECH STACK (MANDATORY)
=====================
Frontend:
- React.js (JSX)
- Modern hooks
- Date picker with timezone support

Backend:
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Redis (for real-time slot updates & caching)

=====================
FUNCTIONAL REQUIREMENTS
=====================

1. FRONTEND FLOW
- Display a calendar date picker with timezone support
- When user selects a date:
  - Fetch available & unavailable time slots from backend
  - Render slots visually (available vs booked/disabled)
- When user clicks an AVAILABLE slot:
  - Open a booking form with fields:
    - Name
    - Email
    - Short note
- On clicking "Schedule":
  - Send booking data to backend
  - Show loading state
  - On success:
    - Show success message
    - Update calendar slots instantly
    - Disable the booked slot

2. REAL-TIME UPDATES
- Other users viewing the same date should see slot availability updates LIVE
- Use Redis (Pub/Sub or cache invalidation)
- Prevent race conditions and double booking

3. BACKEND LOGIC
- Validate inputs
- Ensure slot is still available before booking
- Handle concurrent bookings safely
- Store booking info in database
- Emit real-time updates to clients
- Return clean API responses

=====================
DATABASE DESIGN (MANDATORY)
=====================
Use Prisma + PostgreSQL.

Tables:
1. Doctor
   - id
   - name
   - specialization
   - timezone

2. TimeSlot
   - id
   - doctorId (FK)
   - date
   - startTime
   - endTime
   - isBooked

3. Appointment
   - id
   - doctorId (FK)
   - timeSlotId (FK)
   - name
   - email
   - note
   - createdAt

Requirements:
- Proper relations
- Indexes to prevent double booking
- Prisma schema included

=====================
API ENDPOINTS
=====================
Generate Express APIs for:
- Get doctors
- Get slots by doctor & date
- Create appointment booking
- Real-time slot update handling
- Error handling & validation

Include:
- Request/response examples
- Status codes
- Edge case handling

=====================
FRONTEND IMPLEMENTATION
=====================
- React components:
  - Calendar / Date Picker
  - Slot Grid
  - Booking Modal/Form
- State management using hooks
- API integration
- Real-time updates listener
- Clean, minimal UI

=====================
REDIS USAGE
=====================
- Cache slot availability
- Handle real-time updates
- Prevent double booking using locking strategy
- Explain Redis flow clearly

=====================
DELIVERABLES
=====================
Provide:
1. Folder structure (frontend & backend)
2. Prisma schema
3. Backend code (Express + Prisma + Redis)
4. Frontend React code (JSX)
5. Real-time update logic
6. Booking flow explanation
7. Setup & run instructions
8. Key architectural decisions explained

IMPORTANT:
- Code must be clean, readable, and modular
- No placeholders
- No pseudo-code unless explicitly explaining logic
- Assume production-level quality


2) prompt (replace existing code with a fully working date picker + timezone + dynamically generated available slots system.)

You are a senior React developer. I have an existing ReactJS frontend project. I want you to **replace the current date and time selection code** with a fully functional, production-ready implementation.

Requirements:

1. **Date Picker with Timezone**
   - Use a modern React date picker (like react-datepicker or equivalent)
   - User can select a date
   - Automatically detect or allow selection of user timezone
   - Adjust available slots according to the selected timezone

2. **Available Slots Generation**
   - When user selects a date:
     - Fetch available & booked slots from backend API
     - Dynamically generate slot buttons/list for that date
     - Display slots clearly as **Available** or **Booked/Disabled**
   - Slot duration and availability rules come from backend
   - Clicking an available slot opens the booking form

3. **Frontend Behavior**
   - Loading indicator while fetching slots
   - Real-time update of slots if other users book the same time (via WebSocket/Redis)
   - Selected slot should be highlighted
   - Booked slot cannot be selected

4. **Integration**
   - Fetch slots from existing backend API endpoint `/api/slots?date=YYYY-MM-DD&doctorId=xxx`
   - Send selected slot along with form data (name, email, note) to backend booking API `/api/book`
   - Update UI on success (disable slot, show success message)

5. **Deliverables**
   - React component(s) implementing the above
   - Hooks for date picker, timezone handling, and slot state
   - Clean, modular JSX with Tailwind CSS (or existing styling)
   - Comments explaining slot generation and timezone adjustments
   - All code should be copy-paste ready into the existing project

Constraints:
- No pseudo-code
- Must handle edge cases like no available slots
- Must work for multiple doctors if API provides `doctorId`
- Must be optimized and readable


3) prompt (Timeslot table in the database to be auto-generated for the next 15 days and past dates to be cleaned automatically.)


You are a senior backend Node.js developer using Express, Prisma, PostgreSQL, and Redis. I have a Timeslot table in my database with currently static data. I want you to implement a system that:

1. **Automatic Timeslot Generation**
   - Generate timeslots **for each doctor** for the **next 15 days** automatically.
   - Each day should respect:
     - Doctor working hours (startTime, endTime)
     - Slot duration (e.g., 30 minutes)
   - Avoid duplicating existing timeslots
   - Insert new timeslots into the Timeslot table dynamically

2. **Past Timeslot Cleanup**
   - Remove timeslots **older than today** automatically to keep the table clean
   - Ensure that only future or today’s timeslots remain

3. **Implementation Requirements**
   - Create a backend **cron job / scheduled task** that runs daily
   - Use Prisma ORM to interact with PostgreSQL
   - Ensure no conflicts or duplicate slots
   - Make it efficient and scalable for multiple doctors
   - Optional: Cache newly generated slots in Redis for faster frontend queries

4. **Deliverables**
   - Complete Node.js / Express code for scheduled timeslot generation
   - Prisma queries for:
     - Inserting future timeslots
     - Deleting past timeslots
   - Explanation of how to integrate the cron job or scheduler (node-cron, agenda, or any library)
   - Clean, production-ready code with comments

Constraints:
- Must handle multiple doctors
- Must generate exactly 15 days of future slots
- Must prevent duplicate timeslots
- Must automatically remove past dates daily


4) prompt (UI feature to navigate between doctors and render each doctor’s timeslots individually using Next/Prev buttons)

You are a senior React developer. I have an appointment booking frontend in ReactJS with a list of doctors and a Timeslot component. I want to implement **Next and Previous buttons** next to the doctor's name that allow the user to navigate through doctors one by one, and render each doctor’s timeslots dynamically.  

Requirements:

1. **Doctor Navigation**
   - Display current doctor’s name prominently
   - Add **Next** and **Previous** buttons next to the doctor’s name
   - Clicking **Next** shows the next doctor in the list
   - Clicking **Previous** shows the previous doctor in the list
   - Loop around: if on the last doctor, **Next** goes to the first doctor; if on the first doctor, **Previous** goes to the last doctor

2. **Timeslot Rendering**
   - When doctor changes, fetch and display **timeslots for that doctor only** for the currently selected date
   - Timeslots must update dynamically without page reload
   - Use existing API `/api/slots?doctorId=xxx&date=YYYY-MM-DD` for fetching slots
   - Maintain timezone support and availability logic

3. **Frontend Behavior**
   - Highlight the currently selected doctor
   - Disable unavailable/booked timeslots
   - Slot selection opens booking form as usual
   - Loading indicator while fetching timeslots

4. **Deliverables**
   - React component(s) for:
     - Doctor display + Next/Prev buttons
     - Dynamic Timeslot rendering per doctor
   - State management for:
     - Current doctor index
     - Timeslots
     - Date selection
   - Clean JSX using Tailwind CSS (or existing styling)
   - Comments explaining navigation logic and slot fetching

Constraints:
- Must handle multiple doctors dynamically from API
- Must not reload the page; updates should be seamless
- Must work with existing date picker and timeslot selection logic
- Must be production-ready, copy-paste ready



you can read all prompts mention above and give answers by considering them 


5) prompt (Update the system so that **booked (disabled) time slots become editable** and allow updating an existing appointment.)

Update the system so that **booked (disabled) time slots become editable** and allow updating an existing appointment.

=====================
CHANGES TO IMPLEMENT
=====================

1. FRONTEND CHANGES
- Booked slots should remain visually distinct but must be **clickable**
- Clicking a booked slot opens an **Update Appointment modal**
- Fetch and display existing appointment data for that slot:
  - name
  - email
  - note
  - current time slot
- Allow user to:
  - Edit name, email, note
  - Change to another available time slot (same doctor)
- On successful update:
  - Old slot becomes available
  - New slot becomes booked
  - UI updates instantly
  - Real-time updates are broadcast to all users

2. BACKEND API CHANGES
Add ONLY the following endpoints:

A. Get appointment by timeslot
- GET `/api/appointments/by-slot/:timeSlotId`
- Returns appointment data for the booked slot

B. Update appointment
- PUT `/api/appointments/:appointmentId`
- Update:
  - name
  - email
  - note
  - timeSlotId (reschedule)
- Validate slot availability
- Prevent double booking
- Use Prisma transaction:
  - release old slot
  - book new slot
  - update appointment record

3. REDIS & REAL-TIME
- Use Redis locking to prevent concurrent updates
- Publish real-time events when:
  - slot status changes
  - appointment is updated
- All connected clients must see slot updates instantly

4. DATABASE RULES
- One appointment per slot at all times
- Slot state must always stay consistent
- No duplicate bookings allowed

=====================
DELIVERABLES
=====================

- Backend route code (only new/updated files)
- Prisma queries and transaction logic
- Frontend React changes (slot click handling + update modal)
- Request/response examples
- A SHORT README explaining:
  - How slot updating works
  - Update flow
  - New endpoints added

=====================
CONSTRAINTS
=====================
- Do NOT re-explain existing booking logic
- No pseudo-code
- Production-ready code only
- Assume existing doctor, slot, timezone, and real-time logic already exists

**fix problem**

Problem:
After making booked slots editable and updating appointments, the frontend may:
- Enter an infinite re-render loop when loading slots
- Fail to reflect updated slot and appointment data correctly

Goal:
Fix the UI so that:
1. Slots load properly without infinite re-renders
2. Updated appointment data (name, email, note, time slot) is displayed immediately
3. Slot availability updates correctly in the UI after editing
4. Real-time updates continue to work for all users

Requirements:
- Prevent useEffect or state logic from causing repeated fetches
- Ensure slot fetching depends only on relevant dependencies (doctorId, date, update events)
- Use state management correctly to replace old slot data with updated slot data
- Avoid unnecessary re-renders of unchanged components
- Ensure updated slot info is synced with the backend and Redis events

Deliverables:
- Frontend React code fixes for slot fetching and rendering
- Correct useEffect dependency management
- Proper state updates after appointment edit
- Real-time slot update handling without infinite loops

Constraints:
- Do not alter existing booking logic unnecessarily
- Focus only on fixing re-render and UI update issues
- Must be production-ready and handle multiple doctors and timezones


6) prompt ()

Requirements (Modified for AM → PM Ordering):

Backend:

Query timeslots for all doctors.

Sort timeslots so that AM slots (00:00–11:59) appear first, followed by PM slots (12:00–23:59).

Within AM and PM groups, timeslots must be in ascending order based on startTime.

Use Prisma orderBy or raw queries if needed to ensure proper AM/PM grouping.

Frontend:

Assume the backend returns AM-first, then PM-sorted slots.

As a safety fallback, re-sort slots in JavaScript:

Group by AM and PM based on startTime.

Sort each group in ascending order.

Concatenate AM group first, then PM group.

Render slots from earliest to latest visually, respecting AM → PM order.

Timezone:

Respect the user-selected timezone when converting times.

Sorting must occur after timezone conversion to maintain correct AM/PM order.

UI Behavior:

Morning (AM) slots appear first, afternoon/evening (PM) slots next.

Booked slots remain disabled but maintain their correct AM/PM position.

Edge Cases:

Handle midnight (12:00 AM) as the earliest AM slot.

Handle noon (12:00 PM) as the first PM slot.

Work for multiple doctors simultaneously.



7) prompt (authentication system)

Goal:
Add a secure authentication system to the existing appointment booking project so users can register and log in using credentials before accessing protected features.

=====================
AUTHENTICATION REQUIREMENTS
=====================

1. USER REGISTRATION
- Allow users to register with:
  - name
  - email (unique)
  - password
- Validate inputs properly
- Hash passwords securely (bcrypt or equivalent)
- Prevent duplicate email registrations
- Store user data securely in the database

2. USER LOGIN
- Allow users to log in using email and password
- Verify hashed passwords correctly
- Return an authentication token on successful login
- Reject invalid credentials with proper error messages

3. AUTH STRATEGY
- Use JWT-based authentication
- Access token must:
  - Be signed securely
  - Have an expiration time
- Protect private routes using auth middleware
- Public routes must remain accessible where required

4. DATABASE CHANGES
- Add a `User` table with:
  - id
  - name
  - email (unique)
  - passwordHash
  - createdAt
- Define proper indexes and constraints

5. BACKEND CHANGES
- Create auth routes:
  - POST `/api/auth/register`
  - POST `/api/auth/login`
- Implement authentication middleware to:
  - Validate JWT
  - Attach authenticated user to request
- Secure protected APIs (booking, updating appointments, etc.)

6. FRONTEND CHANGES
- Create:
  - Register form
  - Login form
- Store token securely (HTTP-only cookie or secure storage)
- Attach token to authenticated API requests
- Handle auth errors and loading states
- Redirect unauthenticated users to login

7. SECURITY RULES (MANDATORY)
- Never store plain-text passwords
- Never expose password hashes in responses
- Validate and sanitize all inputs
- Use proper HTTP status codes
- Protect against:
  - brute-force login attempts
  - unauthorized access
- Logout must invalidate authentication on client side

=====================
DELIVERABLES
=====================

- Prisma schema updates
- Backend auth routes and middleware
- Password hashing and token logic
- Frontend login/register components
- Example request/response payloads
- Short README explaining auth flow

=====================
CONSTRAINTS
=====================

- Do NOT rebuild existing booking logic
- Production-ready code only
- No pseudo-code
- Must integrate with existing backend and frontend
- Follow standard authentication best practices



8) prompt ()

i previusly added authentication for user but now 
i want to add role based access in my this project roles are user,admin,doctor, by default login selects as a user 

follow all the rules which required by authorization give me prompt for this 






Goal:
Extend the existing authentication system to support **role-based access control (RBAC)** with the roles:
- user
- doctor
- admin

By default, every newly registered account must have the role: `user`.

=====================
AUTHORIZATION REQUIREMENTS
=====================

1. ROLES
- Supported roles:
  - user (default)
  - doctor
  - admin
- Roles must be stored in the database
- Role must be included securely in the authentication token (JWT)

2. DATABASE CHANGES
- Update User table to include:
  - role (enum or string)
- Enforce default role = `user` on registration
- Ensure role cannot be modified by normal users

3. BACKEND AUTHORIZATION
- Implement role-based authorization middleware
- Middleware must:
  - Verify authentication first (JWT validation)
  - Check required role(s) for each protected route
- Protect routes as follows:
  - user: basic booking & profile access
  - doctor: view and manage own appointments
  - admin: manage doctors, users, and system data
- Return proper HTTP status codes:
  - 401 Unauthorized (not logged in)
  - 403 Forbidden (role not allowed)

4. ROUTE PROTECTION
- Apply role guards to existing APIs without breaking current functionality
- Ensure:
  - Users cannot access admin or doctor routes
  - Doctors cannot access admin routes
  - Admin has full access

5. FRONTEND AUTHORIZATION
- Store user role after login
- Conditionally render UI based on role:
  - Hide admin/doctor features from normal users
- Redirect users if they attempt to access unauthorized pages
- Prevent role manipulation on client side

6. SECURITY RULES (MANDATORY)
- Role checks must be enforced on the backend (frontend checks are NOT sufficient)
- Never trust client-provided role values
- Prevent privilege escalation
- Keep role logic centralized and reusable

=====================
DELIVERABLES
=====================

- Prisma schema updates (role support)
- Backend RBAC middleware
- Updated auth token payload
- Protected route examples per role
- Frontend role-based UI handling
- Short README explaining RBAC flow

=====================
CONSTRAINTS
=====================

- Do NOT rebuild authentication
- Do NOT change existing booking logic
- Production-ready code only
- No pseudo-code
- Must integrate cleanly with existing JWT auth



9) prompt (Admin Dashboard)

Goal:
Enhance the existing AdminDashboard component by adding a left-side vertical navigation
with tabs for Doctor, User, and Appointment data views.

This is an ADDITION ONLY.
Do NOT modify or refactor the existing codebase or database schema.

=====================
UI STRUCTURE
=====================

1. LAYOUT
- Left side: vertical sidebar with tabs:
  - Doctor
  - User
  - Appointment
- Right side: content area displaying a table based on the selected tab
- Only one table is visible at a time

=====================
DOCTOR TAB REQUIREMENTS
=====================

Table Columns (in order):
- Serial number
- Name
- Specialization
- Timezone
- Slot duration
- Working start time
- Working end time

Filtering:
- Each column must have its own filter input
- Filters must be NESTED:
  - Applying one filter and then another must filter the already filtered data
  - Filters must not reset each other

Pagination:
- 10 rows per page
- Next and Previous buttons
- Pagination must apply to the final filtered dataset

=====================
USER TAB REQUIREMENTS
=====================

Table Columns:
- Serial number
- Name
- Email
- Role

Filtering:
- Column-wise filters
- Nested filtering (filters apply on already filtered results)

Pagination:
- 10 rows per page
- Same pagination behavior as Doctor tab

=====================
APPOINTMENT TAB REQUIREMENTS
=====================

Table Columns:
- Serial number
- User name
- User email
- Doctor name
- Appointment date & time

Filtering:
- Column-wise filters
- Nested filtering behavior

Pagination:
- 10 rows per page
- Pagination applies after all filters

=====================
DATA & ACCESS RULES
=====================

- Only admin users can access this dashboard
- Reuse existing authentication and RBAC logic
- Fetch data via existing or new admin-only APIs as needed
- Do NOT change existing APIs unless absolutely required

=====================
DELIVERABLES
=====================

- Updated AdminDashboard component
- Vertical sidebar navigation
- Table components for Doctor, User, Appointment
- Filter logic with nested filtering
- Pagination logic
- Loading and empty states
- Clean, production-ready React code

=====================
CONSTRAINTS
=====================

- Do NOT change database schema
- Do NOT refactor existing booking, auth, or slot logic
- No pseudo-code
- Production-ready solution only



10) prompt (A user can ONLY edit, cancel, or reschedule their OWN appointments) 


You are a senior full-stack developer working on an existing appointment booking system.
Implement appointment edit, cancel, and reschedule functionality, strictly following the constraints below.

==================================================
CORE RULE (VERY IMPORTANT)
==================================================
- A user can ONLY edit, cancel, or reschedule their OWN appointments
- Users must NOT be able to modify appointments booked by other users
- Admins and doctors may have read access, but only users can modify their own bookings
- Do NOT change the existing database schema

==================================================
EXISTING TECH STACK (DO NOT CHANGE)
==================================================
Frontend:
- React.js with hooks
- Plain CSS (NO Tailwind, NO UI libraries)
- Date picker with timezone support
- Socket.IO client

Backend:
- Node.js + Express.js
- Prisma ORM
- PostgreSQL
- Redis (slot locking + caching)
- Socket.IO

Authentication:
- JWT-based authentication
- Roles: user | doctor | admin
- Auth middleware provides req.user.id and req.user.role

==================================================
EXISTING DATABASE TABLES (READ ONLY)
==================================================
User
Doctor
TimeSlot
Appointment

Relations:
- Appointment → User (many-to-1)
- Appointment → Doctor (many-to-1)
- Appointment → TimeSlot (1-to-1)

==================================================
FEATURES TO IMPLEMENT
==================================================

1) Authorization & Ownership Enforcement (Backend)
- Create middleware that:
  - Validates JWT
  - Fetches appointment by appointmentId
  - Confirms appointment.userId === req.user.id
- Return:
  - 403 Forbidden if user tries to modify another user’s appointment
  - 404 if appointment does not exist

--------------------------------------------------

2) Edit Appointment (User Only)
Allow editing:
- name
- email
- note

Rules:
- Only the appointment owner can edit
- Validate and sanitize input
- Emit real-time updates via Socket.IO

API:
PUT /api/appointments/:id

--------------------------------------------------

3) Cancel Appointment (User Only)
Behavior:
- Cancel or delete the appointment (based on existing logic)
- Set associated TimeSlot.isBooked = false
- Release Redis slot lock
- Emit Socket.IO events to update all clients

API:
DELETE /api/appointments/:id

--------------------------------------------------

4) Reschedule Appointment (User Only)
Behavior:
- User selects a new available TimeSlot
- Use Redis locking to prevent double booking
- Update:
  - appointment.timeSlotId
- Free old slot and book new slot atomically
- Emit Socket.IO events for slot and appointment updates

API:
PATCH /api/appointments/:id/reschedule

--------------------------------------------------

5) Redis Slot Locking
- Lock new slot before rescheduling
- Abort if slot is already locked or booked
- Release lock on success or failure

--------------------------------------------------

6) Real-Time Updates (Socket.IO)
Emit events:
- appointment:updated
- appointment:canceled
- appointment:rescheduled
- slot:updated

All connected clients must reflect changes instantly.

--------------------------------------------------

7) Frontend (React + CSS)
- Show Edit / Cancel / Reschedule buttons ONLY for appointments owned by the logged-in user
- Disable actions for past appointments
- Pre-fill form on edit
- Reset form when switching slots
- Use existing CSS files and class naming conventions
- Handle loading, success, and error states
- UI must update instantly after changes (Socket.IO + local state)

--------------------------------------------------

8) Security & Best Practices
- Backend must enforce ownership (frontend checks are not enough)
- Prevent race conditions and double booking
- Handle edge cases:
  - Unauthorized access
  - Slot already booked
  - Appointment not found
- Clean, modular, production-ready code

==================================================
DELIVERABLES
==================================================
- Backend routes and controllers
- Ownership authorization middleware
- Redis lock implementation
- Socket.IO event flow
- Frontend component and hook updates (CSS-based UI)
- Short explanation of:
  - Ownership enforcement
  - Cancel vs reschedule logic
  - Race condition prevention

==================================================
IMPORTANT
==================================================
- Do NOT modify Prisma schema
- Do NOT introduce Tailwind or UI libraries
- Do NOT break existing booking logic
- Extend the current codebase only



11) prompt ( change appointment booking form)


You are a senior full-stack developer working on an existing appointment booking system.  
Implement a dynamic appointment booking form that updates its fields when a user clicks a TimeSlot.

==================================================
FEATURE REQUIREMENTS
==================================================

1) Dynamic Form Fields on Slot Click
- When a user clicks on a TimeSlot:
  - The booking form should display the following fields:
    - name
    - email
    - phone number
    - gender
    - date of birth (DOB)
    - address
- Pre-fill fields with existing user info if available (for logged-in users)
- Reset form when user selects a different TimeSlot
- Show a loading state while data is being fetched (if needed)

2) Frontend (React + CSS)
- Use React hooks to manage form state
- Dynamically render the fields based on the selected slot
- Validate all fields:
  - name, email, phone, DOB: required
  - email: valid format
  - phone: numeric and valid length
- Use existing CSS for styling (do NOT use Tailwind or other UI libraries)
- Ensure form submits correctly to the existing booking API

3) Backend Integration
- Booking API should accept the new fields:
  - name, email, phone, gender, DOB, address
- Validate inputs server-side
- Save fields in the Appointment record
  - If the current Appointment table doesn’t have all fields (phone, gender, DOB, address), store them in JSON column `additionalInfo` or extend backend logic without changing the schema structure

4) Real-Time Updates
- After booking, emit Socket.IO events to update all clients’ slot availability
- Reset form after successful booking

5) Security & Best Practices
- Only logged-in users can book appointments
- Sanitize all input to prevent XSS or injection attacks
- Clean, modular React component structure
- Avoid unnecessary re-renders when switching slots

==================================================
DELIVERABLES
==================================================
- React component for dynamic booking form
- Form state management with hooks
- Field validation logic
- Integration with backend booking API
- Socket.IO integration for live updates
- CSS-based styling for new fields
- Clear explanation of dynamic form rendering logic

==================================================
IMPORTANT
==================================================
- Do NOT introduce Tailwind or other CSS libraries
- Respect existing backend schema
- Ensure form resets properly when switching slots
- Ensure real-time updates reflect correctly for all users


12) prompt (reschedule functionality)

You are a senior full-stack developer working on an existing appointment booking system.  
Implement a **reschedule feature** for users using a popup modal with calendar and available slots.

==================================================
FEATURE REQUIREMENTS
==================================================

1) Reschedule Button & Popup
- When a user clicks the **“Reschedule”** button on their appointment:
  - Open a modal/popup
  - The popup contains:
    - A calendar/date picker (with timezone support)
    - List of all available TimeSlots for the selected date
      - Each slot shows start and end time
      - Booked slots are disabled or greyed out
- User can select a new slot from the list

2) Frontend (React + CSS)
- Use React hooks for popup state and slot selection
- Calendar must allow selection of dates up to next 15 days
- Dynamically fetch available slots for the selected date from backend
- Pre-select the current slot in the popup for reference
- Disable past dates and unavailable slots
- Validate slot selection before submitting
- Use existing CSS for styling (do NOT use Tailwind)

3) Backend Integration
- Create API endpoint:
  PATCH /api/appointments/:id/reschedule
- Input: selected slot ID
- Validate:
  - Appointment belongs to logged-in user
  - New slot is available and not booked
- Update appointment with new TimeSlot
- Release previous TimeSlot (`isBooked = false`)
- Lock new TimeSlot with Redis to prevent race conditions
- Return updated appointment details

4) Real-Time Updates
- Use Socket.IO to broadcast updates:
  - `appointment:rescheduled` to update all clients
  - `slot:updated` to update availability
- Close popup automatically after successful reschedule
- Refresh parent component to reflect new appointment time

5) Security & Best Practices
- Only logged-in users can reschedule their own appointments
- Prevent double booking and race conditions using Redis lock
- Sanitize and validate all input
- Modular, reusable React popup component
- Handle errors gracefully (slot taken, server error)

==================================================
DELIVERABLES
==================================================
- React popup component with calendar + available slots
- Hook-based state management for date and slot selection
- Backend reschedule API with validation
- Redis slot locking implementation
- Socket.IO integration for real-time updates
- CSS-based styling
- Clear explanation of popup flow, reschedule logic, and real-time updates

==================================================
IMPORTANT
==================================================
- Do NOT modify existing Prisma schema
- Do NOT use Tailwind or UI libraries
- Only allow users to reschedule their own appointments
- Ensure popup resets if closed or date/slot changes
- Real-time updates must reflect for all connected clients


13) prompt (ui for doctor page)

You are a senior full-stack developer working on an existing appointment booking system.  
Implement a **Doctor page layout** with sidebar navigation and vertical tabs, using **React + plain CSS**. Do not implement inner page content yet.

==================================================
FEATURE REQUIREMENTS
==================================================

1) Layout & Navigation
- Full-screen layout
- Left vertical sidebar with tabs:
  - My Appointments
  - My Schedule
  - Patients
- Active tab should be visually highlighted
- Sidebar fixed on the left, content area fills the rest of the screen
- Clicking a tab updates the content area to show a placeholder for now (e.g., "My Appointments Content")
- Sidebar should be responsive if possible

2) Frontend (React + CSS)
- Use React hooks for managing active tab state
- CSS styling only (no Tailwind or other libraries)
- Clean, modular component structure:
  - Sidebar component
  - DoctorDashboard parent component
  - Content area component

3) Placeholder Content
- Each tab shows a simple heading in content area:
  - "My Appointments Content"
  - "My Schedule Content"
  - "Patients Content"

4) Security & Role-Based Access
- Only logged-in doctors can access this page
- Display an alert or redirect if another role tries to access

==================================================
DELIVERABLES
==================================================
- React component for DoctorDashboard
- Sidebar with vertical tabs
- Active tab highlight
- Placeholder content area for each tab
- CSS styling for layout and tabs
- Hook-based state management for active tab
- Role-based access enforcement (frontend warning)

==================================================
IMPORTANT
==================================================
- Do NOT implement tables or inner page UI yet
- Do NOT use Tailwind or other UI libraries
- Layout should match AdminDashboard structure
- Modular and reusable React components


14) prompt (Create a relation between User and Doctor)

You are a senior backend developer working on an existing appointment booking system.
Implement a clean relation between the `User` table and the `Doctor` table so that when a user logs in with role = "doctor", the corresponding doctor profile data is also fetched.

==================================================
GOAL
==================================================
- Authentication must continue to use the `User` table
- Doctor-specific profile data must come from the `Doctor` table
- When a doctor logs in, both User and Doctor data should be available together
- This data will be used to display doctor-specific dashboards and data

==================================================
CONSTRAINTS
==================================================
- Do NOT change existing booking, appointment, timeslot, or admin logic
- Do NOT refactor authentication or JWT flow
- Do NOT break role-based access control
- Keep the implementation backward-compatible

==================================================
IMPLEMENTATION REQUIREMENTS
==================================================

1) User ↔ Doctor Relation
- Establish a one-to-one relation between User and Doctor
- Use one of the following approaches (based on what exists):
  - Preferred: `Doctor.userId` references `User.id`
  - Alternative: match `Doctor.id === User.id` if IDs are already aligned
- Do NOT modify other tables

2) Login / Fetch Logic
- During login or user fetch:
  - Authenticate user from the User table
  - Check if `user.role === "doctor"`
  - If yes, fetch the related Doctor record
- Combine both into a single response object

Example response:
```json
{
  "user": {
    "id": "user_id",
    "email": "doctor@email.com",
    "role": "doctor"
  },
  "doctor": {
    "id": "doctor_id",
    "name": "Dr. Smith",
    "specialization": "Cardiology",
    "timezone": "Asia/Kolkata",
    "workingStartTime": "09:00",
    "workingEndTime": "17:00"
  }
}
Prisma / ORM Usage

Use Prisma relations or join queries (include, findUnique, findFirst)

Ensure sensitive fields like passwordHash are not exposed

If the user is not a doctor, return doctor: null

==================================================
DELIVERABLES
Prisma relation or join logic between User and Doctor

Backend function or login enhancement that fetches doctor data

Example response payload

Short explanation of how the relation works

==================================================
IMPORTANT
Do NOT modify other database tables

Do NOT introduce new authentication flows

Keep code modular and production-ready



15) prompt (My Appointments)

You are a senior full-stack developer working on an existing appointment booking system.
Implement a feature to display **all appointments booked under the currently logged-in doctor**
in a **table format with pagination and filtering**, inside the **“My Appointments” tab** of the Doctor dashboard.

==================================================
GOAL
==================================================
- Show only appointments that belong to the logged-in doctor
- Data must be filtered by doctor identity (not client-side only)
- Table should support pagination and column-based filtering
- This table will be rendered inside the "My Appointments" tab

==================================================
CONSTRAINTS
==================================================
- Do NOT modify database schema
- Do NOT affect admin or user appointment views
- Backend must enforce doctor-level data isolation
- Use existing authentication and User ↔ Doctor relation
- UI must use React + plain CSS (no Tailwind or UI libraries)

==================================================
BACKEND REQUIREMENTS
==================================================

1) Authorization
- Only users with role = "doctor" can access this endpoint
- Identify doctor using logged-in user info (JWT)

2) Fetch Logic
- Fetch appointments where:
  - appointment.doctorId === logged-in doctor’s doctorId
- Include related data:
  - Patient name
  - Patient email
  - Appointment date
  - Slot start & end time
  - Appointment status

3) API Endpoint
GET /api/doctor/appointments

Query params:
- page (default: 1)
- limit (default: 10)
- filters (name, email, date)

4) Pagination
- Server-side pagination
- Return:
```json
{
  "data": [],
  "page": 1,
  "totalPages": 5,
  "totalRecords": 42
}
==================================================
FRONTEND REQUIREMENTS
Table UI (React + CSS)
Columns:

Serial No.

Patient Name

Email

Appointment Date

Time Slot

Status

Filtering

Input fields for:

Patient Name

Email

Date

Filters should:

Apply to already filtered dataset

Trigger API call with debounce

Pagination

10 rows per page

Next / Previous buttons

Disable buttons when no more pages

States

Loading state while fetching data

Empty state if no appointments found

Error state on API failure

==================================================
SECURITY & BEST PRACTICES
Doctor must never see other doctors’ appointments

Do NOT rely on frontend-only filtering

Sanitize query parameters

Clean, modular, production-ready code

==================================================
DELIVERABLES
Backend API to fetch doctor-specific appointments

Prisma query filtered by doctorId

Frontend table component with pagination and filters

CSS styling for table and controls

Short explanation of data flow and filtering logic

==================================================
IMPORTANT
Do NOT change Prisma schema

Do NOT break existing booking logic

Feature must work only for logged-in doctors


16) prompt (“My Schedule” management feature)

now i want a feature where doctor can edit or change its slotduration,time and also selects slots to disable that slots for user( user see that in this slot doctor is not available with disable slot) doctor select date by calander and select slots after that give one button to disable slots,  implement this all thing in "my schedule" give me prompt for this 

You are a senior full-stack developer working on an existing appointment booking system.  
Implement a **Doctor “My Schedule” management feature** with the following capabilities:

==================================================
GOAL
==================================================
- Allow doctors to:
  1. Edit their slot duration and working hours
  2. Disable specific time slots for a selected date
- Disabled slots are visible to users as unavailable
- All functionality resides inside the “My Schedule” tab of the Doctor dashboard

==================================================
CONSTRAINTS
==================================================
- Authentication via User table + Doctor relation
- Only users with role = "doctor" can perform these actions
- Do NOT modify existing tables except for updates to Doctor / TimeSlot
- UI must be React + plain CSS (no Tailwind)

==================================================
FEATURE REQUIREMENTS
==================================================

1) Calendar Date Picker
- Doctor selects a date using a calendar component (with timezone support)
- Display all time slots for that date in a selectable format (checkboxes or buttons)
- Highlight already booked slots or previously disabled slots

2) Edit Slot Duration & Working Hours
- Allow doctor to update:
  - Slot duration (minutes)
  - Working start time
  - Working end time
- Changes should dynamically update available slots for the selected date
- Backend must validate:
  - Slot duration > 0
  - Start time < End time
  - No overlapping slots

3) Disable Slots Feature
- Doctor selects one or more slots for the selected date
- Click a **“Disable Slots”** button
- Backend updates `TimeSlot.isBooked` or another flag to mark slots as unavailable
- Users see disabled slots as unavailable
- Emit Socket.IO events to update real-time availability

4) Backend API Endpoints
- GET /api/doctor/schedule?date=YYYY-MM-DD
  - Fetch all slots for the selected date
- PATCH /api/doctor/schedule/update-hours
  - Update working hours and slot duration
- POST /api/doctor/schedule/disable-slots
  - Input: date + array of slot IDs
  - Mark slots as unavailable
  - Prevent modification of already booked slots

5) Frontend (React + CSS)
- Display:
  - Calendar for date selection
  - Table or grid of slots (selectable)
  - Inputs for working hours and slot duration
  - Disable Slots button
- States:
  - Loading
  - Success/failure messages
  - Disabled slots visually distinct
- Update UI in real-time after disabling slots using Socket.IO

6) Security & Validation
- Backend enforces role = doctor
- Validate all inputs
- Prevent disabling already booked slots
- Sanitization to prevent injection

==================================================
DELIVERABLES
==================================================
- React “My Schedule” component with:
  - Calendar
  - Slot selection
  - Working hours & slot duration inputs
  - Disable slots button
- Backend endpoints for fetching slots, updating hours, disabling slots
- Socket.IO events for real-time updates
- CSS styling for grid/table layout
- Clear explanation of how slot updates and disabling work

==================================================
IMPORTANT
==================================================
- Do NOT affect other tables or users’ appointments
- Must maintain backward compatibility
- All disabled slots must be reflected in the user booking interface
- Modular, clean, and production-ready code



17) prompt ( profile section )

You are a senior full-stack developer working on an existing appointment booking system.  
Implement a **Profile section for all roles (User, Doctor, Admin)** with the following features:

==================================================
GOAL
==================================================
- Allow users to view and update their profile
- Features:
  - Display default profile picture initially
  - Update profile picture
  - Update name
  - Display email (read-only)
- Profile section displayed in dashboard, **before the Sign Out button**
- Works for all roles: User, Doctor, Admin

==================================================
CONSTRAINTS
==================================================
- Use React + plain CSS (no Tailwind or UI libraries)
- Do NOT allow email to be updated
- Maintain existing authentication, RBAC, and dashboard layouts
- Backend must validate user identity before updating profile

==================================================
FEATURE REQUIREMENTS
==================================================

1) Profile Picture
- Default profile picture for new users
- Users can upload a new picture
- Backend should store picture URL or file path
- Frontend should display updated picture immediately

2) Name
- Users can update their display name
- Backend must validate non-empty input
- Reflect changes immediately in dashboard and header

3) Email
- Displayed as read-only
- Cannot be updated

4) Location in Dashboard
- Profile section appears above the "Sign Out" button in sidebar or header
- Shows:
  - Profile picture
  - Name (editable)
  - Email (read-only)
  - Save / Update button for changes

5) Backend Endpoints
- GET /api/profile → fetch user info including role and profile picture
- PATCH /api/profile → update name and profile picture
  - Validate user identity
  - Save updated profile picture URL

6) Frontend (React + CSS)
- Form with:
  - Image upload component
  - Editable name input
  - Read-only email field
  - Save button
- Loading, success, and error states
- Update dashboard header with new name and picture after save

==================================================
DELIVERABLES
==================================================
- Backend endpoints to fetch and update profile
- React component for profile section
- Default profile picture logic
- CSS styling for profile display in sidebar/header
- Real-time update of name and profile picture in dashboard
- Short explanation of backend and frontend flow

==================================================
IMPORTANT
==================================================
- Do NOT allow email updates
- Must work for all roles: User, Doctor, Admin
- Keep profile section modular for reuse across dashboards
- Ensure role-based access and authentication for updates


18) prompt ( Doctor Review & Feedback feature )

You are a senior full-stack developer working on an existing appointment booking system.
Implement a **Doctor Review & Feedback feature** where users can rate doctors (1–5 stars) and leave feedback, and doctors can view all reviews given to them.

==================================================
GOAL
==================================================
- Allow users to:
  - Give a star rating (1 to 5)
  - Write a feedback message for a doctor
- Calculate and display the doctor’s average rating
- Allow doctors to:
  - View all reviews (stars + feedback messages) given to them
- Keep the feature role-specific and secure

==================================================
CONSTRAINTS
==================================================
- Use existing authentication and RBAC
- UI must be React + plain CSS (no Tailwind or UI libraries)
- Backend must enforce ownership and role checks
- Do NOT affect existing booking, appointment, or admin logic

==================================================
DATA MODEL REQUIREMENTS
==================================================
- Introduce a new table (if allowed):
  Review
    - id
    - userId
    - doctorId
    - rating (1–5)
    - feedback (text)
    - createdAt

- Relations:
  - Review → User (many-to-1)
  - Review → Doctor (many-to-1)

==================================================
FEATURE REQUIREMENTS
==================================================

1) User: Give Review & Feedback
- User can submit a review only for doctors they have booked appointments with
- Review includes:
  - Star rating (1 to 5)
  - Feedback message
- Prevent multiple reviews for the same appointment (if applicable)
- Validate:
  - rating must be between 1 and 5
  - feedback length limits

API:
POST /api/reviews

--------------------------------------------------

2) Average Rating Calculation
- Calculate average rating per doctor
- Store dynamically or compute on query
- Display:
  - Average rating (e.g., 4.3 ★)
  - Total number of reviews

API:
GET /api/doctors/:doctorId/ratings

--------------------------------------------------

3) Doctor: View Feedbacks
- Doctor can view all reviews given to them
- Display in table format:
  - Patient Name
  - Star Rating
  - Feedback Message
  - Date
- Pagination (limit 10)
- Sorted by latest first

API:
GET /api/doctor/reviews

--------------------------------------------------

4) Frontend (React + CSS)

User UI:
- Star rating input (clickable stars)
- Feedback textarea
- Submit button
- Success / error states

Doctor UI:
- Table of reviews with:
  - Stars rendered visually
  - Feedback message
- Pagination
- Empty and loading states

--------------------------------------------------

5) Security & Validation
- Only logged-in users can submit reviews
- Users can only review doctors they had appointments with
- Doctors can only see their own reviews
- Sanitize feedback input
- Backend must enforce all checks (not frontend-only)

==================================================
DELIVERABLES
==================================================
- Review table schema
- Backend APIs for:
  - Submitting reviews
  - Fetching doctor reviews
  - Calculating average rating
- Prisma queries
- React components for:
  - User review submission
  - Doctor review listing
- CSS styling
- Short explanation of:
  - Review flow
  - Rating calculation
  - Role-based access

==================================================
IMPORTANT
==================================================
- Do NOT break existing appointment logic
- Keep feature modular and extendable
- Ensure clean, production-ready code


19) prompt ( Multi-Tenant Implementation )


You are a senior full-stack architect.

I have an existing appointment booking system with:
- Roles: admin, doctor, user
- JWT-based authentication
- Prisma ORM + PostgreSQL
- Redis + Socket.IO
- Working dashboards for admin, doctor, and user
- Existing relations between User, Doctor, Appointment, Review, Slot

Now I want to convert this system into a MULTI-TENANT SaaS platform
by introducing a Super Admin and Tenant architecture.

IMPORTANT:
- Do NOT break existing logic
- Do NOT remove existing relationships
- Modify tables carefully
- Keep backward compatibility
- Avoid refactoring core appointment logic
- Make minimal, safe, incremental changes

==================================================
GOAL
==================================================

Implement:
1) Super Admin role
2) Tenant table
3) Tenant-based data isolation
4) Ensure existing functionality continues to work

==================================================
STEP 1: ADD TENANT TABLE
==================================================

Create a new table:

Tenant
- id (primary key)
- name (clinic/hospital name)
- status (active / suspended)
- createdAt
- updatedAt

Constraints:
- No impact on existing tables yet
- No deletion of existing fields

==================================================
STEP 2: ADD tenantId COLUMN CAREFULLY
==================================================

Add tenantId (nullable initially) to:

- User
- Doctor
- Appointment
- Review
- Slot

Rules:
- Initially allow NULL to avoid breaking existing data
- Add proper foreign key relations to Tenant
- After migration, assign existing data to a default tenant
- Then make tenantId required (NOT NULL) after safe migration

==================================================
STEP 3: CREATE DEFAULT TENANT
==================================================

During migration:
- Create one default tenant (e.g., "Default Clinic")
- Assign all existing records to this tenant
- Ensure no existing queries fail

==================================================
STEP 4: ADD SUPER_ADMIN ROLE
==================================================

Extend role enum:
- super_admin
- admin
- doctor
- user

Rules:
- Only super_admin can manage tenants
- Existing admins remain tenant-level admins

==================================================
STEP 5: UPDATE JWT PAYLOAD
==================================================

Modify JWT to include:
- userId
- role
- tenantId

Ensure:
- Existing authentication logic continues working
- Middleware reads tenantId safely
- Backward compatibility maintained

==================================================
STEP 6: DATA ISOLATION LOGIC
==================================================

Modify backend queries carefully:

For non-super_admin roles:
Always filter by:
    tenantId = req.user.tenantId

For super_admin:
Bypass tenant filtering when needed.

IMPORTANT:
Do NOT rewrite entire controllers.
Just extend existing queries safely.

==================================================
STEP 7: SUPER ADMIN PANEL
==================================================

Create new Super Admin dashboard:

Tabs:
- Manage Tenants
- View All Tenants
- Suspend / Activate Tenant
- View Tenant Statistics

Do NOT modify existing Admin dashboard UI.

==================================================
SECURITY RULES
==================================================

- If tenant.status = "suspended":
    Block login for that tenant's users
- Ensure strict data isolation
- Never allow cross-tenant access
- Enforce filtering at backend, not frontend

==================================================
DELIVERABLES
==================================================

1) Updated Prisma schema (safe migration steps included)
2) Migration strategy explanation
3) Middleware update for tenant-based filtering
4) Updated JWT generation logic
5) Super Admin API routes
6) Clear explanation of how backward compatibility is maintained

==================================================
VERY IMPORTANT
==================================================

- Make incremental changes only
- Avoid destructive schema updates
- Ensure existing appointment booking still works
- Keep system production-safe
- Do not refactor unrelated logic
- Clearly explain each modification step before code

This must be implemented as a careful upgrade, not a rewrite.



20) prompt ( Super Admin role )

You are a senior full-stack developer working on an existing appointment booking system.  
Implement a **Super Admin role** with full system-level access, alongside the existing roles (admin, doctor, user), without breaking current functionality.

==================================================
GOAL
==================================================
- Add a new role: `super_admin`
- Super Admin can:
  - Create, manage, activate, suspend tenants (if multi-tenant implemented)
  - View all users, doctors, appointments across tenants
  - Access system-wide statistics
- Existing roles (admin, doctor, user) continue working exactly as before
- Super Admin is restricted only to authorized Super Admin users

==================================================
CONSTRAINTS
==================================================
- Use existing authentication (JWT)
- Backend must enforce Super Admin role in all APIs
- Do NOT break existing Admin or Doctor dashboards
- Keep role handling modular for future RBAC changes
- Frontend changes minimal: only Super Admin dashboard/tabs

==================================================
IMPLEMENTATION REQUIREMENTS
==================================================

1) Database / Prisma
- Add `super_admin` to `role` enum in `User` table
- Optionally create one initial Super Admin user during setup
- Ensure backward compatibility with existing user data

2) Backend Authorization
- Middleware should:
  - Check `req.user.role === "super_admin"` for super admin routes
  - Restrict all tenant-level admin endpoints appropriately
- Example routes for Super Admin:
  - /api/super-admin/tenants → create, list, update tenants
  - /api/super-admin/users → view all users
  - /api/super-admin/appointments → view all appointments

3) JWT Updates
- Include role = `super_admin` in JWT payload
- Include tenantId if multi-tenant is implemented
- Ensure login flow works for super admins like regular users

4) Frontend
- Add a new **Super Admin dashboard tab**
  - Tabs: Tenants, Users, Doctors, Appointments, Reports
- Only show this UI to super_admin users
- Do NOT affect admin, doctor, or user dashboards

5) Security & Best Practices
- Super Admin can see all tenant data but normal admins cannot
- Enforce backend-only validation for all super admin actions
- Ensure audit trail or logs for critical actions if possible

==================================================
DELIVERABLES
==================================================
- Prisma role enum update with `super_admin`
- Middleware to enforce Super Admin role
- Backend APIs restricted to Super Admin
- Optional initial Super Admin user seed
- Frontend tab / dashboard placeholder for Super Admin
- Clear explanation of role hierarchy and flow

==================================================
IMPORTANT
==================================================
- Do NOT modify existing booking, appointment, or admin logic
- Maintain backward compatibility
- Keep RBAC checks modular and production-ready
- Super Admin should be fully isolated from tenant-level admins for security



21) prompt (Super Admin Dashboard with full functionality)

You are a senior full-stack architect.

I have an existing multi-tenant appointment booking system with:

- Roles: super_admin, admin, doctor, user
- Prisma ORM + PostgreSQL
- JWT authentication (includes userId, role, tenantId)
- Working dashboards for admin, doctor, and user
- Tenant isolation already implemented
- Existing business logic must NOT break

Now implement a FULLY FUNCTIONAL SUPER ADMIN DASHBOARD.

IMPORTANT:
- Do NOT break existing logic
- Do NOT modify existing admin/doctor/user dashboards
- Keep backward compatibility
- All super admin routes must be backend-protected
- Implement as production-grade SaaS architecture

==================================================
GOAL
==================================================

Super Admin should be able to:

1) View platform overview metrics
2) Manage tenants (create, update, suspend, activate)
3) View all users across tenants
4) View all appointments across tenants
5) View platform-level analytics

==================================================
SECTION 1: DASHBOARD OVERVIEW (Main Page)
==================================================

Create API:
GET /api/super-admin/dashboard

Return:
- totalTenants
- activeTenants
- suspendedTenants
- totalDoctors
- totalUsers
- totalAppointments
- totalReviews
- platformAverageRating

Use Prisma aggregation queries.

Frontend:
- KPI cards layout
- Clean grid UI (React + plain CSS)
- Loading and error states

==================================================
SECTION 2: TENANT MANAGEMENT
==================================================

Create APIs:

1) GET /api/super-admin/tenants
   - List all tenants
   - Include:
     - totalDoctors
     - totalUsers
     - totalAppointments
     - status
   - Pagination + search

2) POST /api/super-admin/tenants
   - Create new tenant
   - Auto-create default admin for that tenant

3) PATCH /api/super-admin/tenants/:id
   - Update tenant name

4) PATCH /api/super-admin/tenants/:id/status
   - Activate / Suspend tenant

Rules:
- When tenant is suspended:
    - Block login for all users except super_admin
    - Prevent new bookings

Frontend:
- Table with:
    - Tenant Name
    - Status
    - Doctors count
    - Users count
    - Appointments count
    - Actions (View / Suspend / Activate)
- Pagination + filtering

==================================================
SECTION 3: GLOBAL USER MANAGEMENT
==================================================

API:
GET /api/super-admin/users

Features:
- List all users across all tenants
- Columns:
    - Name
    - Email
    - Role
    - Tenant Name
    - Status
- Filters:
    - By role
    - By tenant
- Pagination

Optional:
PATCH /api/super-admin/users/:id/status
- Activate / deactivate user

==================================================
SECTION 4: GLOBAL APPOINTMENT MONITOR
==================================================

API:
GET /api/super-admin/appointments

Return:
- Appointment ID
- Tenant Name
- Doctor Name
- Patient Name
- Date
- Status

Filters:
- Tenant
- Date range
- Status

Pagination required.

==================================================
SECTION 5: PLATFORM ANALYTICS
==================================================

API:
GET /api/super-admin/analytics

Return:
- Appointments per month
- New users per month
- Top 5 performing tenants (by appointments)
- Top 5 rated doctors (across platform)

Use aggregation queries only.
Do NOT fetch raw large datasets unnecessarily.

==================================================
SECURITY REQUIREMENTS
==================================================

- All routes must require role === "super_admin"
- Implement middleware: requireSuperAdmin
- No tenant filtering for super_admin
- Enforce backend validation
- Never expose sensitive fields (passwords)

==================================================
FRONTEND REQUIREMENTS
==================================================

- Create new SuperAdminLayout
- Sidebar:
    Dashboard
    Tenants
    Users
    Appointments
    Analytics

- Use React + plain CSS
- Do NOT use Tailwind or UI libraries
- Reuse existing layout patterns where possible
- Implement proper loading, error, and empty states

==================================================
PERFORMANCE REQUIREMENTS
==================================================

- Use Prisma aggregation (count, groupBy, avg)
- Implement pagination properly
- Avoid N+1 query problems
- Keep queries optimized

==================================================
DELIVERABLES
==================================================

1) Updated Prisma queries for dashboard metrics
2) All Super Admin APIs
3) Middleware for super_admin authorization
4) React Super Admin layout
5) Table components with pagination
6) Clear explanation of:
   - Data flow
   - Aggregation logic
   - Security enforcement
   - How backward compatibility is preserved

==================================================
CRITICAL RULES
==================================================

- Do NOT refactor existing appointment booking logic
- Do NOT modify tenant isolation logic
- Do NOT remove any existing tables
- Implement as clean extension
- Production-ready code only
- Explain each section before writing code

This must feel like an enterprise SaaS control panel.




