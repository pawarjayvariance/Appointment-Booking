import React from 'react';

const COMMON_TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Kolkata', 'Asia/Sydney'
];

const TimezoneSelect = ({ value, onChange }) => {
    return (
        <select
            className="timezone-select"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {!COMMON_TIMEZONES.includes(value) && (
                <option value={value}>{value} (Auto)</option>
            )}
            {COMMON_TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
            ))}
        </select>
    );
};

export default TimezoneSelect;
