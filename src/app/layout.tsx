import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { MongoSyncProvider } from "@/components/providers/MongoSyncProvider";

export const metadata: Metadata = {
  title: "GATE CSE 2027 Companion - Integrated Prep Tracker",
  description: "Personal prep companion for GATE CSE 2027 + BARC, NIC, ISRO. Subject tracker, spaced repetition, mock analytics, and burnout self-care.",
  keywords: ["GATE CSE 2027", "BARC", "NIC", "ISRO", "exam preparation", "Computer Science"],
  authors: [{ name: "Personal Study Companion" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
      >
        <AuthProvider>
          <MongoSyncProvider>
            {children}
          </MongoSyncProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
