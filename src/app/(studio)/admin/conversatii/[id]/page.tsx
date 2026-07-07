"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminChatHeader } from "@/components/admin/conversations/AdminChatHeader";
import { AdminChatThread } from "@/components/admin/conversations/AdminChatThread";
import { AdminConversationModerationSheet } from "@/components/admin/conversations/AdminConversationModerationSheet";
import type {
  AdminConversationDetail,
  AdminConversationMessageItem,
} from "@/lib/adminConversations";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ConversationMessagesResponse = {
  items: AdminConversationMessageItem[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export default function AdminConversationChatPage() {
  const params = useParams<{ id: string }>();
  const conversationId = decodeURIComponent(params.id || "").trim();

  const [detail, setDetail] = useState<AdminConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [messages, setMessages] = useState<AdminConversationMessageItem[]>([]);
  const [messagesCursor, setMessagesCursor] = useState<string | null>(null);
  const [messagesHasMore, setMessagesHasMore] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [messageSearch, setMessageSearch] = useState("");
  const [moderationOpen, setModerationOpen] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!conversationId) {
      setDetail(null);
      setDetailError("Conversația nu a fost găsită.");
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    setDetailError(null);

    try {
      const response = await adminFetch(
        `/api/admin/conversations/${encodeURIComponent(conversationId)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut încărca conversația."));
      }

      const payload = (await response.json()) as AdminConversationDetail;
      setDetail(payload);
    } catch (err) {
      setDetail(null);
      setDetailError(err instanceof Error ? err.message : "Nu am putut încărca conversația.");
    } finally {
      setDetailLoading(false);
    }
  }, [conversationId]);

  const loadMessages = useCallback(
    async (reset: boolean) => {
      if (!conversationId) {
        return;
      }

      setMessagesLoading(true);
      setMessagesError(null);

      try {
        const params = new URLSearchParams();
        params.set("limit", "30");
        if (!reset && messagesCursor) {
          params.set("cursor", messagesCursor);
        }

        const response = await adminFetch(
          `/api/admin/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(await readAdminResponseError(response, "Nu am putut încărca mesajele."));
        }

        const payload = (await response.json()) as ConversationMessagesResponse;
        const loadedItems = Array.isArray(payload.items) ? payload.items : [];

        setMessages((current) => {
          if (reset) {
            return loadedItems;
          }

          const seen = new Set(current.map((item) => item.messageId));
          const merged = [...current];
          loadedItems.forEach((item) => {
            if (!seen.has(item.messageId)) {
              merged.push(item);
              seen.add(item.messageId);
            }
          });
          return merged;
        });
        setMessagesCursor(payload.page?.nextCursor || null);
        setMessagesHasMore(Boolean(payload.page?.hasMore));
      } catch (err) {
        setMessagesError(err instanceof Error ? err.message : "Nu am putut încărca mesajele.");
        if (reset) {
          setMessages([]);
          setMessagesCursor(null);
          setMessagesHasMore(false);
        }
      } finally {
        setMessagesLoading(false);
      }
    },
    [conversationId, messagesCursor]
  );

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    setMessages([]);
    setMessagesCursor(null);
    setMessagesHasMore(false);
    setMessagesError(null);
    setMessageSearch("");

    if (!conversationId) {
      return;
    }

    void loadMessages(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function handleRefreshDetail() {
    await loadDetail();
  }

  function handleLoadOlder() {
    void loadMessages(false);
  }

  if (!conversationId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Conversație</h1>
        <p className="text-sm text-rose-500">ID conversație invalid.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[560px] flex-col">
      {detailLoading && !detail ? (
        <div className="space-y-4">
          <div className="h-16 animate-pulse rounded-md bg-muted" />
          <div className="flex-1 animate-pulse rounded-md bg-muted" />
        </div>
      ) : null}

      {detailError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {detailError}
        </div>
      ) : null}

      {detail ? (
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AdminChatHeader item={detail.item} onOpenModeration={() => setModerationOpen(true)} />

          <div className="border-b border-border px-4 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Caută în mesaje..."
                value={messageSearch}
                onChange={(event) => setMessageSearch(event.target.value)}
              />
            </div>
          </div>

          {messagesError ? (
            <p className="px-4 py-2 text-sm text-rose-500">{messagesError}</p>
          ) : null}

          <AdminChatThread
            messages={messages}
            loading={messagesLoading}
            hasMore={messagesHasMore}
            searchQuery={messageSearch}
            onLoadOlder={handleLoadOlder}
          />
        </Card>
      ) : null}

      <AdminConversationModerationSheet
        open={moderationOpen}
        onOpenChange={setModerationOpen}
        conversationId={conversationId}
        detail={detail}
        onUpdated={handleRefreshDetail}
      />
    </div>
  );
}
