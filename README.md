# Appointment Booking App Documentation

## Setup Instructions

### Prerequisites
- Node.js & npm
- PostgreSQL
- Redis

### Backend Setup
1. Navigate to `/server`: `cd server`
2. Install dependencies: `npm install`
3. Configure environment: Create a `.env` file based on `.env.example`.
4. Run Prisma migrations: `npx prisma migrate dev --name init`
5. Seed the database: `npm run seed`
6. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to `/client`: `cd client`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

## Key Architectural Decisions

### 1. Concurrency Handling (Redis + Prisma)
To prevent double bookings, we use a two-layered approach:
- **Redis Distributed Lock**: Before creating a booking, we attempt to set a lock in Redis for the specific `slotId`. If another request is currently processing this slot, the lock will fail, preventing race conditions.
- **Prisma Transactions**: We use database-level transactions to ensure that the slot availability check and the appointment creation happen atomically.

### 2. Real-time Updates (Socket.io)
When a slot is successfully booked, the server emits a `slotUpdated` event to all connected clients. The frontend listens for this event and updates its local state instantly, disabling the booked slot without requiring a page refresh.

### 3. Database Schema
- **Doctor**: Stores basic info and timezone.
- **TimeSlot**: Pre-generated slots for specific dates. This simplifies availability queries.
- **Appointment**: Stores the link between a user and a time slot.

### 4. Timezone Management
The frontend uses `date-fns` for date manipulation and `luxon` (optional but recommended for complex TZ logic) to handle user-facing dates. All dates are stored in UTC in the database for consistency.

### 5. Multi-Tenant SaaS
this project is also work as SaaS 



### env file 
DATABASE_URL="postgresql://postgres:root@localhost:5432/booking_db?schema=public"
REDIS_URL="redis://localhost:6379"
PORT=5000
JWT_SECRET=58a570b78c15424d3eef6bb3e3767eae552e8e350c7f6f2ff251eb35cd43a03a13a929e291932becf52fb424fa7c57dd3760dc653eeb1efa0bd98f5f21686c08








 