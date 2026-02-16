import React from 'react';

const Input = ({ label, type = 'text', value, onChange, placeholder, required = false, rows }) => {
    return (
        <div className="form-group">
            {label && <label>{label}</label>}
            {type === 'textarea' ? (
                <textarea
                    rows={rows || 3}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                />
            )}
        </div>
    );
};

export default Input;
