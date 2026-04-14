import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pumping-Lemma-Visualizer",
  description: "Master the Pumping Lemma with an interactive 3D visualizer. Explore string decomposition and prove non-regularity for languages like $a^n b^n$ and $a^{n^2}$ in real-time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main className="min-h-screen">
          {children}

        </main>
      </body>
    </html>
  );
}
