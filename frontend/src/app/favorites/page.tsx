"use client";

import { useFavorites } from "@/contexts/favorites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FavoritesPage() {
  const { items, remove, clear } = useFavorites();
  const list = Object.values(items);
  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Favorites</h1>
        {list.length > 0 && <Button variant="secondary" onClick={clear}>Clear All</Button>}
      </div>
      {list.length === 0 ? (
        <div className="text-sm text-muted-foreground">No favorites yet.</div>
      ) : (
        <div className="grid gap-4">
          {list.map(ev => (
            <Card key={ev.id}>
              <CardHeader>
                <CardTitle className="text-base">{ev.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm">
                  <div>{ev.dateTime}</div>
                  <div className="text-muted-foreground">{ev.venue}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/events/${encodeURIComponent(ev.id)}`} className="underline">Details</Link>
                  <Button variant="secondary" size="sm" onClick={() => remove(ev.id)}>Remove</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
