import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Presentation Builder",
  description: "Describe a deck, then refine it in chat or on the canvas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
