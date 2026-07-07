import Link from "next/link";
import { ArrowLeft, Flag } from "lucide-react";
import type { AdminConversationListItem } from "@/lib/adminConversations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  conversationPersonLabel,
  conversationTitle,
  label,
  moderationVariant,
  statusVariant,
} from "./conversationUtils";

type AdminChatHeaderProps = {
  item: AdminConversationListItem;
  onOpenModeration: () => void;
};

export function AdminChatHeader({ item, onOpenModeration }: AdminChatHeaderProps) {
  const title = conversationTitle(item);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/admin/conversatii" aria-label="Înapoi la listă">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={statusVariant(item.status)}>{label(item.status)}</Badge>
            {item.moderationStatus !== "none" ? (
              <Badge variant={moderationVariant(item.moderationStatus)}>
                {label(item.moderationStatus)}
              </Badge>
            ) : null}
            {item.userId ? (
              <Link className="hover:text-primary hover:underline" href={`/admin/utilizatori/${encodeURIComponent(item.userId)}`}>
                {conversationPersonLabel(item, "user")}
              </Link>
            ) : null}
            {item.providerId ? (
              <>
                <span>·</span>
                <Link className="hover:text-primary hover:underline" href={`/admin/prestatori/${encodeURIComponent(item.providerId)}`}>
                  {conversationPersonLabel(item, "provider")}
                </Link>
              </>
            ) : null}
            {item.bookingId ? (
              <>
                <span>·</span>
                <Link className="hover:text-primary hover:underline" href={`/admin/programari/${encodeURIComponent(item.bookingId)}`}>
                  Booking {item.bookingId}
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onOpenModeration}>
        <Flag className="mr-2 h-4 w-4" />
        Moderare
      </Button>
    </div>
  );
}
