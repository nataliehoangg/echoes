import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { AuthSessionProvider } from "@/components/session-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Echoes | Emotion-Level Song Discovery",
  description:
    "Echoes blends lyric intent and melodic feel to build Spotify playlists that resonate on an emotional level.",
  openGraph: {
    title: "Echoes | Emotion-Level Song Discovery",
    description:
      "Discover songs that match both the meaning and the feel of the music you love.",
    url: "https://echoes.app",
    siteName: "Echoes",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Echoes | Emotion-Level Song Discovery",
    description:
      "An AI-powered music discovery tool for people who feel music deeply.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} antialiased font-sans text-slate-100`}>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
