import React from 'react';
import DoctorNav from '../Molecules/DoctorNav';

const Header = ({ title, subtitle, doctorNavProps }) => {
    return (
        <header className="calendar-header">
            <div>
                <h1>{title}</h1>
                <p className="text-secondary">{subtitle}</p>
            </div>
            <div className="doctor-section">
                <DoctorNav {...doctorNavProps} />
            </div>
        </header>
    );
};

export default Header;
