import { humanAdminLabel, humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import type {
  AdminConversationListItem,
  AdminConversationMessageItem,
  ConversationModerationStatus,
} from "@/lib/adminConversations";

export const moderationStatuses: ConversationModerationStatus[] = [
  "none",
  "flagged",
  "under_review",
  "resolved",
];

export const conversationTypes = ["all", "direct", "booking"];
export const conversationStatuses = ["all", "active", "closed"];

export function label(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

export function moderationVariant(status: string) {
  if (status === "flagged") return "danger" as const;
  if (status === "under_review") return "warning" as const;
  if (status === "resolved") return "success" as const;
  return "outline" as const;
}

export function statusVariant(status: string) {
  if (status === "active") return "success" as const;
  if (status === "closed") return "secondary" as const;
  return "outline" as const;
}

export function conversationPersonLabel(
  item: AdminConversationListItem,
  entity: "user" | "provider"
) {
  if (entity === "provider") {
    return humanProviderLabel({
      displayName: item.provider?.displayName || null,
      email: item.provider?.email || null,
      phoneNumber: item.provider?.phoneNumber || null,
    });
  }
  return humanUserLabel({
    displayName: item.user?.displayName || null,
    email: item.user?.email || null,
    phoneNumber: item.user?.phoneNumber || null,
  });
}

export function conversationTitle(item: AdminConversationListItem) {
  const userLabel = conversationPersonLabel(item, "user");
  const providerLabel = conversationPersonLabel(item, "provider");

  if (item.bookingId) {
    return `${userLabel} ↔ ${providerLabel}`;
  }
  return `${userLabel} ↔ ${providerLabel}`;
}

export function formatChatTime(value: unknown) {
  const formatted = formatAdminDateTime(value);
  if (formatted === "-") {
    return formatted;
  }
  return formatted.replace(/,\s*\d{4}/, "");
}

export function messageSenderLabel(message: AdminConversationMessageItem) {
  if (message.senderRole === "provider") {
    return humanProviderLabel({
      displayName: message.senderSnapshot?.displayName || null,
      email: message.senderSnapshot?.email || null,
    });
  }
  if (message.senderRole === "admin" || message.senderRole === "support") {
    return humanAdminLabel({
      displayName: message.senderSnapshot?.displayName || null,
      email: message.senderSnapshot?.email || null,
    });
  }
  return humanUserLabel({
    displayName: message.senderSnapshot?.displayName || null,
    email: message.senderSnapshot?.email || null,
  });
}

export function isProviderSideMessage(message: AdminConversationMessageItem) {
  return message.senderRole === "provider";
}

export function normalizeModerationStatus(value: string | null | undefined) {
  if (value && moderationStatuses.includes(value as ConversationModerationStatus)) {
    return value as ConversationModerationStatus;
  }
  return "all";
}
