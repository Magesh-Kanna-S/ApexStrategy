import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ApexStrategy Enterprise — Corporate Business Simulation",
  description:
    "A modern, multi-department corporate business simulation platform with reactive live proformas, multi-currency support, AI competitors, and a sleek financial-terminal UI. Zero setup required.",
  keywords: [
    "ApexStrategy",
    "Business Simulation",
    "Corporate Strategy",
    "Proforma",
    "Next.js",
  ],
  authors: [{ name: "ApexStrategy Labs" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ApexStrategy Enterprise",
    description: "Modern corporate business simulation with live proformas.",
    siteName: "ApexStrategy Enterprise",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ApexStrategy Enterprise",
    description: "Modern corporate business simulation with live proformas.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
