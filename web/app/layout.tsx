import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import Navbar from "./components/Navbar";
import FontLoader from "./components/FontLoader";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Luca3Auth",
  description:
    "Luca3Auth is the easiest way to perform any blockchain transactions with a student ID",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    },
  ],
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FontLoader />
        <ThirdwebProvider>
          <Navbar></Navbar>
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  );
}
