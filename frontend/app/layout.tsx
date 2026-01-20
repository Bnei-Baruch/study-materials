import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Study Material Service",
  description: "Create and manage lesson parts with sources",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
