import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overlay Widget",
  description: "OBS overlay widget",
  viewport: { width: "device-width", initialScale: 1 },
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
