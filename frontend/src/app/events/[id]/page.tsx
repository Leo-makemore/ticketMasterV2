"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEventDetails, fetchVenue } from "@/lib/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { motion } from "framer-motion";
import ShareButton from "@/components/common/ShareButton";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 text-sm">
      <div className="text-muted-foreground font-medium">{label}</div>
      <div>{children}</div>
    </div>
  );
}

export default function EventDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const details = useQuery({
    queryKey: ["event", id],
    enabled: !!id,
    queryFn: async () => await fetchEventDetails(id as string),
  });

  const venueName = details.data?._embedded?.venues?.[0]?.name as string | undefined;
  const venue = useQuery({
    queryKey: ["venue", venueName],
    enabled: !!venueName,
    queryFn: async () => await fetchVenue(venueName as string),
  });

  if (details.isLoading) {
    return (
      <div className="container mx-auto max-w-5xl p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (details.isError || !details.data) {
    return <div className="container mx-auto p-6">Failed to load details.</div>;
  }

  const d = details.data;
  const title = d?.name || "Event";
  const start = d?.dates?.start || {};
  const dateStr = [start.localDate || "", start.localTime || ""].filter(Boolean).join(" ");
  const seatUrl = d?.seatmap?.staticUrl as string | undefined;
  const buyUrl = d?.url as string | undefined;

  return (
    <motion.div
      className="container mx-auto max-w-5xl p-6 space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>{title}</CardTitle>
            {d?.id && (
              <div className="flex items-center gap-2">
                <ShareButton title={title} url={typeof window !== "undefined" ? window.location.href : ""} />
                <FavoriteButton ev={{
                  id: d.id,
                  name: d.name || "",
                  dateTime: [start.localDate || "", start.localTime || ""].filter(Boolean).join(" "),
                  genre: "",
                  venue: d?._embedded?.venues?.[0]?.name || "",
                  icon: (Array.isArray(d?.images) && d.images[0]?.url) || "",
                }} />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {dateStr && <Field label="Date">{dateStr}</Field>}
            {d?._embedded?.attractions && (
              <Field label="Artist / Team">
                {(d._embedded.attractions as any[]).map((a, i) => {
                  const n = a?.name || "";
                  const u = a?.url || "";
                  return (
                    <span key={i} className="mr-1">
                      {u ? (
                        <a href={u} target="_blank" rel="noopener" className="underline">
                          {n}
                        </a>
                      ) : (
                        n
                      )}
                      {i < (d._embedded.attractions.length - 1) ? " | " : ""}
                    </span>
                  );
                })}
              </Field>
            )}
            {buyUrl && (
              <Field label="Buy Ticket At">
                <a href={buyUrl} target="_blank" rel="noopener" className="underline">Ticketmaster</a>
              </Field>
            )}
          </div>
          <div>
            {seatUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seatUrl} alt="Seat Map" className="rounded border" />
            ) : (
              <div className="text-sm text-muted-foreground">No seat map.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Venue Details</CardTitle>
        </CardHeader>
        <CardContent>
          {venue.isLoading && <Skeleton className="h-24 w-full" />}
          {venue.isError && <div className="text-sm text-muted-foreground">No venue details found.</div>}
          {venue.isSuccess && (() => {
            const v = venue.data?._embedded?.venues?.[0];
            if (!v) return <div className="text-sm text-muted-foreground">No venue details found.</div>;
            const name = v.name || "N/A";
            const line1 = v.address?.line1 || "N/A";
            const postal = v.postalCode || "N/A";
            const city = v.city?.name || "";
            const state = v.state?.stateCode || "";
            const url = v.url || "";
            const queryText = [name, line1, city, state, postal].filter(Boolean).join(", ");
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryText)}`;
            return (
              <div className="grid gap-2">
                <Field label="Name">{name}</Field>
                <Field label="Address">{line1}</Field>
                <Field label="City">{[city, state].filter(Boolean).join(", ")}</Field>
                <Field label="Postal Code">{postal}</Field>
                <Field label="Upcoming Events">{url ? <a href={url} target="_blank" rel="noopener" className="underline">More events</a> : "N/A"}</Field>
                <Field label="Open in Maps"><a href={mapsUrl} target="_blank" rel="noopener" className="underline">View on Google Maps</a></Field>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </motion.div>
  );
}
