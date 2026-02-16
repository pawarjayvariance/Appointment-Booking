import React from 'react';
import Button from '../Atoms/Button';
import Input from '../Atoms/Input';
import Avatar from '../Atoms/Avatar';

const BookingModal = ({
    isOpen,
    onClose,
    title,
    summary,
    formData,
    setFormData,
    onSubmit,
    loading,
    isEditing,
    isRescheduling,
    user,
    doctor
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{title}</h2>
                <div className="appt-summary">
                    {doctor && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                            <Avatar src={doctor.user?.profilePic} name={doctor.name} size="medium" type="doctor" />
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>Dr. {doctor.name}</div>
                                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{doctor.specialization}</div>
                            </div>
                        </div>
                    )}
                    {summary}
                </div>
                <form onSubmit={(e) => onSubmit(e, 'submit')}>
                    {/* Display User Info (Editable) */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Input
                            label="Name"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Full Name"
                            required
                        />
                        <Input
                            label="Email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Email Address"
                            type="email"
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Input
                            label="Phone Number"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="123-456-7890"
                            required
                        />
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Gender *</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    fontSize: '1rem',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Input
                            label="Date of Birth"
                            type="date"
                            value={formData.dob}
                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        label="Address"
                        type="textarea"
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Your full address..."
                        required
                    />

                    <Input
                        label="Note (Optional)"
                        type="textarea"
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        placeholder="Share anything that might be helpful..."
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button type="submit" disabled={loading} style={{ flex: 1 }}>
                                {loading ? 'Processing...' : (isEditing ? 'Update Appointment' : (isRescheduling ? 'Confirm Reschedule' : 'Confirm Booking'))}
                            </Button>

                            {!isEditing && (
                                <Button variant="secondary" onClick={onClose} type="button">
                                    Cancel
                                </Button>
                            )}
                        </div>

                        {isEditing && (
                            <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                <Button
                                    variant="secondary"
                                    onClick={(e) => onSubmit(e, 'reschedule_init')}
                                    style={{ flex: 1, backgroundColor: '#f59e0b', color: 'white', border: 'none' }}
                                    type="button"
                                >
                                    Reschedule
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={(e) => onSubmit(e, 'cancel')}
                                    style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', border: 'none' }}
                                    type="button"
                                >
                                    Cancel Appt
                                </Button>
                            </div>
                        )}

                        {isEditing && (
                            <Button variant="ghost" onClick={onClose} type="button" style={{ marginTop: '0.5rem' }}>
                                Close
                            </Button>
                        )}

                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;
