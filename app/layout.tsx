import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Navbar from "./components/Navbar";
import Providers from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parcela 8 - Gestión de Incidencias",
  description: "Sistema de gestión de incidencias de Comunidad Parcela 8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#FAFAF7]">
        <Providers>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-white border-t border-stone-200 py-4">
            <div className="max-w-7xl mx-auto px-4 text-center text-xs text-stone-400">
              Comunidad Parcela 8 © 2025
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
