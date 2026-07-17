import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import PhoneShell from "@/components/PhoneShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Geist Pixel — self-hosted from Google Fonts (Geist Pixel v1; the TTF here is
// byte-identical to fonts.gstatic.com's). Not yet in this Next version's
// next/font/google font list, so it must be loaded locally.
const pixel = localFont({
  src: "./fonts/GeistPixel.ttf",
  variable: "--font-pixel",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PetPal — your pet's family hub",
  description:
    "Track feeding, litter, walks, grooming and vet visits together as a family — with vet-built care plans that do the thinking for you.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PetPal" },
};

// Every route reads the signed-in user's household via cookies, so none of
// this can be statically prerendered at build time.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2F2F7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${pixel.variable} antialiased`}>
        <PhoneShell>{children}</PhoneShell>
      </body>
    </html>
  );
}
