"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { AdminConversationMessageItem } from "@/lib/adminConversations";
import { Button } from "@/components/ui/button";
import { AdminChatMessageBubble } from "./AdminChatMessageBubble";
import { messageSenderLabel } from "./conversationUtils";

type AdminChatThreadProps = {
  messages: AdminConversationMessageItem[];
  loading: boolean;
  hasMore: boolean;
  searchQuery: string;
  onLoadOlder: () => void;
};

function sortMessagesChronologically(items: AdminConversationMessageItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    return left.messageId.localeCompare(right.messageId);
  });
}

export function AdminChatThread({
  messages,
  loading,
  hasMore,
  searchQuery,
  onLoadOlder,
}: AdminChatThreadProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollRef = useRef<{ height: number; top: number } | null>(null);
  const initialScrollDoneRef = useRef(false);

  const chronologicalMessages = useMemo(
    () => sortMessagesChronologically(messages),
    [messages]
  );

  const visibleMessages = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return chronologicalMessages;
    }

    return chronologicalMessages.filter((message) => {
      const body = (message.body || "").toLowerCase();
      const sender = messageSenderLabel(message).toLowerCase();
      return body.includes(normalizedQuery) || sender.includes(normalizedQuery);
    });
  }, [chronologicalMessages, searchQuery]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !pendingScrollRef.current) {
      return;
    }

    const previous = pendingScrollRef.current;
    const heightDelta = container.scrollHeight - previous.height;
    container.scrollTop = previous.top + heightDelta;
    pendingScrollRef.current = null;
  }, [messages.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || loading || initialScrollDoneRef.current) {
      return;
    }

    if (messages.length > 0) {
      container.scrollTop = container.scrollHeight;
      initialScrollDoneRef.current = true;
    }
  }, [loading, messages.length]);

  useEffect(() => {
    initialScrollDoneRef.current = false;
    pendingScrollRef.current = null;
  }, [searchQuery]);

  function handleLoadOlder() {
    const container = containerRef.current;
    if (container) {
      pendingScrollRef.current = {
        height: container.scrollHeight,
        top: container.scrollTop,
      };
    }
    onLoadOlder();
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4">
      {hasMore ? (
        <div className="mb-4 flex justify-center">
          <Button type="button" variant="outline" size="sm" onClick={handleLoadOlder} disabled={loading}>
            {loading ? "Se încarcă..." : "Mesaje mai vechi"}
          </Button>
        </div>
      ) : null}

      {loading && messages.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={`h-16 max-w-[60%] animate-pulse rounded-2xl bg-muted ${index % 2 === 0 ? "" : "ml-auto"}`}
            />
          ))}
        </div>
      ) : null}

      {!loading && visibleMessages.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {searchQuery.trim()
            ? "Niciun mesaj nu corespunde căutării."
            : "Nu există mesaje în această conversație."}
        </p>
      ) : null}

      <div className="space-y-4">
        {visibleMessages.map((message) => (
          <AdminChatMessageBubble key={message.messageId} message={message} searchQuery={searchQuery} />
        ))}
      </div>
    </div>
  );
}
