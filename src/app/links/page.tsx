import type { Metadata } from "next";
import LinksContent from "@/components/Links/LinksContent";

export const metadata: Metadata = {
  title: "友链",
  description: "友情链接",
};

export default function LinksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <LinksContent />
    </div>
  );
}
