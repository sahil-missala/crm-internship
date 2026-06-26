import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar } from 'lucide-react';

export default function Navbar({ title = 'Dashboard' }) {
  const { user } = useAuth();
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const todayStr = new Date().toLocaleDateString('en-US', options);

  return (
    <header className="h-16 bg-white border-b border-borderGray flex items-center justify-between px-8 fixed top-0 right-0 left-[240px] z-10 no-print">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-bold text-textMain tracking-tight">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Calendar Date Display */}
        <div className="flex items-center gap-2 text-xs font-semibold text-textMuted bg-slate-50 px-3 py-1.5 rounded-input border border-borderGray">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{todayStr}</span>
        </div>

        {/* User Info Greeting */}
        <div className="text-right text-xs">
          <p className="text-textMuted font-medium">Welcome back,</p>
          <p className="font-bold text-primary">{user?.name || 'User'}</p>
        </div>
      </div>
    </header>
  );
}
