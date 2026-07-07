"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCcw, Search } from "lucide-react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminConversationListRow } from "@/components/admin/conversations/AdminConversationListRow";
import {
  conversationStatuses,
  conversationTypes,
  label,
  moderationStatuses,
  normalizeModerationStatus,
} from "@/components/admin/conversations/conversationUtils";
import { AdminEntityLookup } from "@/components/admin/AdminEntityLookup";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import type { AdminConversationListItem } from "@/lib/adminConversations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ConversationListResponse = {
  items: AdminConversationListItem[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export default function AdminConversationsPage() {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const urlConversationId = urlSearchParams.get("conversationId")?.trim() || "";
  const urlModerationStatus = normalizeModerationStatus(urlSearchParams.get("moderationStatus"));

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [moderationStatus, setModerationStatus] = useState(
    urlModerationStatus === "all" ? "all" : urlModerationStatus
  );
  const [userId, setUserId] = useState("");
  const [providerId, setProviderId] = useState("");

  const [items, setItems] = useState<AdminConversationListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlConversationId) {
      router.replace(`/admin/conversatii/${encodeURIComponent(urlConversationId)}`);
    }
  }, [router, urlConversationId]);

  useEffect(() => {
    if (urlModerationStatus !== "all") {
      setModerationStatus(urlModerationStatus);
    }
  }, [urlModerationStatus]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "20");
    if (debouncedQ) params.set("q", debouncedQ);
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);
    if (moderationStatus !== "all") params.set("moderationStatus", moderationStatus);
    if (userId.trim()) params.set("userId", userId.trim());
    if (providerId.trim()) params.set("providerId", providerId.trim());
    return params;
  }, [debouncedQ, moderationStatus, providerId, status, type, userId]);

  const baseEndpoint = useMemo(
    () => `/api/admin/conversations?${searchParams.toString()}`,
    [searchParams]
  );

  useEffect(() => {
    void loadConversations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseEndpoint]);

  async function loadConversations(reset: boolean) {
    setLoadingMore(true);
    if (reset) {
      setError(null);
    }

    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("limit", "20");
      if (!reset && nextCursor) {
        params.set("cursor", nextCursor);
      }

      const response = await adminFetch(`/api/admin/conversations?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut încărca conversațiile."));
      }

      const payload = (await response.json()) as ConversationListResponse;
      const loadedItems = Array.isArray(payload.items) ? payload.items : [];

      setItems((current) => {
        if (reset) {
          return loadedItems;
        }

        const seen = new Set(current.map((item) => item.conversationId));
        const merged = [...current];
        loadedItems.forEach((item) => {
          if (!seen.has(item.conversationId)) {
            merged.push(item);
            seen.add(item.conversationId);
          }
        });
        return merged;
      });

      setNextCursor(payload.page?.nextCursor || null);
      setHasMore(Boolean(payload.page?.hasMore));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nu am putut încărca conversațiile.";
      if (reset) {
        setError(message);
        setItems([]);
        setNextCursor(null);
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  if (urlConversationId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Conversații</h1>
        <p className="text-sm text-muted-foreground">Se deschide conversația...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Conversații</h1>
        <p className="text-sm text-muted-foreground">
          Listă de conversații. Selectează una pentru a vedea chatul complet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
          <CardDescription>
            Caută după nume, email, booking sau ID conversație.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Căutare conversație"
              value={q}
              disabled={loadingMore}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={loadingMore}
          >
            {conversationStatuses.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Toate statusurile" : label(item)}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={type}
            onChange={(event) => setType(event.target.value)}
            disabled={loadingMore}
          >
            {conversationTypes.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Toate tipurile" : label(item)}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={moderationStatus}
            onChange={(event) => setModerationStatus(event.target.value)}
            disabled={loadingMore}
          >
            <option value="all">Toate moderările</option>
            {moderationStatuses.map((item) => (
              <option key={item} value={item}>
                {label(item)}
              </option>
            ))}
          </select>

          <AdminEntityLookup
            value={userId}
            entityType="user"
            disabled={loadingMore}
            placeholder="User"
            onValueChange={(nextValue) => setUserId(nextValue)}
          />

          <AdminEntityLookup
            value={providerId}
            entityType="provider"
            disabled={loadingMore}
            placeholder="Provider"
            onValueChange={(nextValue) => setProviderId(nextValue)}
          />

          <Button
            type="button"
            variant="outline"
            className="md:col-span-2"
            onClick={() => {
              void loadConversations(true);
            }}
            disabled={loadingMore}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh manual
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listă conversații</CardTitle>
          <CardDescription>
            {items.length} conversații încărcate
            {hasMore ? " · mai multe disponibile" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error ? <p className="px-4 py-3 text-sm text-rose-500">{error}</p> : null}

          {loadingMore && items.length === 0 ? (
            <div className="p-4">
              <AdminTableSkeleton rows={8} columns={1} />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-sm text-muted-foreground">
                  Nu există conversații pentru filtrele selectate.
                </p>
              ) : (
                items.map((item) => (
                  <AdminConversationListRow key={item.conversationId} item={item} />
                ))
              )}
            </div>
          )}

          {hasMore ? (
            <div className="border-t border-border p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadConversations(false)}
                disabled={loadingMore}
              >
                Load more
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
