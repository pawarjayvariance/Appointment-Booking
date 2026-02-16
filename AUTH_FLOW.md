# Authentication Flow

This system uses **JWT (JSON Web Token)** for secure user authentication and session management.

## Flow Overview

1.  **Registration**: 
    - Frontend sends `name`, `email`, and `password` to `POST /api/auth/register`.
    - Backend hashes the password using `bcryptjs` and stores the user in the database.
    - A JWT is generated and returned to the client along with user details.

2.  **Login**:
    - Frontend sends `email` and `password` to `POST /api/auth/login`.
    - Backend compares the provided password with the stored hash.
    - If valid, a new JWT is returned.

3.  **Persistence**:
    - The `AuthContext` on the frontend stores the token and user data in `localStorage`.
    - On page refresh, the context initializes from `localStorage` to maintain the session.

4.  **Authorization**:
    - Every API request from the `BookingPage` includes the `Authorization: Bearer <token>` header.
    - The `authMiddleware` on the backend validates the token for protected routes (`POST /bookings`, `PUT /appointments`).

5.  **Logout**:
    - `localStorage` is cleared, and the application state resets to unauthenticated.

## Implementation Details

- **Hashing**: Bcrypt with 10 salt rounds.
- **Tokens**: Signed with a 24-hour expiration time.
- **Frontend Guard**: `AppContent` component conditionally renders the auth forms or the booking interface based on `isAuthenticated` state.
