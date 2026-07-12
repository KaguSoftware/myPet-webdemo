import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import PhoneShell from "@/components/PhoneShell";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
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
  themeColor: "#f7f4f2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} antialiased`}>
        <PhoneShell>{children}</PhoneShell>
      </body>
    </html>
  );
}
