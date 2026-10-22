import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Наш район",
  description: "Кооперативная браузерная 3D-игра для 2–4 игроков.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
