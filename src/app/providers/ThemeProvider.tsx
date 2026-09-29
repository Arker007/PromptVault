import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { getAppTheme } from '../config/theme.ts';
import { AppContextListener } from '@/shared/lib/message.ts';

interface ThemeContextType {
  isDarkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  setDarkMode: () => {},
  toggleDarkMode: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pv_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pv_theme', isDarkMode ? 'dark' : 'light');
    } catch {}
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const themeConfig = getAppTheme(isDarkMode);

  return (
    <ThemeContext.Provider value={{ isDarkMode, setDarkMode: setIsDarkMode, toggleDarkMode }}>
      <ConfigProvider theme={themeConfig}>
        <AntdApp>
          <AppContextListener />
          {children}
        </AntdApp>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
