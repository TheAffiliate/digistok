// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThirdwebProvider } from "thirdweb/react";
import { AuthProvider } from "@/lib/AuthContext"; // 1. Import AuthProvider
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DigiStok | Digital Stokvel Platform",
  description: "Web3-integrated rotational savings platform with automated yield generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-[#140e0c] text-slate-200">
        <ThirdwebProvider>
          {/* 2. Wrap children with AuthProvider, inside ThirdwebProvider */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}