import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FRAME Finance",
  description: "Gestão financeira para escritórios de contabilidade",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.className} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0c0c1d] text-white font-sans">{children}</body>
    </html>
  );
}
