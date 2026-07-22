"use client";
import { ThemeProvider } from "next-themes";
import CursorGlow from "@/components/UI/CursorGlow";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import ScrollProgress from "@/components/Layout/ScrollProgress";
import type { Post } from "@/lib/types";

export default function Provider({ children, posts }: { children: React.ReactNode; posts: Post[] }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="aurora-theme">
      <CursorGlow />
      <ScrollProgress />
      <Navbar posts={posts} />
      <main className="flex-1">{children}</main>
      <Footer />
    </ThemeProvider>
  );
}
