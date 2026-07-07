import Link from "next/link";
import type { AdminConversationListItem } from "@/lib/adminConversations";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  conversationPersonLabel,
  conversationTitle,
  label,
  moderationVariant,
  statusVariant,
} from "./conversationUtils";

type AdminConversationListRowProps = {
  item: AdminConversationListItem;
  highlighted?: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export function AdminConversationListRow({ item, highlighted = false }: AdminConversationListRowProps) {
  const title = conversationTitle(item);
  const userLabel = conversationPersonLabel(item, "user");
  const preview = item.lastMessage?.preview?.trim() || "Fără mesaje încă";
  const timestamp = formatAdminDateTime(item.lastMessage?.createdAt || item.updatedAt);

  return (
    <Link
      href={`/admin/conversatii/${encodeURIComponent(item.conversationId)}`}
      className={cn(
        "flex items-start gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted/40",
        highlighted && "bg-primary/5 ring-1 ring-inset ring-primary/20"
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-medium text-muted-foreground">
        {initials(userLabel)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {item.bookingId ? `Booking ${item.bookingId}` : label(item.type)}
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{timestamp}</span>
        </div>

        <p className="mt-1 truncate text-sm text-muted-foreground">{preview}</p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant={statusVariant(item.status)}>{label(item.status)}</Badge>
          {item.moderationStatus !== "none" ? (
            <Badge variant={moderationVariant(item.moderationStatus)}>
              {label(item.moderationStatus)}
            </Badge>
          ) : null}
          {item.type === "booking" ? <Badge variant="outline">booking</Badge> : null}
        </div>
      </div>
    </Link>
  );
}
