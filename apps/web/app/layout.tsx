import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Loaded through Next's built-in font loader: self-hosted at build time, no new package.
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
// The training-log voice: figures, dates, counts and meta.
// No metric-adjusted fallback: if the download ever fails, figures should drop to a system
// monospace face, not to Arial dressed up as one.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Consolas", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: "Arcwell — Coach workspace",
  description: "Run your coaching business: clients, plans, check-ins and payments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
