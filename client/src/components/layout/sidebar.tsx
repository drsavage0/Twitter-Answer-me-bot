import React from 'react';
import { Link, useLocation } from 'wouter';

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: 'home' },
    { path: '/settings', label: 'Settings', icon: 'cog' },
    { path: '/analytics', label: 'Analytics', icon: 'chart-bar' },
    { path: '/history', label: 'History', icon: 'history' },
    { path: '/help', label: 'Help', icon: 'question-circle' },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="hidden md:block w-64 border-r border-twitter-border overflow-y-auto">
      <nav className="p-3">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a 
                  className={`flex items-center px-4 py-3 text-lg font-medium rounded-full hover:bg-gray-800 transition ${
                    location === item.path ? 'text-twitter-blue bg-gray-800/50' : ''
                  }`}
                >
                  <i className={`fas fa-${item.icon} mr-4`}></i>
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
