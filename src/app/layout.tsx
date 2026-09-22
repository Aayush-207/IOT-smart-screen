import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import Script from 'next/script';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MIT ADTU Intelligent Broadcasts",
  description: "Campus-wide digital signage: submit announcements, route them through HOD approval, and broadcast to a monitored screen fleet with emergency override.",
  icons: {
    icon: '/MIT_circular.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${lora.variable} h-full antialiased`}
    >
      <head>
        <script id="theme-script"
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              try {
                const stored = localStorage.getItem('theme');
                const theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            })();
          `
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans bg-[var(--canvas)] text-[var(--ink)] selection:bg-[#ffffff] selection:text-[#0a0a0a]"
      >
        {children}
      </body>
    </html>
  );
}
