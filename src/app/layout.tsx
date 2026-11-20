import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QC-CMS EDMS — PT Asuka Engineering Indonesia",
  description: "QA/QC Electronic Document Management System & Control Platform — PT Asuka Engineering Indonesia",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} overflow-x-hidden max-w-full`}>
      <body className="font-sans antialiased min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-[#163d78] selection:text-white overflow-x-hidden max-w-full w-full">
        <div id="app-root">
          {children}
        </div>
        <div id="print-portal-root"></div>
      </body>
    </html>
  );
}
