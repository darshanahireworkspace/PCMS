import { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext();

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "system"
  );

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (mode) => {
      if (mode === "dark") {
        root.setAttribute("data-theme", "dark");
      } else if (mode === "light") {
        root.setAttribute("data-theme", "light");
      } else {
        const dark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

        root.setAttribute(
          "data-theme",
          dark ? "dark" : "light"
        );
      }
    };

    applyTheme(theme);

    localStorage.setItem("theme", theme);

    if (theme === "system") {
      const media = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

      const handler = () => applyTheme("system");

      media.addEventListener("change", handler);

      return () =>
        media.removeEventListener("change", handler);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}