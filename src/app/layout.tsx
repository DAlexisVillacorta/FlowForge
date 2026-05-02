import type { Metadata, Viewport } from "next";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { dmSans, jetbrainsMono } from "@/lib/fonts";
import { Toaster } from "@/components/ui/toast";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "FlowForge — Contabilidad inteligente para PyMEs",
    template: "%s | FlowForge",
  },
  description:
    "Automatizá tu contabilidad con inteligencia artificial. Clasificación automática de transacciones, conciliación bancaria y reportes en minutos.",
  keywords: [
    "contabilidad",
    "automatización",
    "IA",
    "PyME",
    "Argentina",
    "conciliación bancaria",
    "facturas",
  ],
  authors: [{ name: "FlowForge" }],
  creator: "FlowForge",
  openGraph: {
    type: "website",
    locale: "es_AR",
    title: "FlowForge — Contabilidad inteligente para PyMEs",
    description:
      "Automatizá tu contabilidad con IA. Clasificación automática, conciliación bancaria y reportes para PyMEs argentinas.",
    siteName: "FlowForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowForge — Contabilidad inteligente",
    description: "Automatizá tu contabilidad con IA para PyMEs argentinas.",
  },
  icons: {
    icon: [
      { url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" },
    ],
    shortcut: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F766E" },
    { media: "(prefers-color-scheme: dark)", color: "#0D2D2B" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-neutral-50 font-body text-neutral-900 antialiased dark:bg-neutral-900 dark:text-neutral-100">
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
        <Toaster />
      </body>
    </html>
  );
}
