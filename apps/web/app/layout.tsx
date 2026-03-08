import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "AI Sales OS",
  description: "AI-native operating system for revenue teams"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
