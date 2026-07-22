import type { Metadata, Viewport } from "next";
import "./globals.css";
import { sans, mono } from "./fonts";
import Provider from "@/components/Provider";
import { getAllPosts } from "@/lib/posts";

const base = "https://sanshuibot.github.io/sanshui-blog";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: { default: "\u4e09\u6c34 | \u4e2a\u4eba\u535a\u5ba2", template: "%s | \u4e09\u6c34" },
  description: "\u8bb0\u5f55\u6280\u672f\u601d\u8003\u4e0e\u521b\u4f5c\u7075\u611f.",
  keywords: ["\u4e09\u6c34", "\u4e2a\u4eba\u535a\u5ba2", "\u6280\u672f\u535a\u5ba2", "Next.js", "React", "TypeScript"],
  authors: [{ name: "\u4e09\u6c34", url: `${base}/about` }],
  openGraph: {
    title: "\u4e09\u6c34 | \u4e2a\u4eba\u535a\u5ba2",
    description: "\u8bb0\u5f55\u6280\u672f\u601d\u8003\u4e0e\u521b\u4f5c\u7075\u611f.",
    url: base,
    siteName: "\u4e09\u6c34\u535a\u5ba2",
    locale: "zh_CN",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05050a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const posts = getAllPosts();
  return (
    <html lang="zh-CN" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh flex flex-col bg-ink text-fg antialiased relative">
        <Provider posts={posts}>{children}</Provider>
      </body>
    </html>
  );
}
