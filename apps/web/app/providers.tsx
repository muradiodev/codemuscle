"use client";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { UserSettings } from "@codemuscle/shared";
import { api } from "../lib/api";
import { applyDocumentTheme, resolveTheme, type ThemePreference } from "../lib/theme";

function ThemeSync({ children }: { children: React.ReactNode }) {
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<UserSettings>("/settings"),
    retry: 1
  });

  useEffect(() => {
    const preference = (settings.data?.theme ?? "dark") as ThemePreference;
    const media = window.matchMedia("(prefers-color-scheme: light)");

    const apply = () => {
      applyDocumentTheme(resolveTheme(preference, media.matches));
    };

    apply();
    if (preference !== "system") return;

    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings.data?.theme]);

  return children;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
      })
  );

  return (
    <QueryClientProvider client={client}>
      <ThemeSync>{children}</ThemeSync>
    </QueryClientProvider>
  );
}
