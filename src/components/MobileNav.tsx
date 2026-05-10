import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageSquare, User, Bookmark, Compass } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function MobileNav() {
  const { theme } = useSettings();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Feed', to: '/feed' },
    { icon: Compass, label: 'Watch', to: '/videos' },
    { icon: MessageSquare, label: 'Messages', to: '/messages' },
    { icon: User, label: 'Profile', to: '/profile' },
  ];

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 border-t backdrop-blur-lg ${
      theme === 'dark' ? 'bg-[#0a0a0a]/80 border-[#1f1f1f]' : 'bg-white/80 border-gray-200'
    } px-2 pb-safe`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all ${
              isActive 
                ? (theme === 'dark' ? 'text-[#FF003C]' : 'text-[#ff2a4b]') 
                : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')
            }`}
          >
            <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-medium uppercase tracking-tighter">{item.label}</span>
            {isActive && (
              <div className={`absolute bottom-1 w-1 h-1 rounded-full ${theme === 'dark' ? 'bg-[#FF003C]' : 'bg-[#ff2a4b]'}`} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
