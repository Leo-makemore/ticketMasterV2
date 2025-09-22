"use client";

import { useFavorites } from "@/contexts/favorites";
import type { MappedEvent } from "@/types/tm";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export default function FavoriteButton({ ev, mode = "button" }: { ev: MappedEvent; mode?: "button" | "icon" }) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(ev.id);
  if (mode === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
        onClick={() => toggle(ev)}
        className={fav ? "text-rose-500" : "text-muted-foreground"}
      >
        <Heart className={`h-5 w-5 ${fav ? "fill-rose-500" : ""}`} />
      </Button>
    );
  }
  return (
    <Button variant={fav ? "default" : "secondary"} size="sm" onClick={() => toggle(ev)}>
      <Heart className={`mr-2 h-4 w-4 ${fav ? "fill-current" : ""}`} />
      {fav ? "Saved" : "Save"}
    </Button>
  );
}
