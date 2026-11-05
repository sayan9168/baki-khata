import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Toaster } from "sonner";

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: "বাকির খাতা",
  description: "দোকান, টিউশন ও ফ্রিল্যান্সারদের জন্য বাকি ও পেমেন্ট ট্র্যাকার",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "বাকির খাতা",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={notoBengali.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <div className="mx-auto max-w-lg min-h-screen flex flex-col pb-20">
          <main className="flex-1">{children}</main>
          <BottomNav />
        </div>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
