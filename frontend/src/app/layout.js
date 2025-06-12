import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Removed: import { SessionProvider } from 'next-auth/react'
import AuthProvider from '@/app/auth-provider'; // Added import

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Markdown Editor",
  description: "A simple markdown editor built with Next.js",
};

export default function RootLayout({ children, session }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider session={session}> {/* Changed to AuthProvider */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
