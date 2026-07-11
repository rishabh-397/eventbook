import { createContext, useContext, useEffect, useState } from 'react';

const themes = {
  gold: { accent: '#E8B563', accentGlow: 'rgba(232,181,99,0.15)' },
  blue: { accent: '#5B9BD5', accentGlow: 'rgba(91,155,213,0.15)' },
  purple: { accent: '#A78BDB', accentGlow: 'rgba(167,139,219,0.15)' },
  rose: { accent: '#E88A9A', accentGlow: 'rgba(232,138,154,0.15)' },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(
    localStorage.getItem('theme') || 'gold'
  );

  useEffect(() => {
    const theme = themes[themeName];
    document.documentElement.style.setProperty('--gold', theme.accent);
    document.documentElement.style.setProperty('--seat-selected', theme.accent);
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