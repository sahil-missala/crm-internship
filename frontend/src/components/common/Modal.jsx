import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export default function Modal({
  isOpen = false,
  onClose,
  title = '',
  children,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  className = ''
}) {
  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-card shadow-xl border border-borderGray flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 z-10 ${className}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-borderGray">
          <h3 className="text-base font-bold text-textMain leading-none tracking-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-textMuted hover:text-textMain transition-colors focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
