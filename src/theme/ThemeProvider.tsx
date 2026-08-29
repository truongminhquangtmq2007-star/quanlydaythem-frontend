import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ThemePreset = 'lavender' | 'mint' | 'sky' | 'peach' | 'rose' | 'lemon' | 'periwinkle' | 'sakura' | 'ocean' | 'sunset';

interface ThemeContextType {
  mode: ThemeMode;
  preset: ThemePreset;
  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ThemePreset) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('theme_mode') as ThemeMode) || 'system';
  });

  const [preset, setPresetState] = useState<ThemePreset>(() => {
    return (localStorage.getItem('theme_preset') as ThemePreset) || 'lavender';
  });

  const applyTheme = (currentMode: ThemeMode, currentPreset: ThemePreset) => {
    const root = document.documentElement;
    
    // Determine actual mode if system
    let actualMode = currentMode;
    if (currentMode === 'system') {
      actualMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Set dataset attributes for CSS selectors
    root.setAttribute('data-theme', actualMode);
    root.setAttribute('data-preset', currentPreset);
  };

  useEffect(() => {
    applyTheme(mode, preset);

    // Listener for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') applyTheme('system', preset);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, preset]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme_mode', newMode);
  };

  const setPreset = (newPreset: ThemePreset) => {
    setPresetState(newPreset);
    localStorage.setItem('theme_preset', newPreset);
  };

  return (
    <ThemeContext.Provider value={{ mode, preset, setMode, setPreset }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

