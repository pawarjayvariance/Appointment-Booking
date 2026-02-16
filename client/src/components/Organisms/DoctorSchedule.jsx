import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, Clock, Save, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import Button from '../Atoms/Button';
import './DoctorSchedule.css';

const DoctorSchedule = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);
    const [doctorSettings, setDoctorSettings] = useState({
        workingStart: '09:00',
        workingEnd: '17:00',
        slotDuration: 30
    });
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const token = localStorage.getItem('token');

    // Fetch schedule and doctor settings
    const fetchSchedule = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await axios.get(
                `http://localhost:5000/api/doctor/schedule?date=${selectedDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSlots(res.data.slots);
            setDoctorSettings({
                workingStart: res.data.doctor.workingStart,
                workingEnd: res.data.doctor.workingEnd,
                slotDuration: res.data.doctor.slotDuration
            });
            setSelectedSlots([]);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to fetch schedule' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [selectedDate]);

    // Update Hours & Duration
    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await axios.patch(
                'http://localhost:5000/api/doctor/schedule/update-hours',
                doctorSettings,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage({ type: 'success', text: 'Working hours updated and future slots regenerated!' });
            fetchSchedule(); // Refresh current view
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Update failed' });
        } finally {
            setSaving(false);
        }
    };

    // Disable Selected Slots
    const handleDisableSlots = async () => {
        if (selectedSlots.length === 0) return;
        setSaving(true);
        try {
            await axios.post(
                'http://localhost:5000/api/doctor/schedule/disable-slots',
                { slotIds: selectedSlots },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage({ type: 'success', text: `${selectedSlots.length} slots marked as unavailable.` });
            fetchSchedule();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to disable slots' });
        } finally {
            setSaving(false);
        }
    };

    // Enable Selected Slots
    const handleEnableSlots = async () => {
        if (selectedSlots.length === 0) return;
        setSaving(true);
        try {
            await axios.post(
                'http://localhost:5000/api/doctor/schedule/enable-slots',
                { slotIds: selectedSlots },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage({ type: 'success', text: `${selectedSlots.length} slots marked as available.` });
            fetchSchedule();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to enable slots' });
        } finally {
            setSaving(false);
        }
    };

    const toggleSlotSelection = (slotId, isBooked, hasAppointment) => {
        if (hasAppointment) return; // Cannot select booked slots

        setSelectedSlots(prev =>
            prev.includes(slotId)
                ? prev.filter(id => id !== slotId)
                : [...prev, slotId]
        );
    };

    const formatTime = (timeStr) => {
        const date = new Date(timeStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="doctor-schedule-container">
            <div className="schedule-header">
                <h2>Manage Availability</h2>
                <div className="date-selector">
                    <CalendarIcon size={18} />
                    <input
                        type="date"
                        className="setting-input"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

            {message.text && (
                <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
                    {message.type === 'error' ? <ShieldAlert size={18} /> : <CheckCircle size={18} />}
                    {message.text}
                </div>
            )}

            <form className="settings-panel" onSubmit={handleUpdateSettings}>
                <div className="setting-item">
                    <label>Working Start</label>
                    <input
                        type="time"
                        className="setting-input"
                        value={doctorSettings.workingStart}
                        onChange={(e) => setDoctorSettings({ ...doctorSettings, workingStart: e.target.value })}
                    />
                </div>
                <div className="setting-item">
                    <label>Working End</label>
                    <input
                        type="time"
                        className="setting-input"
                        value={doctorSettings.workingEnd}
                        onChange={(e) => setDoctorSettings({ ...doctorSettings, workingEnd: e.target.value })}
                    />
                </div>
                <div className="setting-item">
                    <label>Slot Duration (min)</label>
                    <input
                        type="number"
                        className="setting-input"
                        value={doctorSettings.slotDuration}
                        onChange={(e) => setDoctorSettings({ ...doctorSettings, slotDuration: e.target.value })}
                    />
                </div>
                <div className="setting-item" style={{ justifyContent: 'flex-end' }}>
                    <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="spinning" size={16} /> : <Save size={16} />} Update Hours
                    </Button>
                </div>
            </form>

            <div className="slots-section">
                <div className="slots-header">
                    <h3>Time Slots for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
                    <div className="status-indicator">
                        <div className="status-item"><span className="dot free"></span> Free</div>
                        <div className="status-item"><span className="dot booked"></span> Booked</div>
                        <div className="status-item"><span className="dot disabled"></span> Doctor not available</div>
                        <div className="status-item"><span className="dot selected"></span> Selected</div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-overlay">Loading slots...</div>
                ) : (
                    <div className="slots-grid">
                        {slots.map(slot => {
                            const isSelected = selectedSlots.includes(slot.id);
                            const hasAppointment = !!slot.appointment;
                            const isDisabled = slot.isBooked && !hasAppointment;

                            let cardClass = "slot-card";
                            if (hasAppointment) cardClass += " booked";
                            else if (isDisabled) cardClass += " disabled-slot";
                            else if (isSelected) cardClass += " selected";

                            return (
                                <div
                                    key={slot.id}
                                    className={cardClass}
                                    onClick={() => toggleSlotSelection(slot.id, slot.isBooked, hasAppointment)}
                                >
                                    <span className="slot-time">{formatTime(slot.startTime)}</span>
                                    {isSelected && <CheckCircle className="slot-checkbox" size={14} color="#3b82f6" fill="#ebf5ff" />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="actions-footer">
                <Button
                    variant="secondary"
                    disabled={selectedSlots.length === 0 || saving}
                    onClick={handleEnableSlots}
                >
                    <CheckCircle size={16} /> Enable Selection
                </Button>
                <Button
                    variant="danger"
                    disabled={selectedSlots.length === 0 || saving}
                    onClick={handleDisableSlots}
                >
                    <ShieldAlert size={16} /> Disable Selection (Doctor not available)
                </Button>
            </div>
        </div>
    );
};

export default DoctorSchedule;
