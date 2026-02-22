"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Theme = "light" | "comic-dark" | "premium";

export const THEMES: { id: Theme; name: string; description: string }[] = [
  { id: "light", name: "Light", description: "Clean and bright, the default look" },
  { id: "comic-dark", name: "Comic Dark", description: "Dark navy with gold accents — comic shop vibes" },
  { id: "premium", name: "Clean Premium", description: "Sleek near-black with violet accents" },
];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("comichero-theme") as Theme | null;
    if (saved && THEMES.some((t) => t.id === saved)) {
      setThemeState(saved);
      document.documentElement.dataset.theme = saved;
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("comichero-theme", newTheme);
    document.documentElement.dataset.theme = newTheme;
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
