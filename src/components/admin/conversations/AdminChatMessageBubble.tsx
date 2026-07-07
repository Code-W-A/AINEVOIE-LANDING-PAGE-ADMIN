import type { AdminConversationMessageItem } from "@/lib/adminConversations";
import { cn } from "@/lib/utils";
import {
  formatChatTime,
  isProviderSideMessage,
  messageSenderLabel,
} from "./conversationUtils";

type AdminChatMessageBubbleProps = {
  message: AdminConversationMessageItem;
  searchQuery?: string;
};

function highlightText(text: string, query: string) {
  if (!query.trim()) {
    return text;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(normalizedQuery);

  if (index === -1) {
    return text;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + normalizedQuery.length);
  const after = text.slice(index + normalizedQuery.length);

  return (
    <>
      {before}
      <mark className="rounded bg-amber-200/80 px-0.5 text-inherit">{match}</mark>
      {after}
    </>
  );
}

export function AdminChatMessageBubble({ message, searchQuery = "" }: AdminChatMessageBubbleProps) {
  const isProvider = isProviderSideMessage(message);
  const isDeleted = message.status === "deleted";
  const isEdited = message.status === "edited";
  const senderLabel = messageSenderLabel(message);
  const body = isDeleted ? "Mesaj șters" : message.body || "-";

  return (
    <div className={cn("flex flex-col gap-1", isProvider ? "items-end" : "items-start")}>
      <p className="px-1 text-xs text-muted-foreground">{senderLabel}</p>
      <div
        className={cn(
          "max-w-[min(82%,640px)] rounded-2xl border px-3 py-2 text-sm shadow-sm",
          isProvider
            ? "rounded-br-md border-primary/20 bg-primary/10"
            : "rounded-bl-md border-border bg-card",
          isDeleted && "italic text-muted-foreground"
        )}
      >
        {highlightText(body, searchQuery)}
      </div>
      <div className={cn("flex items-center gap-2 px-1 text-xs text-muted-foreground", isProvider && "flex-row-reverse")}>
        <span>{formatChatTime(message.createdAt)}</span>
        {isEdited && !isDeleted ? <span>(editat)</span> : null}
      </div>
    </div>
  );
}
