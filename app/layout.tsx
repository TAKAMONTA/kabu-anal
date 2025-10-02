import type { Metadata } from "next";
import { Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-serif-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "株式分析AI - カブアナ",
  description: "複数のAIによる包括的な株式分析システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body
        className={`${notoSerif.variable} min-h-full bg-ukiyoe-base text-ukiyoe-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
