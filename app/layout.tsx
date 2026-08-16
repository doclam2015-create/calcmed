import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CalcMed — Calculadoras y scores médicos",
  description: "Calculadoras, scores, algoritmos y referencias clínicas en español para profesionales de la salud.",
  manifest: "/manifest.webmanifest",
  applicationName: "CalcMed",
  appleWebApp: {
    capable: true,
    title: "CalcMed",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "CalcMed",
    description: "Calculadoras, scores y referencias clínicas en español.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "CalcMed" }],
  },
  twitter: { card: "summary_large_image", title: "CalcMed", description: "Calculadoras y scores médicos en español.", images: ["/og.png"] },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: "/icon-192.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head><meta name="theme-color" content="#0b5f63" /><meta name="mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-capable" content="yes" /></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
