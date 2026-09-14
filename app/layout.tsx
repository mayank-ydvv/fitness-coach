import type { Metadata, Viewport } from "next";
import { Inter_Tight, Public_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Headlines and every large number the user reads (calories, weight,
// streak) — see DESIGN.md §Visual tokens v2. Regular weight (400) at
// tight negative tracking, per the Superpower reference: the whisper-weight
// at display size is the signature, not a bold serif treatment. Replaces
// Fraunces entirely.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "AI Fitness Coach",
  description: "Meal photos, real progression, camera form checks, and habits that stick.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f2ed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${publicSans.variable} ${interTight.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
