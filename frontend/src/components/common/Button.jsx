import React from 'react';
import Spinner from './Spinner';

export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'accent' | 'danger' | 'outline' | 'secondary'
  size = 'md',        // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  // Variant CSS mapping
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-light focus:ring-primary',
    accent: 'bg-accent text-textMain hover:bg-accent-light focus:ring-accent',
    danger: 'bg-danger text-white hover:bg-red-600 focus:ring-danger',
    outline: 'border border-borderGray text-primary hover:bg-surfaceBg focus:ring-primary',
    secondary: 'bg-textMuted/10 text-textMain hover:bg-textMuted/20 focus:ring-textMuted'
  };

  // Size CSS mapping
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded',
    md: 'px-4 py-2 text-sm font-semibold rounded-input',
    lg: 'px-6 py-3 text-base font-semibold rounded-card'
  };

  const baseStyles = 'inline-flex items-center justify-center font-sans tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading && <Spinner className="mr-2 h-4 w-4 text-current" />}
      {children}
    </button>
  );
}
