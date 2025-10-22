import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "GameOps - Station Management",
  description: "Esports venue management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <ToastProvider />
      </body>
    </html>
  );
}
