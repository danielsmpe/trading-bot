import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import { Header } from "../components/Header";
import AppWalletProvider from "@/components/AppWalletProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Autosnipe Trading Dashboard",
  description: "Monitor your Autosnipe trading performance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black`}>
        <AppWalletProvider>
          <Header />
          <div className="pt-16">{children}</div>
        </AppWalletProvider>
      </body>
    </html>
  );
}
