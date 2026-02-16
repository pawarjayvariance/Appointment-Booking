import React, { useState, useMemo } from 'react';
import axios from 'axios';
import Button from '../Atoms/Button';
import Input from '../Atoms/Input';
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * RegisterForm - A fully interactive React component for user registration.
 * Features: Password strength feedback, real-time validation, loading indicators.
 */
const RegisterForm = ({ onToggleMode, onSuccess }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Real-time validation logic
    const validations = useMemo(() => ({
        name: name.length >= 2,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        password: password.length >= 6
    }), [name, email, password]);

    // Password strength indicator
    const passwordStrength = useMemo(() => {
        if (password.length === 0) return 0;
        let score = 0;
        if (password.length >= 6) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        return score;
    }, [password]);

    const isFormValid = validations.name && validations.email && validations.password;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);
        setError('');
        try {
            await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
            onSuccess(); // Triggers redirect to login with success message
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card" role="main" aria-labelledby="register-title">
            <div className="auth-header">
                <h2 id="register-title">Get Started</h2>
                <p className="auth-subtitle">Create a secure account to manage your bookings.</p>
            </div>

            {error && (
                <div className="auth-error-alert" role="alert">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
                <div className="input-group">
                    <Input
                        label="Full Name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        aria-invalid={name.length > 0 && !validations.name}
                    />
                    {name.length > 0 && !validations.name && (
                        <span className="field-error">Name must be at least 2 characters.</span>
                    )}
                </div>

                <div className="input-group">
                    <Input
                        label="Email Address"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        aria-invalid={email.length > 0 && !validations.email}
                    />
                    {email.length > 0 && !validations.email && (
                        <span className="field-error">Please enter a valid business email.</span>
                    )}
                </div>

                <div className="input-group password-group">
                    <Input
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        aria-invalid={password.length > 0 && !validations.password}
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>

                    {password.length > 0 && (
                        <div className="password-strength-meter">
                            <div
                                className={`strength-bar level-${passwordStrength}`}
                                style={{ width: `${(passwordStrength / 4) * 100}%` }}
                            ></div>
                            <span className="strength-text">
                                {passwordStrength < 2 ? 'Weak' : passwordStrength < 4 ? 'Medium' : 'Strong'}
                            </span>
                        </div>
                    )}
                    {password.length > 0 && !validations.password && (
                        <span className="field-error">Password must be at least 6 characters.</span>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={loading || !isFormValid}
                    style={{ width: '100%', marginTop: '1.5rem' }}
                >
                    {loading ? (
                        <span className="spinner-container">
                            <span className="spinner"></span> Joining...
                        </span>
                    ) : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <UserPlus size={18} /> Create Account
                        </span>
                    )}
                </Button>
            </form>

            <div className="auth-footer">
                <p>
                    Already have an account?
                    <button onClick={onToggleMode} className="auth-link-btn" type="button">
                        Sign In instead
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm;
