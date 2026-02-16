import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false, style = {} }) => {
    const baseClass = 'btn';
    const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : 'btn-secondary';

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseClass} ${variantClass} ${className}`}
            disabled={disabled}
            style={style}
        >
            {children}
        </button>
    );
};

export default Button;
