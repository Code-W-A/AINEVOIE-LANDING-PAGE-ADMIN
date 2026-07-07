import { humanAdminLabel } from "@/lib/adminHumanize";
import {
  formatSupportTicketStatusLabel,
} from "@/lib/adminSupportTicketLabels";

export type SupportTicketStatus = "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export type SupportTicketItem = {
  ticketId: string;
  topic: string;
  subject: string;
  initialMessage: string;
  status: SupportTicketStatus | string;
  priority: SupportTicketPriority | string;
  requesterUid: string;
  requesterRole: "user" | "provider" | string;
  requester: {
    uid: string;
    role: string;
    displayName: string | null;
    email: string | null;
  };
  assignedAdminUid: string | null;
  assignedAdminSnapshot: {
    displayName: string | null;
    email: string | null;
    role: string | null;
  } | null;
  adminNote: string | null;
  relatedEntity: {
    bookingId: string | null;
    providerId: string | null;
    userId: string | null;
  } | null;
  relatedBooking?: {
    bookingId: string;
    status: string | null;
    scheduledStartAt: string | null;
  } | null;
  relatedUser?: {
    userId: string;
    displayName: string | null;
    email: string | null;
  } | null;
  relatedProvider?: {
    providerId: string;
    displayName: string | null;
    email: string | null;
  } | null;
  slaAgeMinutes: number;
  updatedAt: string | null;
  createdAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
};

export type SupportTicketTimelineEvent = {
  id: string;
  title: string;
  at: string | null;
};

export type TicketDraft = {
  status: string;
  priority: string;
  assignedAdminUid: string;
  adminNote: string;
  relatedEntityType: "booking" | "provider" | "user";
  relatedEntityId: string;
};

export const SUPPORT_TICKET_STATUSES: SupportTicketStatus[] = [
  "open",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed",
];

export const SUPPORT_TICKET_PRIORITIES: SupportTicketPriority[] = [
  "low",
  "normal",
  "high",
  "urgent",
];

function readString(value: unknown) {
  return String(value || "").trim();
}

function toMillis(value: string | null | undefined) {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function supportTicketStatusVariant(status: string) {
  if (status === "open") return "warning" as const;
  if (status === "in_progress") return "default" as const;
  if (status === "waiting_user") return "outline" as const;
  if (status === "resolved") return "success" as const;
  if (status === "closed") return "secondary" as const;
  return "outline" as const;
}

export function supportTicketPriorityVariant(priority: string) {
  if (priority === "urgent") return "danger" as const;
  if (priority === "high") return "warning" as const;
  if (priority === "normal") return "outline" as const;
  return "secondary" as const;
}

export function isSupportTicketClosed(status?: string | null) {
  const normalized = readString(status);
  return normalized === "resolved" || normalized === "closed";
}

export function detectRelatedEntityType(item?: SupportTicketItem) {
  if (item?.relatedEntity?.providerId) return "provider" as const;
  if (item?.relatedEntity?.userId) return "user" as const;
  return "booking" as const;
}

export function getSupportTicketRequesterHref(item: SupportTicketItem) {
  const uid = readString(item.requesterUid);
  if (!uid) {
    return null;
  }
  if (item.requesterRole === "provider") {
    return `/admin/prestatori/${encodeURIComponent(uid)}`;
  }
  return `/admin/utilizatori/${encodeURIComponent(uid)}`;
}

export function hasSupportTicketRelatedEntities(item: SupportTicketItem) {
  return Boolean(
    item.relatedEntity?.bookingId
    || item.relatedEntity?.providerId
    || item.relatedEntity?.userId
  );
}

export function buildTicketDraft(item: SupportTicketItem): TicketDraft {
  return {
    status: item.status,
    priority: item.priority,
    assignedAdminUid: item.assignedAdminUid || "",
    adminNote: item.adminNote || "",
    relatedEntityType: detectRelatedEntityType(item),
    relatedEntityId:
      item.relatedEntity?.bookingId
      || item.relatedEntity?.providerId
      || item.relatedEntity?.userId
      || "",
  };
}

export function buildSupportTicketTimelineEvents(item: SupportTicketItem): SupportTicketTimelineEvent[] {
  const events: SupportTicketTimelineEvent[] = [];

  if (item.closedAt) {
    events.push({
      id: "closed",
      title: "Tichet închis",
      at: item.closedAt,
    });
  }

  if (item.resolvedAt) {
    events.push({
      id: "resolved",
      title: "Marcat rezolvat",
      at: item.resolvedAt,
    });
  }

  if (item.updatedAt && item.updatedAt !== item.createdAt) {
    events.push({
      id: "updated",
      title: "Ultima actualizare",
      at: item.updatedAt,
    });
  }

  if (item.assignedAdminUid) {
    events.push({
      id: "assignee",
      title: `Responsabil: ${humanAdminLabel({
        displayName: item.assignedAdminSnapshot?.displayName,
        email: item.assignedAdminSnapshot?.email,
      })}`,
      at: item.updatedAt || item.createdAt,
    });
  } else {
    events.push({
      id: "assignee-empty",
      title: "Fără responsabil",
      at: item.updatedAt || item.createdAt,
    });
  }

  events.push({
    id: "status",
    title: `Status curent: ${formatSupportTicketStatusLabel(item.status)}`,
    at: item.updatedAt || item.createdAt,
  });

  if (item.createdAt) {
    events.push({
      id: "created",
      title: "Tichet creat",
      at: item.createdAt,
    });
  }

  return events.sort((first, second) => toMillis(second.at) - toMillis(first.at));
}

export function scrollToTicketSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  element?.scrollIntoView({ behavior: "smooth", block: "start" });
}
