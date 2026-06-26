import React from 'react';
import { Flame, Sun, Snowflake } from 'lucide-react';

export default function Badge({
  type = 'status', // 'status' | 'temperature'
  value = ''
}) {
  if (type === 'temperature') {
    const tempStyles = {
      Hot: 'bg-red-50 text-danger border border-red-200',
      Warm: 'bg-amber-50 text-accent-dark border border-amber-200',
      Cold: 'bg-blue-50 text-blue-600 border border-blue-200'
    };

    const tempIcons = {
      Hot: <Flame className="h-3.5 w-3.5 mr-1 animate-pulse" />,
      Warm: <Sun className="h-3.5 w-3.5 mr-1" />,
      Cold: <Snowflake className="h-3.5 w-3.5 mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-badge ${tempStyles[value] || 'bg-gray-100 text-gray-800'}`}>
        {tempIcons[value] || null}
        {value}
      </span>
    );
  }

  // Otherwise, default to status badges (4px border-radius)
  const statusStyles = {
    New: 'bg-blue-100 text-blue-800',
    Contacted: 'bg-amber-100 text-amber-800',
    Confirmed: 'bg-emerald-100 text-emerald-800',
    Cancelled: 'bg-red-100 text-red-800',
    Completed: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-badge leading-tight ${statusStyles[value] || 'bg-gray-100 text-gray-800'}`}>
      {value}
    </span>
  );
}
