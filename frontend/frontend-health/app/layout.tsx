import { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientTokenRefresher from "./ClientTokenRefresher";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Health Assistant - Your Personal Medical Guide",
  description:
    "AI-powered health assistant providing personalized medical guidance and symptom analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <ClientTokenRefresher />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
