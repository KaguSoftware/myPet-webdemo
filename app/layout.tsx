import type { Metadata, Viewport } from "next";
import { Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";
import PhoneShell from "@/components/PhoneShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const pixel = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PetPal — your pet's family hub",
  description:
    "Track feeding, litter, walks, grooming and vet visits together as a family — with vet-built care plans that do the thinking for you.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PetPal" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
