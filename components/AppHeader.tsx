"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "聊天" },
  { href: "/document", label: "文件管理" },
];

// Mirrors the 401 handling elsewhere — logging out always lands back on /login.
async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "/login";
  }
}

export default function AppHeader({ title }: { title: string }) {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-semibold text-neutral-800">{title}</h1>
        <nav className="flex items-center gap-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition ${
                  active
                    ? "font-medium text-blue-600"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <button
        onClick={logout}
        className="text-sm text-neutral-500 transition hover:text-neutral-800"
      >
        登出
      </button>
    </header>
  );
}
