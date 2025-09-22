"use client";

import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

export default function Header() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const initial = localStorage.getItem("theme") || (mql.matches ? "dark" : "light");
    const isDark = initial === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-6xl h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">TicketmasterV2</Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/search" className="hover:underline">Search</Link>
            <Link href="/favorites" className="hover:underline">Favorites</Link>
            <Link href="/health" className="hover:underline">Health</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>Dark</span>
          <Switch checked={dark} onCheckedChange={setDark} />
        </div>
      </div>
    </header>
  );
}
