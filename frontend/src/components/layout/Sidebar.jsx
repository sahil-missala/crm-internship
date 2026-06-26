import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  Car,
  BarChart3,
  Settings,
  LogOut,
  User
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'All Enquiries', path: '/dashboard/enquiries', icon: ClipboardList },
    { name: 'Follow-ups Today', path: '/dashboard/followups', icon: CalendarCheck },
    { name: 'Bookings', path: '/dashboard/bookings', icon: Car },
    { name: 'Reports', path: '/dashboard/reports', icon: BarChart3 },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings }
  ];

  return (
    <aside className="w-[240px] bg-primary text-white flex flex-col h-screen fixed top-0 left-0 z-20 shadow-lg select-none">
      {/* Brand Header */}
      <div className="h-16 flex flex-col justify-center px-6 border-b border-white/10">
        <h1 className="text-sm font-bold tracking-tight leading-none text-accent">
          MANIVTHA
        </h1>
        <span className="text-[10px] text-white/60 uppercase tracking-widest font-semibold mt-1">
          Tours & Travels
        </span>
      </div>

      {/* Nav Menu Links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-input text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-accent shadow-inner'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Profile Footer */}
      <div className="p-4 border-t border-white/10 flex flex-col gap-3 bg-primary-dark/40">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-full bg-accent text-primary flex items-center justify-center font-bold text-sm shadow-subtle shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </div>
          <div className="overflow-hidden min-w-0">
            <h4 className="text-xs font-bold leading-tight truncate text-white">
              {user?.name || 'Staff User'}
            </h4>
            <span className="text-[10px] leading-tight text-white/50 capitalize block truncate">
              {user?.role || 'Executive'}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-input transition-colors duration-200 border border-white/10 focus:outline-none"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
