import type { Metadata } from "next";
import { dmSans, jetbrainsMono } from "@/lib/fonts";
import { Toaster } from "@/components/ui/toast";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "FlowForge — Contabilidad inteligente",
  description:
    "Herramienta de automatización contable con IA para PyMEs argentinas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-neutral-50 font-body text-neutral-900 antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
