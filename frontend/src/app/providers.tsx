"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { FavoritesProvider } from "@/contexts/favorites";

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <FavoritesProvider>
        {children}
      </FavoritesProvider>
    </QueryClientProvider>
  );
}


