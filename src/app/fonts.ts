import { Inter, JetBrains_Mono } from "next/font/google";

export const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  fallback: ["SF Pro Display", "PingFang SC", "Noto Sans SC", "sans-serif"],
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  fallback: ["Fira Code", "SF Mono", "Consolas", "monospace"],
});
