'use client';
import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={20} style={{ color: 'var(--text-secondary)' }} />;
      case 'dark':
        return <Moon size={20} style={{ color: 'var(--text-secondary)' }} />;
      case 'system':
        return <Monitor size={20} style={{ color: 'var(--text-secondary)' }} />;
      default:
        return <Monitor size={20} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 p-2 transition-all duration-200 hover:scale-110"
      title={`Current theme: ${theme}`}
      style={{ 
        color: 'var(--text-primary)',
        zIndex: 99999
      }}
    >
      {getIcon()}
    </button>
  );
}