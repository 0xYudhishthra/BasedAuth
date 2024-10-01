import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
//import Navbar from "./components/Navbar";
import { ThirdwebProvider } from "thirdweb/react";
import Navbar from "./components/Navbar";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThirdwebProvider>
          <Navbar></Navbar>
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  );
}
