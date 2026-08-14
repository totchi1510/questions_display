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
  title: "Questions Display",
  description: "通りがかりの問いから、対話を始める。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ja, not en: the question text leans on `word-break: auto-phrase` and
    // `line-break: strict`, which browsers only apply to content they consider
    // Japanese. Mis-declaring the language quietly disabled the phrase-aware
    // wrapping — most visible on narrow screens, where every line breaks.
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
