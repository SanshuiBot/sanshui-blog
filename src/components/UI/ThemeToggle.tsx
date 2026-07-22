"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="p-2 w-9 h-9" />;

  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
      aria-label="切换主题"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
