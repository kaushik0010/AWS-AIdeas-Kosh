import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/src/components/Header/Header";
import Footer from "@/src/components/Footer/Footer";
import AuthProvider from "@/src/features/auth/context/AuthProvider";
import { Toaster } from "@/components/ui/sonner"
import { Analytics } from '@vercel/analytics/next';

const geist = Geist({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "KOSH",
  description: "Smart group and individual savings platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased`}>
        <AuthProvider>
          <Header />

          <main className="min-h-screen">
            {children}
            <Analytics />
            <Toaster richColors closeButton />
          </main>

          {/* footer */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
