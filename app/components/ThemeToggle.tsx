"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      const prefers = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const t = (saved as "light" | "dark") || (prefers ? "dark" : "light");
      setTheme(t);
      document.documentElement.setAttribute("data-theme", t === "dark" ? "dark" : "light");
    } catch (e) {
      // ignore
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    document.documentElement.setAttribute("data-theme", next === "dark" ? "dark" : "light");
  }

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={toggle}
      className="btn secondary px-3 py-2"
    >
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
