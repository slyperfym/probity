import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://probity-market.vercel.app"),
  title: "Probity",
  description: "Institutional-grade prediction markets on Arc",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  },
  alternates: {
    canonical: "/"
  },
  openGraph: {
    description: "Institutional-grade prediction markets on Arc",
    url: "https://probity-market.vercel.app",
    siteName: "Probity",
    title: "Probity",
    type: "website"
  },
  twitter: {
    card: "summary",
    description: "Institutional-grade prediction markets on Arc",
    title: "Probity"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-[#f7f7f2] text-slate-950 antialiased">
            <SiteHeader />
            {children}
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
