import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vellum — Resume Studio",
    template: "%s · Vellum",
  },
  description:
    "Craft a thoughtful, ATS-friendly resume in a calm, real-time studio. Groq-assisted writing, two editorial templates, cloud PDF export, and no clutter.",
  applicationName: "Vellum Resume Studio",
  keywords: [
    "AI resume builder",
    "resume builder",
    "ATS resume",
    "CV maker",
    "professional resume",
    "PDF resume",
  ],
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Vellum — Resume Studio",
    description:
      "A calm, cloud-native resume studio with Groq-assisted writing. Write on the left, watch it come to life on the right.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vellum — Resume Studio",
    description:
      "Craft a thoughtful, ATS-friendly resume in a calm, real-time studio.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F7F4ED",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
