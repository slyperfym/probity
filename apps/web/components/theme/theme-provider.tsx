"use client";

import * as React from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mounted: boolean;
  setTheme: (theme: ThemeMode) => void;
  theme: ThemeMode;
};

const STORAGE_KEY = "probity-theme";

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeMode>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    const initialTheme = savedTheme === "dark" ? "dark" : "light";

    applyTheme(initialTheme);
    setThemeState(initialTheme);
    setMounted(true);
  }, []);

  const setTheme = React.useCallback((nextTheme: ThemeMode) => {
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
  }, []);

  const value = React.useMemo(
    () => ({ mounted, setTheme, theme }),
    [mounted, setTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
