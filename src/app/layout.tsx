import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QC-CMS EDMS — PT Asuka Engineering Indonesia",
  description: "QA/QC Electronic Document Management System & Control Platform — PT Asuka Engineering Indonesia",
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
    <html lang="id" className="overflow-x-hidden max-w-full">
      <body className="antialiased min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-[#163d78] selection:text-white overflow-x-hidden max-w-full w-full">
        {children}
      </body>
    </html>
  );
}
