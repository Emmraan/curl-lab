import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css"; // Global styles

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CurlLab - The Ultimate cURL Playground",
  description: "A production-grade sandbox for parsing, organizing, and executing cURL requests inside your browser and local dev environments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var originalFetch = window.fetch;
                  var currentFetch = originalFetch;
                  Object.defineProperty(window, 'fetch', {
                    get: function() {
                      return currentFetch;
                    },
                    set: function(val) {
                      currentFetch = val;
                    },
                    configurable: true,
                    enumerable: true
                  });
                } catch (e) {
                  console.warn('Safe fetch wrapper init failed:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="bg-[#09090b] text-zinc-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
