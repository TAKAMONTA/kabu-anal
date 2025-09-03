import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";

export const metadata = {
  title: "kabu-ana",
  description: "AIﾃ玲兜雉・ュ蝣ｱ縺ｮ譁ｰ縺励＞蠖｢",
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
      </body>
    </html>
  );
}
