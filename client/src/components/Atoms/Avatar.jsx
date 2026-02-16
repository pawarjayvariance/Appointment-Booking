import React from 'react';
import { User, Users as UsersIcon } from 'lucide-react';
import { getProfilePicUrl } from '../../utils/imageUtils';

const Avatar = ({ src, name, size = 'small', type = 'user', style = {} }) => {
    const dimensions = size === 'large' ? '150px' : size === 'medium' ? '45px' : '32px';
    const iconSize = size === 'large' ? 64 : size === 'medium' ? 22 : 16;

    const containerStyle = {
        width: dimensions,
        height: dimensions,
        minWidth: dimensions,
        borderRadius: '50%',
        backgroundColor: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        ...style
    };

    const imageUrl = getProfilePicUrl(src);

    if (imageUrl) {
        return (
            <div style={containerStyle} className="avatar-container">
                <img
                    src={imageUrl}
                    alt={name || 'User'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>
        );
    }

    const Icon = type === 'doctor' ? UsersIcon : User;

    return (
        <div style={containerStyle} className="avatar-placeholder">
            <Icon size={iconSize} color="#94a3b8" />
        </div>
    );
};

export default Avatar;
