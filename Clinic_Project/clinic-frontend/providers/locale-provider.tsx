'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

export type Locale = 'ar' | 'en';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

// إنشاء الـ Context مع قيم افتراضية
export const LocaleContext = createContext<LocaleContextType>({
  locale: 'ar',
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ar');

  // جلب اللغة المحفوظة من المتصفح عند التحميل
  useEffect(() => {
    const savedLocale = localStorage.getItem('clinic_locale') as Locale;
    if (savedLocale) {
      setLocale(savedLocale);
      document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = savedLocale;
    } else {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    }
  }, []);

  // دالة لتغيير اللغة وحفظها
  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('clinic_locale', newLocale);
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}