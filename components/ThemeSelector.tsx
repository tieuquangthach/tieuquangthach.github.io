import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../types';

const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="absolute top-4 right-4 bg-white/70 backdrop-blur-sm p-2 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-text-muted mr-2">Giao diện:</span>
        {themes.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className={`w-6 h-6 rounded-full transition-transform duration-200 focus:outline-none ${
              theme.name === t.name 
                ? 'ring-2 ring-offset-2 ring-primary' 
                : 'ring-1 ring-gray-300 hover:scale-110'
            }`}
            style={{ backgroundColor: t.colors.primary }}
            aria-label={`Chọn giao diện ${t.name}`}
            title={t.name}
          />
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;
