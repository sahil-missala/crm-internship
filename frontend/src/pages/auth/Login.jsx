import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { ShieldAlert, Compass } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect directly to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surfaceBg px-4 font-sans select-none">
      <div className="w-full max-w-[400px] bg-white rounded-card shadow-card border border-borderGray p-8">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-12 w-12 rounded-full bg-primary/5 text-primary flex items-center justify-center mb-3 border border-primary/10">
            <Compass className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-base font-bold tracking-tight text-primary uppercase">
            Manivtha Tours & Travels
          </h1>
          <p className="text-[11px] font-semibold text-textMuted tracking-[0.08em] uppercase mt-1">
            Staff CRM Portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-danger text-xs font-semibold rounded border border-red-200 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@manivtha.com"
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <p className="text-[10px] text-center text-textMuted/60 mt-8">
          Authorized personnel only. Contact system administrator for account registration.
        </p>

      </div>
    </div>
  );
}
