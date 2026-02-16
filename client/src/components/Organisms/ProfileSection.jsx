import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../Atoms/Button';
import { User, Camera, Mail, Save, AlertCircle, CheckCircle } from 'lucide-react';
import './ProfileSection.css';

const ProfileSection = ({ onCancel }) => {
    const { user, token, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [profilePic, setProfilePic] = useState(user?.profilePhoto || '');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const formData = new FormData();
            formData.append('name', name);
            if (selectedFile) {
                formData.append('profilePicFile', selectedFile);
            } else {
                formData.append('profilePic', profilePic);
            }

            const response = await api.patch(
                '/profile',
                formData
            );

            updateUser(response.data.user);
            // If upload was successful, clear the file and file preview, let the new URL handle it
            if (selectedFile) {
                setSelectedFile(null);
                setPreviewUrl(null);
                setProfilePic(response.data.user.profilePhoto);
            }
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Failed to update profile';
            setMessage({ type: 'error', text: errorMsg });
            console.error('Profile update error:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar-wrapper">
                        {previewUrl || profilePic ? (
                            <img src={previewUrl || profilePic} alt="Profile" className="profile-avatar" />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                <User size={48} />
                            </div>
                        )}
                        <label className="avatar-edit-badge" htmlFor="profile-upload">
                            <Camera size={14} />
                            <input
                                id="profile-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                    <div className="profile-title">
                        <h2>My Profile</h2>
                        <p className="text-secondary">Manage your account information</p>
                    </div>
                </div>

                <form className="profile-form" onSubmit={handleSave}>
                    {message && (
                        <div className={`form-alert ${message.type}`}>
                            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            <span>{message.text}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email Address (Read-only)</label>
                        <div className="read-only-field">
                            <Mail size={18} />
                            <span>{user?.email}</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Profile Image URL (Alternative)</label>
                        <input
                            type="text"
                            value={profilePic}
                            onChange={(e) => {
                                setProfilePic(e.target.value);
                                if (selectedFile) {
                                    setSelectedFile(null);
                                    setPreviewUrl(null);
                                }
                            }}
                            placeholder="https://example.com/photo.jpg"
                            disabled={!!selectedFile}
                        />
                        {selectedFile && <p className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Local file selected. Clear it to use URL.</p>}
                    </div>

                    <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : <><Save size={18} style={{ marginRight: '8px' }} /> Update Profile</>}
                        </Button>
                        {onCancel && (
                            <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileSection;
