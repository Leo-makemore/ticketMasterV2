"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share2 } from "lucide-react";

export default function ShareButton({ title, url, variant = "ghost" }: { title: string; url: string; variant?: "ghost" | "secondary" | "default" }) {
  async function onShare() {
    try {
      const link = url || window.location.href;
      if (navigator.share) {
        await navigator.share({ title, url: link });
      } else {
        await navigator.clipboard.writeText(link);
        toast.success("Link copied to clipboard");
      }
    } catch {}
  }
  return (
    <Button variant={variant} size="sm" className="gap-2" onClick={onShare}>
      <Share2 className="h-4 w-4" /> Share
    </Button>
  );
}


