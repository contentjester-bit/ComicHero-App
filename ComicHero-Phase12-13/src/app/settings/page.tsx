"use client";

import { useTheme, THEMES, type Theme } from "@/lib/theme/theme-context";

const themePreview: Record<Theme, { bg: string; surface: string; accent: string; text: string; border: string }> = {
  light: { bg: "#f9fafb", surface: "#ffffff", accent: "#4f46e5", text: "#111827", border: "#e5e7eb" },
  "comic-dark": { bg: "#07071a", surface: "#0f0f2e", accent: "#facc15", text: "#eeeeff", border: "#222255" },
  premium: { bg: "#09090b", surface: "#131316", accent: "#8b5cf6", text: "#fafafa", border: "#222228" },
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Customize your ComicHero experience
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Theme</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {THEMES.map((t) => {
            const preview = themePreview[t.id];
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`group relative overflow-hidden rounded-xl border-2 p-1 text-left transition-all ${
                  isActive
                    ? "border-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-base)]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Mini preview */}
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: preview.bg }}
                >
                  {/* Fake nav bar */}
                  <div
                    className="mb-2 flex items-center justify-between rounded-md px-2 py-1.5"
                    style={{
                      backgroundColor: preview.surface,
                      borderBottom: `1px solid ${preview.border}`,
                    }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{ color: preview.accent }}
                    >
                      ComicHero
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-1.5 w-6 rounded-full"
                          style={{ backgroundColor: preview.border }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Fake hero */}
                  <div
                    className="mb-2 rounded-md p-2"
                    style={{
                      background: `linear-gradient(to right, ${preview.accent}22, ${preview.accent}11)`,
                    }}
                  >
                    <div
                      className="h-2 w-20 rounded"
                      style={{ backgroundColor: preview.text + "33" }}
                    />
                    <div
                      className="mt-1 h-1.5 w-28 rounded"
                      style={{ backgroundColor: preview.text + "22" }}
                    />
                  </div>

                  {/* Fake cards */}
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-md p-1.5"
                        style={{
                          backgroundColor: preview.surface,
                          border: `1px solid ${preview.border}`,
                        }}
                      >
                        <div
                          className="mb-1 h-6 rounded"
                          style={{ backgroundColor: preview.border }}
                        />
                        <div
                          className="h-1.5 w-full rounded"
                          style={{ backgroundColor: preview.text + "22" }}
                        />
                        <div
                          className="mt-0.5 h-1.5 w-2/3 rounded"
                          style={{ backgroundColor: preview.text + "15" }}
                        />
                        <div
                          className="mt-1 h-3 w-full rounded"
                          style={{ backgroundColor: preview.accent }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Label */}
                <div className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {t.name}
                    </span>
                    {isActive && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: "var(--accent-subtle-bg)",
                          color: "var(--accent-subtle-text)",
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">
          More themes coming soon
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Want a specific look? Themes are easy to add — each one is just a set
          of CSS custom properties.
        </p>
      </div>
    </div>
  );
}
