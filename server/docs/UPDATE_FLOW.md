# Appointment Update & Reschedule Flow

This update adds the ability for users to edit and reschedule appointments directly from the booking interface.

## New Endpoints

### 1. Get Appointment by Slot
- **URL**: `/api/appointments/by-slot/:timeSlotId`
- **Method**: `GET`
- **Description**: Returns the appointment details (name, email, note) for a booked slot.

### 2. Update Appointment
- **URL**: `/api/appointments/:appointmentId`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "name": "Updated Name",
    "email": "updated@email.com",
    "note": "Updated note",
    "timeSlotId": "new-timeslot-uuid" (optional for rescheduling)
  }
  ```
- **Description**: Updates appointment details and handles rescheduling. Rescheduling uses a database transaction to release the old slot and book the new one atomically.

## How to Update/Reschedule

1. **Click a Booked Slot**: Booked slots (dashed border) are now clickable.
2. **Fetch Data**: The app fetches existing appointment details for that slot.
3. **Edit Details**: A modal opens allowing you to edit Name, Email, and Note.
4. **Reschedule**: 
   - While the edit state is active, select a different **available** slot from the grid.
   - The UI will highlight the new selection.
   - Click "Update Info" to confirm.
5. **Real-time Flow**: 
   - The old slot is released and becomes available for others.
   - The new slot is booked immediately.
   - All other connected users see the changes instantly via WebSockets.

## Safety Measures
- **Redis Locking**: Prevents race conditions during rescheduling.
- **Transactions**: Ensures data consistency; if the new slot becomes taken during the update, the entire operation is rolled back.
