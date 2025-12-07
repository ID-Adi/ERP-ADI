import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui";
import { TabProvider } from "@/contexts/TabContext";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <TabProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </TabProvider>
      </body>
    </html>
  );
}
