"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";

export function useAdminData<T>(endpoint: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await adminFetch(endpoint, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(await readAdminResponseError(res, "Cererea a eșuat"));
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut încărca datele.");
    } finally {
      setLoading(false);
    }
  }, [enabled, endpoint]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    reload();
  }, [enabled, reload]);

  return { data, loading, error, reload };
}
