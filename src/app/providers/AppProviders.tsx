import React from 'react';
import { QueryProvider } from './QueryProvider.tsx';
import { ThemeProvider } from './ThemeProvider.tsx';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryProvider>
  );
};
