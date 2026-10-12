// providers/theme-provider.tsx
'use client';

import { useEffect, useState, ReactNode } from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark';
  attribute?: string;
}

export const ThemeProvider = ({
  children,
  defaultTheme = 'light',
  attribute = 'class',
}: ThemeProviderProps) => {
  return (
    <NextThemeProvider defaultTheme={defaultTheme} attribute={attribute}>
      {children}
    </NextThemeProvider>
  );
};