import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import ToastContainer from "../components/ToastContainer";

export const metadata: Metadata = {
  title: "Investy",
  description: "AI investment research agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
        <Header />
        <div className="container flex-1 w-full">{children}</div>
        <ToastContainer />
      </body>
    </html>
  );
}