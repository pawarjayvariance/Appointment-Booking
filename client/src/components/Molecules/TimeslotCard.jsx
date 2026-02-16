import React from 'react';
import { Edit2 } from 'lucide-react';

const TimeslotCard = ({ slot, isSelected, isEditing, onClick, formatTime, showDoctor = false }) => {
    const isBooked = slot.isBooked;
    const isMine = !!slot.myAppointment;

    // Use different class if it's mine
    const cardClass = `slot-card ${isBooked ? (isMine ? 'booked-mine' : 'booked') : ''} ${isSelected ? 'selected' : ''} ${isEditing ? 'current-slot' : ''}`;

    return (
        <div className={cardClass} onClick={onClick}>
            <div className="slot-time">{formatTime(slot.startTime)}</div>
            <div className="slot-meta">
                {isMine ? (
                    <p style={{ color: "blue", margin: "4px 0", fontWeight: 'bold' }}>My Appointment</p>
                ) : isBooked ? (
                    slot.appointment ? (
                        <p style={{ color: "red", margin: "4px 0" }}>Not Available</p>
                    ) : (
                        <p style={{ color: "red", margin: "4px 0", fontWeight: 'bold' }}>Doctor not available</p>
                    )
                ) : (
                    <p style={{ color: "green", margin: "4px 0" }}>Available</p>
                )}

                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    {slot.zonedDate.getHours() < 12 ? 'AM' : 'PM'}
                    {showDoctor && slot.doctor && ` • ${slot.doctor.name}`}
                </span>
            </div>
            {isMine && <Edit2 size={12} className="edit-icon" />}
        </div>
    );
};

export default TimeslotCard;
