"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchEvents, reverseGeocode } from "@/lib/api";
import type { MappedEvent } from "@/types/tm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, MapPin, Tag } from "lucide-react";
import ShareButton from "@/components/common/ShareButton";
import { useSearchParams } from "next/navigation";
import { addRecent } from "@/lib/recent";
import SearchSuggestions from "@/components/search/SearchSuggestions";
import SearchRecommendations from "@/components/search/SearchRecommendations";

type CategoryOption = {
  label: string;
  value: string;
};

const categories: CategoryOption[] = [
  { label: "Default", value: "default" },
  { label: "Music", value: "KZFzniwnSyZfZ7v7nJ" },
  { label: "Sports", value: "KZFzniwnSyZfZ7v7nE" },
  { label: "Arts & Theatre", value: "KZFzniwnSyZfZ7v7na" },
  { label: "Film", value: "KZFzniwnSyZfZ7v7nn" },
  { label: "Miscellaneous", value: "KZFzniwnSyZfZ7v7n1" },
];

async function getIpInfo(token?: string): Promise<any | null> {
  if (!token) return null;
  try {
    const resp = await fetch(`https://ipinfo.io/?token=${encodeURIComponent(token)}`);
    const text = await resp.text();
    try { return JSON.parse(text); } catch {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    }
  } catch {
    return null;
  }
}

async function geolocateBrowser(): Promise<string> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Try to reverse geocode to get location name
        try {
          const result = await reverseGeocode(latitude, longitude);
          resolve(result.location || `${latitude},${longitude}`);
        } catch (error) {
          // If reverse geocoding fails, return coordinates
          resolve(`${latitude},${longitude}`);
        }
      },
      () => resolve(""),
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 8000 }
    );
  });
}

interface SearchResult {
  keyword: string;
  distance: string;
  category: string;
  location: string;
  events: MappedEvent[];
  timestamp: number;
}

