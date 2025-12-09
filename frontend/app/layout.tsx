import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui";
import { TabProvider } from "@/contexts/TabContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ERP ADI - Enterprise Resource Planning",
  description: "Sistem ERP yang modern dan user-friendly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>
          <TabProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </TabProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
