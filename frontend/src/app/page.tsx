"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { readRecent } from "@/lib/recent";

const CATEGORIES = [
  { label: "Music", value: "KZFzniwnSyZfZ7v7nJ" },
  { label: "Sports", value: "KZFzniwnSyZfZ7v7nE" },
  { label: "Arts & Theatre", value: "KZFzniwnSyZfZ7v7na" },
  { label: "Film", value: "KZFzniwnSyZfZ7v7nn" },
  { label: "Misc", value: "KZFzniwnSyZfZ7v7n1" },
];

const CITIES = [
  { label: "Los Angeles", loc: "34.0522,-118.2437" },
  { label: "New York", loc: "40.7128,-74.0060" },
  { label: "Chicago", loc: "41.8781,-87.6298" },
  { label: "Miami", loc: "25.7617,-80.1918" },
];

export default function Home() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("default");
  const [radius, setRadius] = useState("10");
  const [recent, setRecent] = useState<{ keyword: string; location: string; category: string; radius: string; ts: number }[]>([]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  function goSearch(params: { keyword?: string; location?: string; category?: string; radius?: string; autodetect?: string }) {
    const usp = new URLSearchParams();
    if (params.keyword) usp.set("keyword", params.keyword);
    if (params.location) usp.set("location", params.location);
    if (params.category) usp.set("category", params.category);
    if (params.radius) usp.set("radius", params.radius);
    if (params.autodetect) usp.set("autodetect", params.autodetect);
    router.push(`/search?${usp.toString()}`);
  }

  return (
    <div className="relative">
      <section className="container mx-auto max-w-6xl px-6 pt-16 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-indigo-500/40 via-purple-500/40 to-rose-500/40"
        >
          <div className="rounded-3xl bg-card p-8 md:p-12">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Discover live events near you</h1>
              <p className="mt-3 text-muted-foreground">Search concerts, sports, theatre and more — with a refined, modern interface.</p>
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-[1.2fr_1.2fr_auto]">
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Keyword (e.g. Taylor Swift)" />
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State or lat,lon" />
              <Button onClick={() => goSearch({ keyword, location, category, radius })} disabled={!keyword}>Search</Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted-foreground">Category</span>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setCategory("default"); goSearch({ keyword, location, category: "default", radius }); }} className={`px-3 py-1.5 rounded-full border ${category === "default" ? "bg-foreground text-background" : "hover:bg-muted"}`}>All</button>
                {CATEGORIES.map(c => (
                  <button key={c.value} onClick={() => { setCategory(c.value); goSearch({ keyword, location, category: c.value, radius }); }} className={`px-3 py-1.5 rounded-full border ${category === c.value ? "bg-foreground text-background" : "hover:bg-muted"}`}>{c.label}</button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted-foreground">Radius</span>
              <div className="flex gap-2">
                {["5","10","25","50"].map(r => (
                  <button key={r} onClick={() => { setRadius(r); goSearch({ keyword, location, category, radius: r }); }} className={`px-3 py-1.5 rounded-full border ${radius === r ? "bg-foreground text-background" : "hover:bg-muted"}`}>{r} mi</button>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Trending cities</div>
              <div className="flex flex-wrap gap-2">
                {CITIES.map(c => (
                  <button key={c.label} onClick={() => goSearch({ keyword: keyword || "music", location: c.loc, category, radius })} className="px-3 py-1.5 rounded-full border hover:bg-muted">
                    {c.label}
                  </button>
                ))}
                <button onClick={() => goSearch({ keyword: keyword || "music", autodetect: "1", category, radius })} className="px-3 py-1.5 rounded-full border hover:bg-muted">Use my location</button>
              </div>
            </div>

            {recent.length > 0 && (
              <div className="mt-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recent searches</div>
                <div className="flex flex-wrap gap-2">
                  {recent.slice(0, 8).map((r, i) => (
                    <button key={`${r.keyword}-${i}`} onClick={() => goSearch({ keyword: r.keyword, location: r.location, category: r.category, radius: r.radius })} className="px-3 py-1.5 rounded-full border hover:bg-muted">
                      {r.keyword} • {r.location.includes(",") ? "Near you" : r.location}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      <section className="container mx-auto max-w-6xl px-6 pb-16">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/favorites" className="underline">Favorites</Link>
          <Link href="/search" className="underline">Explore all</Link>
          <Link href="/health" className="underline">Health</Link>
        </div>
      </section>
    </div>
  );
}
