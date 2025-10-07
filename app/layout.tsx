import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ToastProvider } from "@/components/ui/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BeyondChats MVP - AI-Powered PDF Learning",
  description: "Upload PDFs, chat with AI, and generate quizzes for enhanced learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a href="#main" className="skip-link">Skip to main content</a>
        <ToastProvider>
          <Navigation />
          <main id="main" className="outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
