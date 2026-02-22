import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/layout/nav-bar";
import { ThemeProvider } from "@/lib/theme/theme-context";

export const metadata: Metadata = {
  title: "ComicHero - Vintage Comic Book Sourcing",
  description:
    "Find and track vintage collector comic books across eBay with intelligent deal detection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('comichero-theme');if(t)document.documentElement.dataset.theme=t}catch{}`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <NavBar />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
