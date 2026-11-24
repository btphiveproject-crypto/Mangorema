import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppLanguage } from '../types';
import { TRANSLATIONS, TranslationDictionary } from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = 'mangorema_lang';

function getInitialLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'fr' || stored === 'en' || stored === 'ar') {
      return stored;
    }
  } catch {
    // Ignore storage access errors
  }
  return 'fr';
}

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (next: AppLanguage) => void;
  isRTL: boolean;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'fr',
  setLang: () => {},
  isRTL: false,
  t: TRANSLATIONS.fr,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => getInitialLanguage());

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Ignore storage access errors
    }
  }, [lang]);

  const setLang = (next: AppLanguage) => {
    setLangState(next);
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        isRTL: lang === 'ar',
        t: TRANSLATIONS[lang],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