export default function SearchPage() {
  const sp = useSearchParams();
  const [keyword, setKeyword] = useState("");
  const [distance, setDistance] = useState("10");
  const [category, setCategory] = useState("default");
  const [location, setLocation] = useState("");
  const [autoDetect, setAutoDetect] = useState(false);
  const [ipinfoToken] = useState<string | undefined>(undefined);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchKey, setCurrentSearchKey] = useState<string | null>(null);
  const keywordInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (autoDetect) {
      (async () => {
        let loc = "";
        if (ipinfoToken) {
          const info = await getIpInfo(ipinfoToken);
          if (info) {
            const locText = [info.city || "", info.region || "", info.country || ""].filter(Boolean).join(", ");
            loc = locText || info.loc || "";
          }
        }
        if (!loc) {
          loc = await geolocateBrowser();
        }
        if (!cancelled && loc) {
          // If loc is still in lat,lon format, try to reverse geocode
          const latLonMatch = loc.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
          if (latLonMatch) {
            try {
              const lat = parseFloat(latLonMatch[1]);
              const lon = parseFloat(latLonMatch[2]);
              const result = await reverseGeocode(lat, lon);
              setLocation(result.location || loc);
            } catch {
              setLocation(loc);
            }
          } else {
            setLocation(loc);
          }
        }
      })();
    }
    return () => { cancelled = true; };
  }, [autoDetect, ipinfoToken]);

  const enabled = useMemo(() => keyword.trim() !== "" && (autoDetect ? true : location.trim() !== ""), [keyword, location, autoDetect]);

  const query = useQuery({
    queryKey: ["search", { keyword, distance, category, location }],
    enabled: false,
    queryFn: async () => {
      const res = await searchEvents({
        keyword: keyword.trim(),
        radius: distance || "10",
        segmentId: category,
        location: location.trim(),
      });
      const events = res.events as MappedEvent[];
      const searchKey = `${keyword.trim()}_${distance}_${category}_${location.trim()}`;
      
      // Add to search results history
      setSearchResults(prev => {
        const existingIndex = prev.findIndex(r => r.keyword === keyword.trim() && r.distance === distance && r.category === category && r.location === location.trim());
        const newResult: SearchResult = {
          keyword: keyword.trim(),
          distance,
          category,
          location: location.trim(),
          events,
          timestamp: Date.now(),
        };
        
        if (existingIndex >= 0) {
          // Update existing result
          const updated = [...prev];
          updated[existingIndex] = newResult;
          return updated;
        } else {
          // Add new result (keep last 5 searches)
          return [newResult, ...prev].slice(0, 5);
        }
      });
      
      setCurrentSearchKey(searchKey);
      return events;
    },
    retry: 0,
  });

  // Prefill from query params and auto-execute
  useEffect(() => {
    const k = sp.get("keyword") || "";
    const r = sp.get("radius") || "10";
    const c = sp.get("category") || "default";
    const l = sp.get("location") || "";
    const ad = sp.get("autodetect") === "1";
    if (k) setKeyword(k);
    if (r) setDistance(r);
    if (c) setCategory(c);
    if (l) setLocation(l);
    setAutoDetect(ad);
    if (k && (l || ad)) {
      setTimeout(() => query.refetch(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (keywordInputRef.current && !keywordInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSuggestions]);

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Events Search</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Keyword *</label>
            <div ref={keywordInputRef} className="relative">
              <Input
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Enter keyword"
              />
              <SearchSuggestions
                keyword={keyword}
                isOpen={showSuggestions}
                onSelect={(kw) => {
                  setKeyword(kw);
                  setShowSuggestions(false);
                }}
                onSelectFull={(item) => {
                  setKeyword(item.keyword);
                  setLocation(item.location);
                  setCategory(item.category);
                  setDistance(item.radius);
                  setAutoDetect(false);
                  setShowSuggestions(false);
                  // Auto search when selecting full search
                  setTimeout(() => query.refetch(), 0);
                }}
                onClose={() => setShowSuggestions(false)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Distance (miles)</label>
            <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="10" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select className="h-9 rounded-md border bg-background px-3" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Location *</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State or lat,lon" disabled={autoDetect} />
            <label className="inline-flex items-center gap-2 text-sm mt-1">
              <input type="checkbox" checked={autoDetect} onChange={(e) => setAutoDetect(e.target.checked)} />
              Auto-detect location
            </label>
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button
              disabled={!enabled}
              onClick={async () => {
                let loc = location.trim();
                if (autoDetect && !loc) {
                  loc = await geolocateBrowser();
                  if (loc) setLocation(loc);
                }
                if (!loc) {
                  toast.error("Failed to determine location. Enter city or use current location.");
                  return;
                }
                addRecent({ keyword: keyword.trim(), location: loc, category, radius: distance || "10" });
                setTimeout(() => query.refetch(), 0);
              }}
            >
              Search
            </Button>
            <Button variant="secondary" onClick={() => {
              setKeyword(""); setDistance("10"); setCategory("default"); setLocation(""); setAutoDetect(false);
            }}>Clear</Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const loc = await geolocateBrowser();
                if (loc) {
                  // If loc is in lat,lon format, try to reverse geocode
                  const latLonMatch = loc.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
                  if (latLonMatch) {
                    try {
                      const lat = parseFloat(latLonMatch[1]);
                      const lon = parseFloat(latLonMatch[2]);
                      const result = await reverseGeocode(lat, lon);
                      setLocation(result.location || loc);
                    } catch {
                      setLocation(loc);
                    }
                  } else {
                    setLocation(loc);
                  }
                } else {
                  toast.error("Unable to access current location.");
                }
              }}
            >
              Use current location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <div className="space-y-6">
        {query.isFetching && (
          <div className="grid gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {/* Display all search results */}
        {searchResults.length > 0 && (
          <div className="space-y-8">
            {searchResults.map((result, resultIndex) => {
              const isCurrent = currentSearchKey === `${result.keyword}_${result.distance}_${result.category}_${result.location}`;
              return (
                <div key={`${result.keyword}_${result.distance}_${result.category}_${result.location}_${result.timestamp}`} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {result.keyword}
                        {isCurrent && query.isFetching && (
                          <span className="ml-2 text-sm text-muted-foreground">(Searching...)</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {categories.find(c => c.value === result.category)?.label || "All"} • {result.distance} miles • {result.location}
                      </p>
                    </div>
                    {!isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setKeyword(result.keyword);
                          setDistance(result.distance);
                          setCategory(result.category);
                          setLocation(result.location);
                          setAutoDetect(false);
                          setTimeout(() => query.refetch(), 0);
                        }}
                      >
                        Search Again
                      </Button>
                    )}
                  </div>

                  {result.events.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No records found</div>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <AnimatePresence>
                        {result.events.map((e) => (
                          <motion.div
                            key={e.id}
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-rose-500/30 hover:from-indigo-500/50 hover:via-purple-500/50 hover:to-rose-500/50 transition-colors"
                          >
                            <div className="rounded-2xl bg-card p-3 shadow-sm transition-all hover:shadow-lg hover:translate-y-[-2px]">
                              <div className="relative">
                                {e.icon ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={e.icon} alt="cover" className="h-40 w-full object-cover rounded-xl" />
                                ) : (
                                  <div className="h-40 w-full rounded-xl bg-muted" />
                                )}
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/30 to-transparent" />
                                <div className="absolute right-2 top-2">
                                  <FavoriteButton ev={e} mode="icon" />
                                </div>
                              </div>
                              <div className="mt-3 min-w-0">
                                <Link href={`/events/${encodeURIComponent(e.id)}`} className="font-semibold hover:underline line-clamp-2">
                                  {e.name}
                                </Link>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <div className="inline-flex items-center gap-1">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  <span className="line-clamp-1">{e.dateTime || "TBA"}</span>
                                </div>
                                <div className="inline-flex items-center gap-1">
                                  <Tag className="h-3.5 w-3.5" />
                                  <span className="line-clamp-1">{e.genre || "—"}</span>
                                </div>
                                <div className="inline-flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span className="line-clamp-1">{e.venue || "—"}</span>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                  <ShareButton title={e.name} url={typeof window !== "undefined" ? `${window.location.origin}/events/${encodeURIComponent(e.id)}` : ""} variant="secondary" />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Show message when no results and not searching */}
        {!query.isFetching && searchResults.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No search results yet. Enter a keyword and location to search for events.</p>
          </div>
        )}

        {/* Search Recommendations */}
        {searchResults.length > 0 && currentSearchKey && (
          <SearchRecommendations
            currentKeyword={searchResults.find(r => `${r.keyword}_${r.distance}_${r.category}_${r.location}` === currentSearchKey)?.keyword || ""}
            currentCategory={category}
            currentLocation={location}
            onSearch={(params) => {
              const newKeyword = params.keyword || keyword;
              const newCategory = params.category || category;
              const newLocation = params.location || location;
              
              if (params.keyword) setKeyword(params.keyword);
              if (params.category) setCategory(params.category);
              if (params.location) setLocation(params.location);
              
              addRecent({ 
                keyword: newKeyword.trim(), 
                location: newLocation.trim(), 
                category: newCategory, 
                radius: distance || "10" 
              });
              
              setTimeout(() => query.refetch(), 0);
            }}
          />
        )}
      </div>
    </div>
  );
}
