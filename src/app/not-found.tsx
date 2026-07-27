import type { Metadata } from "next";
import NotFoundContent from "@/components/NotFound/NotFoundContent";

export const metadata: Metadata = {
  title: "404",
  description: "页面未找到",
};

export default function NotFound() {
  return <NotFoundContent />;
}
