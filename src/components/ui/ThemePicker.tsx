import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export const ThemePicker: React.FC = () => {
  const { mode, preset, setMode, setPreset } = useTheme();

  const presets = [
    { id: 'lavender', color: '#8b5cf6' },
    { id: 'mint', color: '#10b981' },
    { id: 'sky', color: '#0ea5e9' },
    { id: 'peach', color: '#f97316' },
    { id: 'rose', color: '#f43f5e' },
    { id: 'lemon', color: '#eab308' },
    { id: 'periwinkle', color: '#6366f1' },
    { id: 'sakura', color: '#ec4899' },
    { id: 'ocean', color: '#06b6d4' },
    { id: 'sunset', color: '#f43f5e' }
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: 'var(--spacing-1)', backgroundColor: 'var(--color-surface-hover)', padding: 'var(--spacing-1)', borderRadius: 'var(--radius-full)' }}>
        <button 
          onClick={() => setMode('light')}
          style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', background: mode === 'light' ? 'var(--color-surface)' : 'transparent', border: 'none', cursor: 'pointer', color: mode === 'light' ? 'var(--color-text)' : 'var(--color-text-muted)', boxShadow: mode === 'light' ? 'var(--shadow-sm)' : 'none', fontWeight: mode === 'light' ? 600 : 400 }}
        >Light</button>
        <button 
          onClick={() => setMode('dark')}
          style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', background: mode === 'dark' ? 'var(--color-surface)' : 'transparent', border: 'none', cursor: 'pointer', color: mode === 'dark' ? 'var(--color-text)' : 'var(--color-text-muted)', boxShadow: mode === 'dark' ? 'var(--shadow-sm)' : 'none', fontWeight: mode === 'dark' ? 600 : 400 }}
        >Dark</button>
      </div>

      {/* Preset Picker */}
      <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
        {presets.map(p => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id as any)}
            title={p.id}
            style={{
              width: '24px', height: '24px', borderRadius: '50%',
              backgroundColor: p.color,
              border: preset === p.id ? '2px solid var(--color-text)' : '2px solid transparent',
              cursor: 'pointer',
              padding: 0,
              boxShadow: preset === p.id ? '0 0 0 2px var(--color-background) inset' : 'none',
              transition: 'transform var(--transition-fast)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        ))}
      </div>
    </div>
  );
};

