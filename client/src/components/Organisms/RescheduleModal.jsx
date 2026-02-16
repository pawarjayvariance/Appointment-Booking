import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import { format, addDays } from 'date-fns';
import { toZonedTime, format as formatTZ } from 'date-fns-tz';
import { Calendar, Clock, X } from 'lucide-react';
import Button from '../Atoms/Button';
import "react-datepicker/dist/react-datepicker.css";

const RescheduleModal = ({
    isOpen,
    onClose,
    appointment,
    api,
    userTimezone,
    onSuccess
}) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [error, setError] = useState(null);

    const fetchSlots = useCallback(async (date) => {
        setLoading(true);
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const res = await api.get(`/doctors/${appointment.doctorId}/slots?date=${dateStr}`);
            setSlots(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch slots');
        } finally {
            setLoading(false);
        }
    }, [api, appointment?.doctorId]);

    useEffect(() => {
        if (isOpen && appointment) {
            setSelectedDate(new Date(appointment.timeSlot.date));
            setSelectedSlotId(appointment.timeSlotId);
            fetchSlots(new Date(appointment.timeSlot.date));
        }
    }, [isOpen, appointment, fetchSlots]);

    if (!isOpen || !appointment) return null;

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedSlotId(null);
        fetchSlots(date);
    };

    const handleReschedule = async () => {
        if (!selectedSlotId) return;
        setLoading(true);
        try {
            await api.patch(`/appointments/${appointment.id}/reschedule`, {
                newTimeSlotId: selectedSlotId
            });
            onSuccess('Appointment rescheduled successfully!');
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Reschedule failed');
        } finally {
            setLoading(false);
        }
    };

    const formatSlotTime = (startTime) => {
        const zonedDate = toZonedTime(new Date(startTime), userTimezone);
        return formatTZ(zonedDate, 'p', { timeZone: userTimezone });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content reschedule-modal">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Reschedule Appointment</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                        <X size={24} />
                    </button>
                </div>

                <div className="reschedule-layout">
                    <div className="calendar-section">
                        <h3 className="section-title"><Calendar size={18} /> Select New Date</h3>
                        <DatePicker
                            selected={selectedDate}
                            onChange={handleDateChange}
                            minDate={new Date()}
                            maxDate={addDays(new Date(), 15)}
                            inline
                        />
                    </div>

                    <div className="slots-section">
                        <h3 className="section-title"><Clock size={18} /> Available Times ({userTimezone})</h3>
                        {loading && <p>Loading slots...</p>}
                        {error && <p style={{ color: '#ef4444' }}>{error}</p>}
                        {!loading && slots.length === 0 && <p className="empty-text">No slots available for this date.</p>}

                        <div className="reschedule-slot-grid">
                            {slots.map((slot) => {
                                const isCurrentSlot = slot.id === appointment.timeSlotId;
                                const isSelected = selectedSlotId === slot.id;

                                return (
                                    <button
                                        key={slot.id}
                                        className={`reschedule-slot-card ${isSelected ? 'selected' : ''} ${slot.isBooked && !isCurrentSlot ? 'disabled' : ''}`}
                                        disabled={slot.isBooked && !isCurrentSlot}
                                        onClick={() => setSelectedSlotId(slot.id)}
                                    >
                                        {formatSlotTime(slot.startTime)}
                                        {isCurrentSlot && <span className="current-badge">Current</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {error && <div className="error-message" style={{ marginTop: '1rem', color: '#ef4444' }}>{error}</div>}

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <Button
                        onClick={handleReschedule}
                        disabled={loading || !selectedSlotId || selectedSlotId === appointment.timeSlotId}
                        style={{ flex: 1 }}
                    >
                        {loading ? 'Rescheduling...' : 'Confirm New Time'}
                    </Button>
                    <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RescheduleModal;
