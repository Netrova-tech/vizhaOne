"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { translations, type TranslationKey } from "@/lib/i18n";
import type { Language } from "@/types";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("vizha_lang") as Language | null;
    const valid: Language[] = ["en", "ta", "hi", "ml", "te"];
    if (saved && valid.includes(saved)) {
      setTimeout(() => setLangState(saved), 0);
    }
  }, []);

  function setLang(l: Language) {
    setLangState(l);
    localStorage.setItem("vizha_lang", l);
    // Google Translate is triggered via __vizha_translate in the Navbar buttons
  }

  function t(key: TranslationKey): string {
    // For ml/te we don't have built-in translations — Google Translate handles the full page
    const dict = translations[lang as keyof typeof translations] ?? translations.en;
    return (dict as Record<string, string>)[key] ?? translations.en[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
