import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";

export const metadata = {
  title: "kabu-ana",
  description: "AI株式分析の新しい形",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>{children}</AuthProvider>
        {/* dev stamp */}
        <div
          style={{
            position: "fixed",
            bottom: 8,
            right: 8,
            fontSize: 12,
            opacity: 0.6,
            zIndex: 9999,
          }}
        >
          DEV {process.env.NODE_ENV} @{" "}
          {typeof window !== "undefined" ? location.href : "ssr"}
        </div>
      </body>
    </html>
  );
}
