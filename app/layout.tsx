import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "./AppHeader";

export const metadata: Metadata = {
  title: "Ubulimi",
  description: "Farm management, from anywhere",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
