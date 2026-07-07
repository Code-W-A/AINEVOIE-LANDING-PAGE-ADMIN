function readString(value: unknown) {
  return String(value || "").trim();
}

export function formatSupportTicketStatusLabel(status?: string | null) {
  const normalized = readString(status);
  const labels: Record<string, string> = {
    open: "Deschis",
    in_progress: "În lucru",
    waiting_user: "Așteaptă utilizatorul",
    resolved: "Rezolvat",
    closed: "Închis",
  };
  return labels[normalized] || normalized || "-";
}

export function formatSupportTicketPriorityLabel(priority?: string | null) {
  const normalized = readString(priority);
  const labels: Record<string, string> = {
    low: "Scăzută",
    normal: "Normală",
    high: "Ridicată",
    urgent: "Urgentă",
  };
  return labels[normalized] || normalized || "-";
}

export function formatSupportTicketTopicLabel(topic?: string | null) {
  const normalized = readString(topic);
  const labels: Record<string, string> = {
    support: "Suport",
    bug: "Raport eroare",
  };
  return labels[normalized] || normalized || "-";
}

export function formatSupportTicketRoleLabel(role?: string | null) {
  const normalized = readString(role);
  const labels: Record<string, string> = {
    user: "Utilizator",
    provider: "Prestator",
    admin: "Admin",
    support: "Suport",
  };
  return labels[normalized] || normalized || "-";
}

export function formatSupportTicketEntityTypeLabel(entityType?: string | null) {
  const normalized = readString(entityType);
  const labels: Record<string, string> = {
    booking: "Programare",
    provider: "Prestator",
    user: "Utilizator",
  };
  return labels[normalized] || normalized || "-";
}

export function formatSupportTicketSlaAge(ageMinutes: number) {
  if (!Number.isFinite(ageMinutes) || ageMinutes <= 0) {
    return "0 min";
  }
  if (ageMinutes < 60) {
    return `${ageMinutes} min`;
  }
  const hours = Math.floor(ageMinutes / 60);
  const minutes = ageMinutes % 60;
  if (hours < 24) {
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days} z ${remainingHours} h` : `${days} z`;
}
