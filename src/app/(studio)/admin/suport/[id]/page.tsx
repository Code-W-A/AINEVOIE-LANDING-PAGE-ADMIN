"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminPageHeaderSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import {
  buildTicketDraft,
  type SupportTicketItem,
  type TicketDraft,
} from "@/lib/adminSupportTicketDetail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SupportTicketActivityCard } from "./components/SupportTicketActivityCard";
import { SupportTicketDetailHeader } from "./components/SupportTicketDetailHeader";
import { SupportTicketNotesCard } from "./components/SupportTicketNotesCard";
import { SupportTicketProblemCard } from "./components/SupportTicketProblemCard";
import { SupportTicketSidebar } from "./components/SupportTicketSidebar";
import { SupportTicketUpdateCard } from "./components/SupportTicketUpdateCard";

type SupportTicketDetailResponse = {
  item?: SupportTicketItem;
};

function buildPatchBody(draft: TicketDraft) {
  return {
    status: draft.status,
    priority: draft.priority,
    assignedAdminUid: draft.assignedAdminUid.trim() || null,
    adminNote: draft.adminNote,
    relatedEntity: draft.relatedEntityId.trim()
      ? {
        bookingId: draft.relatedEntityType === "booking" ? draft.relatedEntityId.trim() : null,
        providerId: draft.relatedEntityType === "provider" ? draft.relatedEntityId.trim() : null,
        userId: draft.relatedEntityType === "user" ? draft.relatedEntityId.trim() : null,
      }
      : null,
  };
}

export default function AdminSupportTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = decodeURIComponent(params.id || "");
  const endpoint = useMemo(
    () => `/api/admin/support-tickets/${encodeURIComponent(ticketId)}`,
    [ticketId]
  );
  const { data, loading, error, reload } = useAdminData<SupportTicketDetailResponse>(endpoint);
  const item = data?.item;

  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [draft, setDraft] = useState<TicketDraft | null>(null);

  useEffect(() => {
    if (!item) {
      return;
    }
    setDraft(buildTicketDraft(item));
  }, [item]);

  async function saveTicket(nextDraft?: TicketDraft) {
    const payload = nextDraft || draft;
    if (!payload || !item?.ticketId) {
      return;
    }

    setPending(true);
    setActionError(null);
    try {
      const response = await adminFetch(`/api/admin/support-tickets/${encodeURIComponent(item.ticketId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPatchBody(payload)),
      });

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut actualiza tichetul."));
      }

      await reload();
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "Nu am putut actualiza tichetul.");
    } finally {
      setPending(false);
    }
  }

  function handleMarkResolved() {
    if (!draft) {
      return;
    }
    void saveTicket({ ...draft, status: "resolved" });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeaderSkeleton />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item || !draft) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/suport">Înapoi la suport</Link>
        </Button>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-rose-500">
              {error || "Tichetul nu a fost găsit."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SupportTicketDetailHeader
        item={item}
        pending={pending}
        onMarkResolved={handleMarkResolved}
      />

      {actionError ? <p className="text-sm text-rose-500">{actionError}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <div className="space-y-4">
          <SupportTicketProblemCard item={item} />
          <SupportTicketActivityCard item={item} />
          {item.adminNote?.trim() ? (
            <SupportTicketNotesCard adminNote={item.adminNote} />
          ) : null}
          <SupportTicketUpdateCard
            draft={draft}
            pending={pending}
            ticketStatus={item.status}
            onDraftChange={(updater) => setDraft((current) => (current ? updater(current) : current))}
            onSave={() => void saveTicket()}
            onMarkResolved={handleMarkResolved}
          />
        </div>

        <SupportTicketSidebar item={item} />
      </div>
    </div>
  );
}
