"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { MappedEvent } from "@/types/tm";

type FavoritesContextValue = {
  items: Record<string, MappedEvent>;
  isFavorite: (id: string) => boolean;
  toggle: (ev: MappedEvent) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);
const LS_KEY = "tmv2:favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Record<string, MappedEvent>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const isFavorite = useCallback((id: string) => !!items[id], [items]);

  const toggle = useCallback((ev: MappedEvent) => {
    setItems(prev => {
      const next = { ...prev };
      if (next[ev.id]) delete next[ev.id];
      else next[ev.id] = ev;
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => setItems(prev => {
    const next = { ...prev }; delete next[id]; return next;
  }), []);

  const clear = useCallback(() => setItems({}), []);

  const value = useMemo(() => ({ items, isFavorite, toggle, remove, clear }), [items, isFavorite, toggle, remove, clear]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
