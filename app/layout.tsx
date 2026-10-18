import { coresMarca } from "@/lib/identidade";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import "./workspace.css";
import "./identidade.css";
import { PwaRegistration } from "@/components/PwaRegistration";
export const metadata: Metadata = {
  title: "Entre Elas · Saber que conecta",
  description:
    "Uma conversa pode abrir novos caminhos. Conecte experiências e compartilhe saberes entre mulheres.",
  applicationName: "Entre Elas",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Entre Elas",
  },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: coresMarca.azul,
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <PwaRegistration />
        <Toaster
          richColors
          position="top-center"
          closeButton
          toastOptions={{
            style: { fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12 },
          }}
        />
      </body>
    </html>
  );
}
