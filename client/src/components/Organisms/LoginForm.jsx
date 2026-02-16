import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Button from '../Atoms/Button';
import Input from '../Atoms/Input';
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * LoginForm - A fully interactive React component for user authentication.
 * Features: Real-time validation, loading states, show/hide password, and accessibility.
 */

const LoginForm = ({ onToggleMode, successMessage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    // Real-time validation
    const validations = useMemo(() => ({
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        password: password.length > 0
    }), [email, password]);

    const isFormValid = validations.email && validations.password;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            login(res.data.user, res.data.token, res.data.doctor);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card" role="main" aria-labelledby="login-title">
            <div className="auth-header">
                <h2 id="login-title">Sign In</h2>
                <p className="auth-subtitle">Welcome back! Please enter your details.</p>
            </div>

            {successMessage && (
                <div className="auth-success-alert" role="alert">
                    <CheckCircle size={18} /> {successMessage}
                </div>
            )}

            {error && (
                <div className="auth-error-alert" role="alert">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
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
                        <span className="field-error">Please enter a valid email.</span>
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
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>

                <Button
                    type="submit"
                    disabled={loading || !isFormValid}
                    style={{ width: '100%', marginTop: '1.5rem' }}
                >
                    {loading ? (
                        <span className="spinner-container">
                            <span className="spinner"></span> Authenticating...
                        </span>
                    ) : (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <LogIn size={18} /> Sign In
                        </span>
                    )}
                </Button>
            </form>

            <div className="auth-footer">
                <p>
                    Don't have an account?
                    <button onClick={onToggleMode} className="auth-link-btn" type="button">
                        Create one for free
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
