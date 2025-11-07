"use client";

import { useState } from "react";
import { useFavorites } from "@/contexts/favorites";
import type { MappedEvent } from "@/types/tm";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FIRST_FAVORITE_KEY = "tmv2:first_favorite_shown";

export default function FavoriteButton({ ev, mode = "button" }: { ev: MappedEvent; mode?: "button" | "icon" }) {
  const { isFavorite, toggle } = useFavorites();
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const fav = isFavorite(ev.id);

  const handleToggle = () => {
    const wasFavorite = fav;
    toggle(ev);

    // If this is the first time adding a favorite, show info dialog
    if (!wasFavorite) {
      const hasShownBefore = localStorage.getItem(FIRST_FAVORITE_KEY);
      if (!hasShownBefore) {
        setShowInfoDialog(true);
        localStorage.setItem(FIRST_FAVORITE_KEY, "true");
      }
    }
  };

  if (mode === "icon") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          onClick={handleToggle}
          className={fav ? "text-rose-500" : "text-muted-foreground"}
        >
          <Heart className={`h-5 w-5 ${fav ? "fill-rose-500" : ""}`} />
        </Button>
        <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Favorites Saved Locally</DialogTitle>
              <DialogDescription>
                Your favorites are stored in your browser's local storage. They will be available only on this device and browser. If you clear your browser data, your favorites will be removed.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Button onClick={() => setShowInfoDialog(false)} className="w-full">
                Got it
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button variant={fav ? "default" : "secondary"} size="sm" onClick={handleToggle}>
        <Heart className={`mr-2 h-4 w-4 ${fav ? "fill-current" : ""}`} />
        {fav ? "Saved" : "Save"}
      </Button>
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Favorites Saved Locally</DialogTitle>
            <DialogDescription>
              Your favorites are stored in your browser's local storage. They will be available only on this device and browser. If you clear your browser data, your favorites will be removed.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button onClick={() => setShowInfoDialog(false)} className="w-full">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
