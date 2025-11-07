"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleAlert, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const queryClient = new QueryClient();

function HealthInner() {
  const [baseUrl] = useState(
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
  );

  const query = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const url = `${baseUrl}/api/health`;
      const start = Date.now();
      const { data } = await axios.get(url, { timeout: 10000 });
      const ms = Date.now() - start;
      return { data, ms } as { data: any; ms: number };
    },
    gcTime: 0,
    retry: 0,
  });

  return (
    <div className="container mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {query.isPending ? (
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : query.isError ? (
                <CircleAlert className="h-6 w-6 text-red-500" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              )}
              <div>
                <div className="text-sm font-medium">Backend</div>
                <div className="text-xs text-muted-foreground">{baseUrl}</div>
              </div>
            </div>
            <div>
              {query.isPending ? (
                <Badge variant="secondary">Checking…</Badge>
              ) : query.isError ? (
                <Badge className="bg-red-500 text-white hover:bg-red-600">Down</Badge>
              ) : (
                <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Operational</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground">Latency</div>
              <div className="mt-1 text-lg font-semibold">
                {query.isSuccess ? `${query.data.ms} ms` : "—"}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-muted-foreground">Checked at</div>
              <div className="mt-1 text-lg font-semibold">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          {query.isError && (
            <div className="text-sm text-red-600">
              Unable to reach the backend. Please ensure the server is running.
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => {
                query.refetch();
                toast("Refreshed");
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HealthPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <HealthInner />
    </QueryClientProvider>
  );
}


