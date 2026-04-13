import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const bodyFont = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });

const headingFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "Nexus Ledger - Personal Finance Tracker",
  description: "A premium personal finance tracker built with Next.js and Recharts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", bodyFont.variable, headingFont.variable)}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
