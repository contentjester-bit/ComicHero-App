"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTheme, THEMES, type Theme } from "@/lib/theme/theme-context";

const searchSubLinks = [
  { href: "/issue", label: "🔍 By Issue" },
  { href: "/character", label: "🦸 By Character" },
];

const navLinks = [
  { href: "/", label: "Dashboard", type: "link" as const },
  { href: "SEARCH_DROPDOWN", label: "🔍 Search", type: "dropdown" as const },
  { href: "/collection", label: "📋 Collection", type: "link" as const },
  { href: "/want-list", label: "⭐ Want List", type: "link" as const },
  { href: "/curate", label: "📚 Curate", type: "link" as const },
  { href: "/bundles", label: "📦 Bundles", type: "link" as const },
  { href: "/seller-tools", label: "🤖 Seller", type: "link" as const },
  { href: "/whatnot", label: "🎯 Auctions", type: "link" as const },
  { href: "/art-creator", label: "🎨 Art", type: "link" as const },
];

export function NavBar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const cycleTheme = () => {
    const idx = THEMES.findIndex((t) => t.id === theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next.id);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSearchActive = pathname.startsWith("/issue") || pathname.startsWith("/character");

  const themeIcon: Record<Theme, string> = {
    light: "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z",
    "comic-dark": "M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z",
    premium: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z",
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
              ComicHero
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex md:gap-0.5">
              {navLinks.map((link) => {
                if (link.type === "dropdown") {
                  return (
                    <div key="search-dropdown" className="relative" ref={searchRef}>
                      <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className={`flex items-center gap-0.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                          isSearchActive
                            ? "text-gray-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                        style={isSearchActive ? { backgroundColor: "var(--accent-subtle-bg)", color: "var(--accent-subtle-text)" } : undefined}
                      >
                        {link.label}
                        <svg className={`ml-0.5 h-3 w-3 transition-transform ${searchOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      {searchOpen && (
                        <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          {searchSubLinks.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => setSearchOpen(false)}
                              className={`block px-4 py-2 text-sm ${
                                pathname === sub.href || pathname.startsWith(sub.href + "/")
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    style={isActive ? { backgroundColor: "var(--accent-subtle-bg)", color: "var(--accent-subtle-text)" } : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={cycleTheme}
              className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
              title={`Theme: ${THEMES.find((t) => t.id === theme)?.name}`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={themeIcon[theme]} />
              </svg>
            </button>

            <Link
              href="/settings"
              className={`rounded-md p-2 transition-colors ${
                pathname === "/settings" ? "text-gray-900" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title="Settings"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </Link>

            <div className="md:hidden">
              <MobileMenu pathname={pathname} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ pathname }: { pathname: string }) {
  const allMobileLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/issue", label: "🔍 Search: Issue" },
    { href: "/character", label: "🦸 Search: Character" },
    { href: "/collection", label: "📋 Collection" },
    { href: "/want-list", label: "⭐ Want List" },
    { href: "/curate", label: "📚 Curate" },
    { href: "/bundles", label: "📦 Bundles" },
    { href: "/seller-tools", label: "🤖 Seller Tools" },
    { href: "/whatnot", label: "🎯 Auctions" },
    { href: "/art-creator", label: "🎨 Cover Art" },
    { href: "/settings", label: "⚙️ Settings" },
  ];

  return (
    <details className="relative">
      <summary className="cursor-pointer rounded-md p-2 text-gray-600 hover:bg-gray-50">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
        {allMobileLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 text-sm ${isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </details>
  );
}
