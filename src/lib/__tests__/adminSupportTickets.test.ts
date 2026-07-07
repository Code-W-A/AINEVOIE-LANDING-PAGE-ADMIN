import { describe, expect, it } from "vitest";
import {
  formatSupportTicketEntityTypeLabel,
  formatSupportTicketPriorityLabel,
  formatSupportTicketRoleLabel,
  formatSupportTicketSlaAge,
  formatSupportTicketStatusLabel,
  formatSupportTicketTopicLabel,
} from "../adminSupportTicketLabels";

describe("adminSupportTickets labels", () => {
  it("maps support ticket statuses to Romanian labels", () => {
    expect(formatSupportTicketStatusLabel("open")).toBe("Deschis");
    expect(formatSupportTicketStatusLabel("in_progress")).toBe("În lucru");
    expect(formatSupportTicketStatusLabel("waiting_user")).toBe("Așteaptă utilizatorul");
    expect(formatSupportTicketStatusLabel("resolved")).toBe("Rezolvat");
    expect(formatSupportTicketStatusLabel("closed")).toBe("Închis");
  });

  it("maps support ticket priorities and topics to Romanian labels", () => {
    expect(formatSupportTicketPriorityLabel("urgent")).toBe("Urgentă");
    expect(formatSupportTicketPriorityLabel("normal")).toBe("Normală");
    expect(formatSupportTicketTopicLabel("support")).toBe("Suport");
    expect(formatSupportTicketTopicLabel("bug")).toBe("Raport eroare");
  });

  it("maps roles and entity types to Romanian labels", () => {
    expect(formatSupportTicketRoleLabel("provider")).toBe("Prestator");
    expect(formatSupportTicketRoleLabel("user")).toBe("Utilizator");
    expect(formatSupportTicketEntityTypeLabel("booking")).toBe("Programare");
  });

  it("formats SLA age in Romanian units", () => {
    expect(formatSupportTicketSlaAge(0)).toBe("0 min");
    expect(formatSupportTicketSlaAge(25)).toBe("25 min");
    expect(formatSupportTicketSlaAge(90)).toBe("1 h 30 min");
    expect(formatSupportTicketSlaAge(1500)).toBe("1 z 1 h");
  });
});
