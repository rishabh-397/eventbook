import { createContext, useContext, useEffect, useState } from 'react';

const themes = {
  gold:   { accent: '#E8B563', accentLight: '#F5CE88', accentGlow: 'rgba(232,181,99,0.15)' },
  blue:   { accent: '#5B9BD5', accentLight: '#82B8E8', accentGlow: 'rgba(91,155,213,0.15)' },
  purple: { accent: '#A78BDB', accentLight: '#C0ADEA', accentGlow: 'rgba(167,139,219,0.15)' },
  rose:   { accent: '#E88A9A', accentLight: '#F2AEBB', accentGlow: 'rgba(232,138,154,0.15)' },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(
    localStorage.getItem('theme') || 'gold'
  );

  useEffect(() => {
    const theme = themes[themeName];
    const root = document.documentElement;
    // Core accent tokens
    root.style.setProperty('--gold',          theme.accent);
    root.style.setProperty('--gold-light',    theme.accentLight);
    root.style.setProperty('--gold-dim',      theme.accentGlow);
    root.style.setProperty('--seat-selected', theme.accent);
    // Tailwind @theme tokens (for classes like text-[--gold])
    root.style.setProperty('--color-gold',          theme.accent);
    root.style.setProperty('--color-gold-muted',    theme.accentGlow);
    root.style.setProperty('--color-seat-selected', theme.accent);
    localStorage.setItem('theme', themeName);
  }, [themeName]);

  return (
    <ThemeContext.Provider value={{ themeName, setThemeName, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}