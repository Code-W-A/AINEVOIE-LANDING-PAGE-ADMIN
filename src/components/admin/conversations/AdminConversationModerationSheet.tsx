"use client";

import { useEffect, useState } from "react";
import { Flag, Shield, ShieldOff } from "lucide-react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import type {
  AdminConversationDetail,
  ConversationModerationStatus,
} from "@/lib/adminConversations";
import { humanAdminLabel, humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { label, moderationStatuses } from "./conversationUtils";

type AdminConversationModerationSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  detail: AdminConversationDetail | null;
  onUpdated: () => Promise<void> | void;
};

export function AdminConversationModerationSheet({
  open,
  onOpenChange,
  conversationId,
  detail,
  onUpdated,
}: AdminConversationModerationSheetProps) {
  const [moderationStatus, setModerationStatus] = useState<ConversationModerationStatus>("none");
  const [moderationNote, setModerationNote] = useState("");
  const [participantReasons, setParticipantReasons] = useState<Record<string, string>>({});
  const [savingModeration, setSavingModeration] = useState(false);
  const [pendingParticipantUid, setPendingParticipantUid] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!detail) {
      return;
    }
    setModerationStatus(detail.item.moderationStatus || "none");
    setModerationNote(detail.item.moderationNote || "");
    setParticipantReasons({});
    setActionError(null);
  }, [detail, open]);

  async function saveModeration() {
    setSavingModeration(true);
    setActionError(null);

    try {
      const response = await adminFetch(
        `/api/admin/conversations/${encodeURIComponent(conversationId)}/moderation`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: moderationStatus,
            note: moderationNote,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await readAdminResponseError(response, "Nu am putut salva moderarea conversației.")
        );
      }

      await onUpdated();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Nu am putut salva moderarea conversației."
      );
    } finally {
      setSavingModeration(false);
    }
  }

  async function toggleParticipantBlock(participantUid: string, blockedAt: string | null) {
    setPendingParticipantUid(participantUid);
    setActionError(null);

    try {
      const shouldBlock = !blockedAt;
      const response = await adminFetch(
        `/api/admin/conversations/${encodeURIComponent(conversationId)}/participants/${encodeURIComponent(participantUid)}/block`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blocked: shouldBlock,
            reason: shouldBlock ? (participantReasons[participantUid] || "") : "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut actualiza participantul."));
      }

      await onUpdated();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nu am putut actualiza participantul.");
    } finally {
      setPendingParticipantUid(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Moderare conversație</SheetTitle>
          <SheetDescription>
            Actualizează statusul de moderare sau blochează un participant în această conversație.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-1">
          {actionError ? <p className="text-sm text-rose-500">{actionError}</p> : null}

          <div className="space-y-2">
            <p className="text-sm font-medium">Status moderare</p>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={moderationStatus}
              onChange={(event) => setModerationStatus(event.target.value as ConversationModerationStatus)}
              disabled={savingModeration}
            >
              {moderationStatuses.map((item) => (
                <option key={item} value={item}>
                  {label(item)}
                </option>
              ))}
            </select>
            <textarea
              className="min-h-[96px] w-full rounded-md border border-input bg-background p-3 text-sm"
              value={moderationNote}
              maxLength={2000}
              disabled={savingModeration}
              onChange={(event) => setModerationNote(event.target.value)}
              placeholder="Notă internă de moderare"
            />
            <Button type="button" onClick={() => void saveModeration()} disabled={savingModeration}>
              <Flag className="mr-2 h-4 w-4" />
              Salvează moderare
            </Button>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Participanți</p>
            {!detail || detail.participants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nu există membership-uri pentru această conversație.
              </p>
            ) : (
              detail.participants.map((participant) => {
                const isBlocked = Boolean(participant.blockedAt);
                const participantLabel =
                  participant.role === "provider"
                    ? humanProviderLabel({
                        displayName: participant.profile?.displayName || null,
                        email: participant.profile?.email || null,
                      })
                    : participant.role === "admin" || participant.role === "support"
                      ? humanAdminLabel({
                          displayName: participant.profile?.displayName || null,
                          email: participant.profile?.email || null,
                        })
                      : humanUserLabel({
                          displayName: participant.profile?.displayName || null,
                          email: participant.profile?.email || null,
                        });

                return (
                  <div key={participant.membershipId} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {participantLabel}
                          <span className="ml-1 text-muted-foreground">
                            ({participant.uid} · {participant.role})
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          unread: {participant.unreadCount} · last:{" "}
                          {formatAdminDateTime(participant.lastMessageAt)}
                        </p>
                        {isBlocked ? (
                          <p className="text-xs text-rose-600">
                            blocked {formatAdminDateTime(participant.blockedAt)}
                          </p>
                        ) : null}
                      </div>
                      <Badge variant={isBlocked ? "danger" : "outline"}>
                        {isBlocked ? "blocked" : "active"}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 md:flex-row">
                      <Input
                        placeholder="Reason"
                        value={participantReasons[participant.uid] || ""}
                        onChange={(event) =>
                          setParticipantReasons((current) => ({
                            ...current,
                            [participant.uid]: event.target.value,
                          }))
                        }
                        disabled={pendingParticipantUid === participant.uid}
                      />
                      <Button
                        type="button"
                        variant={isBlocked ? "outline" : "destructive"}
                        onClick={() =>
                          void toggleParticipantBlock(participant.uid, participant.blockedAt)
                        }
                        disabled={pendingParticipantUid === participant.uid}
                      >
                        {isBlocked ? (
                          <>
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Unblock
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Block
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
