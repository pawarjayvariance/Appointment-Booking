import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { toZonedTime, format as formatTZ } from 'date-fns-tz';
import DatePicker from 'react-datepicker';
import { Calendar as CalendarIcon, Clock, CheckCircle, Globe, Users } from 'lucide-react';

import Header from '../components/Organisms/Header';
import BookingModal from '../components/Organisms/BookingModal';
import RescheduleModal from '../components/Organisms/RescheduleModal';
import TimeslotCard from '../components/Molecules/TimeslotCard';
import TimezoneSelect from '../components/Atoms/TimezoneSelect';
import DoctorNav from '../components/Molecules/DoctorNav';
import Button from '../components/Atoms/Button';

import "react-datepicker/dist/react-datepicker.css";
import "../styles/App.css";
import { useAuth } from '../context/AuthContext';

const socket = io('http://localhost:5000');

const BookingPage = () => {
    const [doctors, setDoctors] = useState([]);
    const [currentDoctorIndex, setCurrentDoctorIndex] = useState(0); // -1 for "All Doctors"
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [slots, setSlots] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bookingSlot, setBookingSlot] = useState(null);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [reschedulingAppointment, setReschedulingAppointment] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        note: '',
        phone: '',
        gender: '',
        dob: '',
        address: ''
    });
    const [success, setSuccess] = useState(null);
    const { user, token, logout } = useAuth();

    const selectedDoctor = useMemo(() => {
        return doctors.length > 0 && currentDoctorIndex !== -1 ? doctors[currentDoctorIndex] : null;
    }, [doctors, currentDoctorIndex]);

    const fetchMyAppointments = useCallback(async () => {
        try {
            const res = await api.get('/my-appointments');
            setMyAppointments(res.data);
        } catch (error) {
            console.error('Failed to fetch my appointments');
        }
    }, [api]);

    const sortedSlots = useMemo(() => {
        const zonedSlots = slots.map(slot => {
            const zonedDate = toZonedTime(new Date(slot.startTime), userTimezone);
            // Check if this slot belongs to the user
            const myAppt = myAppointments.find(appt => appt.timeSlotId === slot.id);
            return { ...slot, zonedDate, myAppointment: myAppt };
        });

        const amSlots = zonedSlots.filter(s => s.zonedDate.getHours() < 12);
        const pmSlots = zonedSlots.filter(s => s.zonedDate.getHours() >= 12);

        amSlots.sort((a, b) => a.zonedDate - b.zonedDate);
        pmSlots.sort((a, b) => a.zonedDate - b.zonedDate);

        return [...amSlots, ...pmSlots];
    }, [slots, userTimezone, myAppointments]);

    const fetchSlots = useCallback(async () => {
        setLoading(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const url = selectedDoctor
                ? `/doctors/${selectedDoctor.id}/slots?date=${dateStr}`
                : `/slots?date=${dateStr}`;

            const res = await api.get(url);
            setSlots(res.data);
        } catch (err) {
            console.error('Error fetching slots:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedDoctor?.id, selectedDate, api]);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await api.get('/doctors');
                setDoctors(res.data);
            } catch (err) {
                console.error('Error fetching doctors:', err);
            }
        };
        fetchDoctors();
        fetchMyAppointments();
    }, [api, fetchMyAppointments]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    useEffect(() => {
        const handleSlotUpdate = ({ timeSlotId, isBooked }) => {
            setSlots(prevSlots =>
                prevSlots.map(slot =>
                    slot.id === timeSlotId ? { ...slot, isBooked } : slot
                )
            );
            fetchMyAppointments();
        };

        const handleApptUpdate = () => {
            fetchSlots();
            fetchMyAppointments();
        };

        const handleRescheduled = ({ appointmentId, appointment }) => {
            setMyAppointments(prev => prev.map(a => a.id === appointmentId ? appointment : a));
            fetchSlots();
        };

        socket.on('slotUpdated', handleSlotUpdate);
        socket.on('slot:updated', handleSlotUpdate);
        socket.on('appointmentUpdated', handleApptUpdate);
        socket.on('appointment:rescheduled', handleRescheduled);
        socket.on('appointmentCanceled', handleApptUpdate);

        return () => {
            socket.off('slotUpdated', handleSlotUpdate);
            socket.off('slot:updated', handleSlotUpdate);
            socket.off('appointmentUpdated', handleApptUpdate);
            socket.off('appointment:rescheduled', handleRescheduled);
            socket.off('appointmentCanceled', handleApptUpdate);
        };
    }, [fetchSlots, fetchMyAppointments]);
    const handleEditClick = (appointment) => {
        setEditingAppointment(appointment);
        setFormData({
            name: appointment.name || '',
            email: appointment.email || '',
            note: appointment.note || '',
            phone: appointment.additionalInfo?.phone || '',
            gender: appointment.additionalInfo?.gender || '',
            dob: appointment.additionalInfo?.dob ? appointment.additionalInfo.dob.split('T')[0] : '', // Extract YYYY-MM-DD
            address: appointment.additionalInfo?.address || ''
        });
    };

    const handleAction = async (e, actionType = 'submit') => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            if (actionType === 'cancel' && editingAppointment) {

                if (!window.confirm("Are you sure you want to cancel this appointment?")) {
                    setLoading(false);
                    return;
                }
                await api.delete(`/appointments/${editingAppointment.id}`);
                setSuccess('Appointment canceled successfully!');
                setEditingAppointment(null);
            }
            else if (actionType === 'reschedule_init' && editingAppointment) {
                setReschedulingAppointment(editingAppointment);
                setEditingAppointment(null);
                setLoading(false);
                return;
            }
            else if (reschedulingAppointment && bookingSlot) {
                await api.patch(`/appointments/${reschedulingAppointment.id}/reschedule`, {
                    newTimeSlotId: bookingSlot.id
                });
                setSuccess('Appointment rescheduled successfully!');
                setReschedulingAppointment(null);
                setBookingSlot(null);
            }
            else if (editingAppointment) {
                // Update full appointment details
                // Note: We are currently NOT updating name/email here as the backend updateAppointment 
                // doesn't support it yet, and changing identity on edit might be sensitive.
                // We send what we can.
                await api.put(`/appointments/${editingAppointment.id}`, {
                    note: formData.note,
                    phone: formData.phone,
                    gender: formData.gender,
                    dob: formData.dob,
                    address: formData.address
                });
                setSuccess('Appointment details updated successfully!');
                setEditingAppointment(null);
            } else {
                // New Booking
                await api.post('/bookings', {
                    doctorId: selectedDoctor.id,
                    timeSlotId: bookingSlot.id,
                    name: formData.name,
                    email: formData.email,
                    note: formData.note,
                    phone: formData.phone,
                    gender: formData.gender,
                    dob: formData.dob,
                    address: formData.address
                });
                setSuccess('Appointment booked successfully!');
                setBookingSlot(null);
            }

            setFormData({ name: '', email: '', note: '', phone: '', gender: '', dob: '', address: '' });
            fetchSlots();
            fetchMyAppointments();
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            alert(err.response?.data?.error || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const formatSlotTime = (startTime) => {
        const zonedDate = toZonedTime(new Date(startTime), userTimezone);
        return formatTZ(zonedDate, 'p', { timeZone: userTimezone });
    };

    const doctorNavProps = {
        selectedDoctor,
        hasDoctors: doctors.length > 0,
        isAllDoctors: currentDoctorIndex === -1,
        onPrev: () => setCurrentDoctorIndex((prev) => (prev - 1 + doctors.length) % doctors.length),
        onNext: () => currentDoctorIndex === -1 ? setCurrentDoctorIndex(0) : setCurrentDoctorIndex((prev) => (prev + 1) % doctors.length),
        onSwitchToAll: () => setCurrentDoctorIndex(-1)
    };

    return (
        <div className="booking-page-content">
            <section className="doctor-selection-header">
                {/* <h3 className="section-title">
                    <Users size={20} /> Select Provider
                </h3> */}
                <DoctorNav {...doctorNavProps} />
            </section>

            <div className="main-content">
                <section className="selection-group">
                    <h3 className="section-title">
                        <CalendarIcon size={20} /> Select Date
                    </h3>
                    <div className="custom-datepicker-wrapper">
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date) => {
                                setSelectedDate(date);
                                // Reset all state when date changes to avoid stale selections
                                setEditingAppointment(null);
                                setBookingSlot(null);
                                setFormData({ note: '', phone: '', gender: '', dob: '', address: '' });
                            }}
                            minDate={new Date()}
                            inline
                        />
                    </div>
                </section>

                <section className="selection-group">
                    <h3 className="section-title">
                        <Globe size={20} /> Your Timezone
                    </h3>
                    <TimezoneSelect value={userTimezone} onChange={setUserTimezone} />

                    <h3 className="section-title">
                        <Clock size={20} /> {editingAppointment ? 'Select New Time' : 'Available Slots'}
                    </h3>

                    {loading && <p className="loading-text">Loading slots...</p>}
                    {!loading && sortedSlots.length === 0 && <p className="empty-text">No slots available for this date.</p>}

                    <div className="slot-grid">
                        {sortedSlots.map((slot) => (
                            <TimeslotCard
                                key={slot.id}
                                slot={slot}
                                isSelected={bookingSlot?.id === slot.id}
                                isEditing={editingAppointment?.timeSlotId === slot.id}
                                formatTime={formatSlotTime}
                                showDoctor={currentDoctorIndex === -1}
                                onClick={() => {
                                    if (slot.myAppointment) {
                                        handleEditClick(slot.myAppointment);
                                    } else if (slot.isBooked) {
                                        // Slot booked by someone else - do nothing
                                    } else {
                                        // Switching to available slot
                                        if (!editingAppointment) {
                                            // Case: Fresh booking (not a reschedule)
                                            // Reset form and Pre-fill user info
                                            setFormData({
                                                name: user?.name || '',
                                                email: user?.email || '',
                                                note: '',
                                                phone: '',
                                                gender: '',
                                                dob: '',
                                                address: ''
                                            });
                                        }
                                        // If editingAppointment is truthy, we are in rescheduling mode, 
                                        // so we keep the formData but update the target bookingSlot.
                                        setBookingSlot(slot);
                                    }
                                }}
                            />
                        ))}
                    </div>

                    {editingAppointment && (
                        <Button variant="ghost" onClick={() => {
                            // Explicit cancel: clean up everything
                            setEditingAppointment(null);
                            setBookingSlot(null);
                            setFormData({ note: '', phone: '', gender: '', dob: '', address: '' });
                        }}>
                            Cancel Rescheduling
                        </Button>
                    )}
                </section>
            </div>

            {success && (
                <div className="alert-success">
                    <CheckCircle size={20} /> {success}
                </div>
            )}

            <BookingModal
                isOpen={!!bookingSlot || !!editingAppointment}
                onClose={() => {
                    setBookingSlot(null);
                    setEditingAppointment(null);
                    setReschedulingAppointment(null); // Clear reschedule state too
                    setFormData({ note: '', phone: '', gender: '', dob: '', address: '' });
                }}
                isEditing={!!editingAppointment}
                isRescheduling={!!reschedulingAppointment}
                title={reschedulingAppointment ? 'Confirm Reschedule' : (editingAppointment ? 'Update Appointment' : 'Complete Booking')}
                loading={loading}
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleAction}
                user={user}
                doctor={editingAppointment?.doctor || bookingSlot?.doctor || selectedDoctor}
                summary={
                    <>
                        <p><strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM d')}</p>
                        {/* <p><strong>Time:</strong> {formatSlotTime(bookingSlot ? bookingSlot.startTime : editingAppointment.timeSlot.startTime)} ({userTimezone})</p> */}
                        {editingAppointment && bookingSlot && (
                            <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Rescheduling to {formatSlotTime(bookingSlot.startTime)}</p>
                        )}
                    </>
                }
            />
            <RescheduleModal
                isOpen={!!reschedulingAppointment}
                onClose={() => setReschedulingAppointment(null)}
                appointment={reschedulingAppointment}
                api={api}
                userTimezone={userTimezone}
                onSuccess={(msg) => {
                    setSuccess(msg);
                    fetchMyAppointments();
                    fetchSlots();
                    setTimeout(() => setSuccess(null), 5000);
                }}
            />

            {bookingSlot && <BookingModal slot={bookingSlot} onClose={() => setBookingSlot(null)} onAction={handleAction} />}
        </div>
    );
};

export default BookingPage;
