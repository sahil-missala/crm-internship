import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function EmptyState({
  icon: Icon = AlertCircle,
  title = 'No records found',
  message = 'Try modifying your search or filter settings.',
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-borderGray rounded-card bg-white shadow-subtle ${className}`}>
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-50 text-textMuted/60 mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-textMain mb-1">
        {title}
      </h3>
      <p className="text-xs text-textMuted max-w-xs leading-relaxed">
        {message}
      </p>
    </div>
  );
}
