import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { serializeRouteError } from "@/lib/adminRouteError";

export type PaymentWebhookState = "ok" | "delayed" | "missing";

export type PaymentAdminListItem = {
  paymentId: string;
  bookingId: string | null;
  userId: string | null;
  providerId: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  amount: number;
  grossAmount: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  providerNetAmount: number;
  providerPayoutStatus: string;
  providerPayoutRequestedAt: string | null;
  providerPayoutPaidAt: string | null;
  currency: string;
  processor: string;
  method: string;
  transactionId: string | null;
  stripePaymentIntentId: string | null;
  stripeLatestChargeId: string | null;
  stripeStatus: string | null;
  webhookEventId: string | null;
  webhookState: PaymentWebhookState;
  refundSummary: {
    status: string;
    reason: string | null;
    amount: number;
    stripeRefundId: string | null;
    requiredAt: string | null;
    refundedAt: string | null;
    failedAt: string | null;
    lastError: string | null;
  } | null;
  booking: {
    bookingId: string | null;
    status: string | null;
    scheduledStartAt: string | null;
    userName: string | null;
    providerName: string | null;
    serviceName: string | null;
  };
  user: {
    userId: string | null;
    displayName: string | null;
    email: string | null;
  };
  provider: {
    providerId: string | null;
    displayName: string | null;
    email: string | null;
  };
};

export type PaymentListFilters = {
  status?: string;
  providerPayoutStatus?: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  providerId?: string;
  userId?: string;
  processorId?: string;
  q?: string;
};

export type ProviderPayoutRequestAdminItem = {
  requestId: string;
  providerId: string | null;
  status: string;
  currency: string;
  grossAmount: number;
  platformFeeAmount: number;
  providerNetAmount: number;
  paymentIds: string[];
  requestedAt: string | null;
  paidAt: string | null;
  paidByAdminUid: string | null;
  adminNote: string | null;
  payoutDetails: ProviderPayoutDetailsAdminItem;
  invoice: ProviderPayoutInvoiceAdminItem;
  provider: {
    providerId: string | null;
    displayName: string | null;
    email: string | null;
  };
};

export type ProviderPayoutInvoiceStatus = "pending" | "ready" | "failed";

export type ProviderPayoutInvoicePartyAdminItem = {
  legalName: string | null;
  cui: string | null;
  tradeRegister: string | null;
  fiscalAddress: string | null;
  email: string | null;
  iban: string | null;
  bank: string | null;
};

export type ProviderPayoutInvoiceAdminItem = {
  series: string | null;
  number: string | null;
  displayNumber: string | null;
  issuedAt: string | null;
  status: ProviderPayoutInvoiceStatus;
  storagePath: string | null;
  totalAmount: number;
  netAmount: number;
  vatAmount: number;
  vatRate: number;
  error: string | null;
  issuer: ProviderPayoutInvoicePartyAdminItem | null;
  buyer: ProviderPayoutInvoicePartyAdminItem | null;
};

export type ProviderPayoutDetailsAdminItem = {
  iban: string | null;
  accountHolderName: string | null;
  bankName: string | null;
  ibanLast4: string | null;
  updatedAt: string | null;
  source: "snapshot" | "live_provider" | "missing";
  isComplete: boolean;
};

export type ProviderPayoutRequestPaymentSummary = {
  paymentId: string;
  bookingId: string | null;
  status: string;
  providerPayoutStatus: string;
  grossAmount: number;
  platformFeeAmount: number;
  providerNetAmount: number;
  currency: string;
};

export type ProviderPayoutRequestDetailAdminItem = ProviderPayoutRequestAdminItem & {
  createdAt: string | null;
  updatedAt: string | null;
  payments: ProviderPayoutRequestPaymentSummary[];
};

export type PaymentQueryResult = {
  items: PaymentAdminListItem[];
  total: number;
  truncated: boolean;
  maxRows: number;
};

const WEBHOOK_DELAY_MS = 15 * 60 * 1000;
const WEBHOOK_MISSING_MS = 24 * 60 * 60 * 1000;

function readString(value: unknown) {
  return String(value || "").trim();
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readProviderPayoutDetailsAdmin(
  request: Record<string, unknown>,
  provider: Record<string, unknown> | null,
): ProviderPayoutDetailsAdminItem {
  const snapshot = readRecord(request.payoutDetailsSnapshot);
  const live = readRecord(provider?.payoutDetails);
  const hasSnapshot = Boolean(readString(snapshot.iban));
  const hasLive = Boolean(readString(live.iban));
  const sourceData = hasSnapshot ? snapshot : live;
  const iban = readString(sourceData.iban) || null;
  const accountHolderName = readString(sourceData.accountHolderName) || null;
  const bankName = readString(sourceData.bankName) || null;

  return {
    iban,
    accountHolderName,
    bankName,
    ibanLast4: iban ? iban.slice(-4) : null,
    updatedAt: toIso(sourceData.updatedAt),
    source: hasSnapshot ? "snapshot" : hasLive ? "live_provider" : "missing",
    isComplete: Boolean(iban && accountHolderName && bankName),
  };
}

function readInvoiceParty(value: unknown): ProviderPayoutInvoicePartyAdminItem | null {
  const source = readRecord(value);
  if (!Object.keys(source).length) return null;
  const address = readRecord(source.address);
  const formattedAddress = [
    readString(address.line1),
    readString(address.line2),
    [readString(address.postalCode), readString(address.city)].filter(Boolean).join(" "),
    readString(address.county),
    readString(address.countryCode),
  ].filter(Boolean).join(", ");

  return {
    legalName: readString(source.legalName ?? source.name ?? source.companyName) || null,
    cui: readString(source.cui ?? source.taxId) || null,
    tradeRegister: readString(source.tradeRegister ?? source.registrationNumber) || null,
    fiscalAddress: readString(source.fiscalAddress) || formattedAddress || null,
    email: readString(source.email) || null,
    iban: readString(source.iban) || null,
    bank: readString(source.bank ?? source.bankName) || null,
  };
}

function readFirstInvoiceParty(...values: unknown[]) {
  for (const value of values) {
    const party = readInvoiceParty(value);
    if (party) return party;
  }
  return null;
}

function readProviderPayoutInvoiceAdmin(
  request: Record<string, unknown>,
): ProviderPayoutInvoiceAdminItem {
  const invoice = readRecord(request.invoice);
  const rawStatus = readString(invoice.status);
  const status: ProviderPayoutInvoiceStatus = rawStatus === "ready" || rawStatus === "failed"
    ? rawStatus
    : "pending";
  const issuer = readFirstInvoiceParty(
    request.issuerSnapshot,
    invoice.issuerSnapshot,
    invoice.issuer,
  );
  const buyer = readFirstInvoiceParty(
    request.buyerSnapshot,
    invoice.buyerSnapshot,
    invoice.buyer,
  );

  return {
    series: readString(invoice.series) || null,
    number: readString(invoice.number) || null,
    displayNumber: readString(invoice.displayNumber)
      || [readString(invoice.series), readString(invoice.number)].filter(Boolean).join(" ")
      || null,
    issuedAt: toIso(invoice.issuedAt),
    status,
    storagePath: readString(invoice.storagePath) || null,
    totalAmount: toNumber(invoice.totalAmount),
    netAmount: toNumber(invoice.netAmount),
    vatAmount: toNumber(invoice.vatAmount),
    vatRate: toNumber(invoice.vatRate),
    error: readString(invoice.error) || null,
    issuer,
    buyer,
  };
}

function mapProviderPayoutRequestAdminItem(
  request: Record<string, unknown> & { requestId: string },
  provider: Record<string, unknown> | null,
): ProviderPayoutRequestAdminItem {
  const providerId = readString(request.providerId) || null;

  return {
    requestId: readString(request.requestId),
    providerId,
    status: readString(request.status) || "requested",
    currency: readString(request.currency) || "RON",
    grossAmount: toNumber(request.grossAmount),
    platformFeeAmount: toNumber(request.platformFeeAmount),
    providerNetAmount: toNumber(request.providerNetAmount),
    paymentIds: readStringArray(request.paymentIds),
    requestedAt: toIso(request.requestedAt),
    paidAt: toIso(request.paidAt),
    paidByAdminUid: readString(request.paidByAdminUid) || null,
    adminNote: readString(request.adminNote) || null,
    payoutDetails: readProviderPayoutDetailsAdmin(request, provider),
    invoice: readProviderPayoutInvoiceAdmin(request),
    provider: {
      providerId,
      displayName:
        readString((provider?.professionalProfile as Record<string, unknown> | undefined)?.displayName) || null,
      email: readString(provider?.email) || null,
    },
  };
}

function mapProviderPayoutPaymentSummary(
  paymentId: string,
  payment: Record<string, unknown>,
): ProviderPayoutRequestPaymentSummary {
  return {
    paymentId,
    bookingId: readString(payment.bookingId) || null,
    status: readString(payment.status) || "unknown",
    providerPayoutStatus: readString(payment.providerPayoutStatus) || "not_available",
    grossAmount: toNumber(payment.grossAmount ?? payment.amount),
    platformFeeAmount: toNumber(payment.platformFeeAmount),
    providerNetAmount: toNumber(payment.providerNetAmount),
    currency: readString(payment.currency) || "RON",
  };
}

function toIso(value: unknown) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof (value as { toDate?: () => Date })?.toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toMillis(value: unknown) {
  if (!value) {
    return 0;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof (value as { toMillis?: () => number })?.toMillis === "function") {
    return Number((value as { toMillis: () => number }).toMillis()) || 0;
  }
  if (typeof (value as { toDate?: () => Date })?.toDate === "function") {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => readString(item)).filter(Boolean)
    : [];
}

function normalizeText(value: unknown) {
  return readString(value).toLowerCase();
}

function resolveWebhookState(
  payment: Record<string, unknown>,
  nowMs: number
): PaymentWebhookState {
  const processor = normalizeText(payment.processor);
  const status = normalizeText(payment.status);
  const webhookEventId = readString(payment.webhookEventId);
  const createdAtMs = toMillis(payment.createdAt);

  if (
    processor !== "stripe"
    || status !== "in_progress"
    || webhookEventId
    || createdAtMs <= 0
  ) {
    return "ok";
  }

  const age = nowMs - createdAtMs;
  if (age > WEBHOOK_MISSING_MS) {
    return "missing";
  }
  if (age > WEBHOOK_DELAY_MS) {
    return "delayed";
  }
  return "ok";
}

function matchesProcessorId(payment: PaymentAdminListItem, processorId: string) {
  if (!processorId) {
    return true;
  }
  const token = processorId.toLowerCase();
  return [
    payment.transactionId,
    payment.stripePaymentIntentId,
    payment.stripeLatestChargeId,
    payment.paymentId,
  ]
    .map((value) => normalizeText(value))
    .some((value) => value.includes(token));
}

function matchesSearch(payment: PaymentAdminListItem, query: string) {
  if (!query) {
    return true;
  }
  const token = query.toLowerCase();
  return [
    payment.paymentId,
    payment.bookingId,
    payment.user.displayName,
    payment.user.email,
    payment.provider.displayName,
    payment.provider.email,
    payment.booking.userName,
    payment.booking.providerName,
    payment.booking.serviceName,
    payment.transactionId,
    payment.stripePaymentIntentId,
    payment.stripeLatestChargeId,
  ]
    .map((value) => normalizeText(value))
    .some((value) => value.includes(token));
}

async function loadByIds(collectionName: string, ids: string[]) {
  if (!ids.length) {
    return new Map<string, Record<string, unknown>>();
  }
  const db = getAdminDb();
  const snapshots: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>[] =
    await Promise.all(
    ids.map((id) => db.collection(collectionName).doc(id).get())
  );
  const result = new Map<string, Record<string, unknown>>();
  snapshots.forEach((snapshot) => {
    if (snapshot.exists) {
      result.set(snapshot.id, (snapshot.data() || {}) as Record<string, unknown>);
    }
  });
  return result;
}

function readUniqueIds(items: Array<Record<string, unknown>>, fieldName: string) {
  const ids = new Set<string>();
  items.forEach((item) => {
    const value = readString(item[fieldName]);
    if (value) {
      ids.add(value);
    }
  });
  return [...ids];
}

function sortByCreatedAtDesc(items: PaymentAdminListItem[]) {
  return [...items].sort(
    (first, second) => toMillis(second.createdAt) - toMillis(first.createdAt)
  );
}

export async function listAdminPayments(
  filters: PaymentListFilters,
  options?: { maxRows?: number; now?: Date }
): Promise<PaymentQueryResult> {
  const db = getAdminDb();
  const maxRows = Math.max(1, Math.floor(options?.maxRows || 5000));
  const nowMs = (options?.now || new Date()).getTime();

  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
    db.collection("payments");

  const status = readString(filters.status);
  const providerId = readString(filters.providerId);
  const userId = readString(filters.userId);

  if (status) {
    query = query.where("status", "==", status);
  }
  if (providerId) {
    query = query.where("providerId", "==", providerId);
  }
  if (userId) {
    query = query.where("userId", "==", userId);
  }
  if (filters.dateFrom instanceof Date) {
    query = query.where("createdAt", ">=", Timestamp.fromDate(filters.dateFrom));
  }
  if (filters.dateTo instanceof Date) {
    query = query.where("createdAt", "<=", Timestamp.fromDate(filters.dateTo));
  }

  const snapshot = await query.orderBy("createdAt", "desc").limit(maxRows + 1).get();
  const truncated = snapshot.docs.length > maxRows;
  const paymentDocs = truncated ? snapshot.docs.slice(0, maxRows) : snapshot.docs;
  const paymentItems: Array<Record<string, unknown> & { paymentId: string }> =
    paymentDocs.map((doc) => ({ paymentId: doc.id, ...doc.data() }));

  const bookingIds = readUniqueIds(paymentItems, "bookingId");
  const userIds = readUniqueIds(paymentItems, "userId");
  const providerIds = readUniqueIds(paymentItems, "providerId");

  const [bookingsById, usersById, providersById] = await Promise.all([
    loadByIds("bookings", bookingIds),
    loadByIds("users", userIds),
    loadByIds("providers", providerIds),
  ]);

  const mapped = paymentItems.map((payment) => {
    const bookingId = readString(payment.bookingId) || null;
    const userIdValue = readString(payment.userId) || null;
    const providerIdValue = readString(payment.providerId) || null;
    const booking = bookingId ? bookingsById.get(bookingId) || null : null;
    const user = userIdValue ? usersById.get(userIdValue) || null : null;
    const provider = providerIdValue ? providersById.get(providerIdValue) || null : null;

    const normalized: PaymentAdminListItem = {
      paymentId: readString(payment.paymentId),
      bookingId,
      userId: userIdValue,
      providerId: providerIdValue,
      status: readString(payment.status) || "unknown",
      createdAt: toIso(payment.createdAt),
      updatedAt: toIso(payment.updatedAt),
      amount: toNumber(payment.amount),
      grossAmount: toNumber(payment.grossAmount) || toNumber(payment.amount),
      platformFeePercent: toNumber(payment.platformFeePercent),
      platformFeeAmount: toNumber(payment.platformFeeAmount),
      providerNetAmount: toNumber(payment.providerNetAmount),
      providerPayoutStatus: readString(payment.providerPayoutStatus) || "not_available",
      providerPayoutRequestedAt: toIso(payment.providerPayoutRequestedAt),
      providerPayoutPaidAt: toIso(payment.providerPayoutPaidAt),
      currency: readString(payment.currency) || "RON",
      processor: readString(payment.processor) || "unknown",
      method: readString(payment.method),
      transactionId: readString(payment.transactionId) || null,
      stripePaymentIntentId: readString(payment.stripePaymentIntentId) || null,
      stripeLatestChargeId: readString(payment.stripeLatestChargeId) || null,
      stripeStatus: readString(payment.stripeStatus) || null,
      webhookEventId: readString(payment.webhookEventId) || null,
      webhookState: resolveWebhookState(payment, nowMs),
      refundSummary: (() => {
        const refund = readRecord(payment.refundSummary);
        const refundStatus = readString(refund.status);
        if (!refundStatus) return null;
        return {
          status: refundStatus,
          reason: readString(refund.reason) || null,
          amount: toNumber(refund.amount),
          stripeRefundId: readString(refund.stripeRefundId) || null,
          requiredAt: toIso(refund.requiredAt),
          refundedAt: toIso(refund.refundedAt),
          failedAt: toIso(refund.failedAt),
          lastError: readString(refund.lastError) || null,
        };
      })(),
      booking: {
        bookingId,
        status: readString(booking?.status) || null,
        scheduledStartAt: toIso(booking?.scheduledStartAt),
        userName: readString((booking?.userSnapshot as Record<string, unknown> | undefined)?.displayName) || null,
        providerName: readString((booking?.providerSnapshot as Record<string, unknown> | undefined)?.displayName) || null,
        serviceName: readString((booking?.serviceSnapshot as Record<string, unknown> | undefined)?.name) || null,
      },
      user: {
        userId: userIdValue,
        displayName: readString(user?.displayName) || null,
        email: readString(user?.email) || null,
      },
      provider: {
        providerId: providerIdValue,
        displayName:
          readString(
            (
              provider?.professionalProfile as
                | Record<string, unknown>
                | undefined
            )?.displayName
          ) || null,
        email: readString(provider?.email) || null,
      },
    };

    return normalized;
  });

  const processorId = normalizeText(filters.processorId);
  const providerPayoutStatus = normalizeText(filters.providerPayoutStatus);
  const search = normalizeText(filters.q);
  const filtered = mapped.filter(
    (item) =>
      (!providerPayoutStatus || normalizeText(item.providerPayoutStatus) === providerPayoutStatus)
      && matchesProcessorId(item, processorId)
      && matchesSearch(item, search)
  );

  return {
    items: sortByCreatedAtDesc(filtered),
    total: filtered.length,
    truncated,
    maxRows,
  };
}

function sortPayoutRequestsByRequestedAtDesc(
  requests: Array<Record<string, unknown> & { requestId: string }>,
) {
  return [...requests].sort(
    (first, second) =>
      toMillis(second.requestedAt || second.createdAt)
      - toMillis(first.requestedAt || first.createdAt),
  );
}

function logAdminPaymentsStep(
  level: "info" | "error",
  step: string,
  payload?: Record<string, unknown>,
) {
  const message = `[adminPayments] ${step}`;
  if (level === "error") {
    console.error(message, payload || {});
    return;
  }
  console.info(message, payload || {});
}

function throwAdminPaymentsStepError(
  step: string,
  error: unknown,
  extra?: Record<string, unknown>,
): never {
  const debug = serializeRouteError(error, step);
  console.error("[adminPayments] step failed", { ...debug, ...extra });
  throw Object.assign(new Error(`[${step}] ${debug.message}`), {
    code: debug.code,
    details: debug.details,
    step,
  });
}

function matchesPayoutRequestSearch(
  request: ProviderPayoutRequestAdminItem,
  searchQuery: string,
) {
  if (!searchQuery) {
    return true;
  }
  const token = searchQuery.toLowerCase();
  return [
    request.requestId,
    request.providerId,
    request.provider.displayName,
    request.provider.email,
    request.payoutDetails.accountHolderName,
    request.payoutDetails.ibanLast4,
    request.payoutDetails.bankName,
    request.invoice.displayNumber,
    request.invoice.issuer?.legalName,
    request.invoice.buyer?.legalName,
  ]
    .map((value) => normalizeText(value))
    .some((value) => value.includes(token));
}

export async function listAdminProviderPayoutRequests(options?: {
  status?: string;
  providerId?: string;
  q?: string;
  maxRows?: number;
}): Promise<ProviderPayoutRequestAdminItem[]> {
  const db = getAdminDb();
  const maxRows = Math.max(1, Math.floor(options?.maxRows || 100));
  const status = readString(options?.status);
  const providerId = readString(options?.providerId);
  const query = readString(options?.q);
  const fetchLimit = status ? Math.max(maxRows, 500) : maxRows;

  let requests: Array<Record<string, unknown> & { requestId: string }> = [];

  logAdminPaymentsStep("info", "providerPayoutRequests.query.start", {
    status: status || "all",
    fetchLimit,
    maxRows,
  });

  try {
    const snapshot = await db
      .collection("providerPayoutRequests")
      .orderBy("requestedAt", "desc")
      .limit(fetchLimit)
      .get();

    requests = snapshot.docs.map((doc) => ({
      requestId: doc.id,
      ...doc.data(),
    })) as Array<Record<string, unknown> & { requestId: string }>;

    logAdminPaymentsStep("info", "providerPayoutRequests.query.success", {
      count: requests.length,
      mode: "orderBy",
    });
  } catch (error) {
    logAdminPaymentsStep("error", "providerPayoutRequests.query.orderBy_failed", {
      ...serializeRouteError(error, "providerPayoutRequests.orderBy"),
    });

    try {
      logAdminPaymentsStep("info", "providerPayoutRequests.query.fallback.start", {
        fetchLimit,
      });

      const snapshot = await db.collection("providerPayoutRequests").limit(fetchLimit).get();
      requests = sortPayoutRequestsByRequestedAtDesc(
        snapshot.docs.map((doc) => ({
          requestId: doc.id,
          ...doc.data(),
        })) as Array<Record<string, unknown> & { requestId: string }>,
      );

      logAdminPaymentsStep("info", "providerPayoutRequests.query.fallback.success", {
        count: requests.length,
      });
    } catch (fallbackError) {
      throwAdminPaymentsStepError("providerPayoutRequests.query.fallback", fallbackError, {
        primaryError: serializeRouteError(error, "providerPayoutRequests.orderBy"),
      });
    }
  }

  if (status) {
    requests = requests.filter((request) => readString(request.status) === status);
  }

  if (providerId) {
    requests = requests.filter((request) => readString(request.providerId) === providerId);
  }

  requests = requests.slice(0, maxRows);

  let providersById: Map<string, Record<string, unknown>>;
  try {
    logAdminPaymentsStep("info", "providerPayoutRequests.providers.load.start", {
      providerCount: readUniqueIds(requests, "providerId").length,
    });
    providersById = await loadByIds("providers", readUniqueIds(requests, "providerId"));
    logAdminPaymentsStep("info", "providerPayoutRequests.providers.load.success", {
      loadedCount: providersById.size,
    });
  } catch (error) {
    throwAdminPaymentsStepError("providerPayoutRequests.providers.load", error);
  }

  return requests.map((request) => {
    const providerId = readString(request.providerId) || null;
    const provider = providerId ? providersById.get(providerId) || null : null;
    return mapProviderPayoutRequestAdminItem(request, provider);
  }).filter((request) => matchesPayoutRequestSearch(request, query));
}

export async function getAdminProviderPayoutRequestDetail(
  requestId: string,
): Promise<ProviderPayoutRequestDetailAdminItem> {
  const normalizedRequestId = readString(requestId);

  if (!normalizedRequestId) {
    throw new Error("missing_request_id");
  }

  const db = getAdminDb();
  const requestSnap = await db.collection("providerPayoutRequests").doc(normalizedRequestId).get();

  if (!requestSnap.exists) {
    throw new Error("payout_request_not_found");
  }

  const request = {
    requestId: requestSnap.id,
    ...(requestSnap.data() || {}),
  } as Record<string, unknown> & { requestId: string };
  const providerId = readString(request.providerId) || null;
  const providersById = await loadByIds("providers", providerId ? [providerId] : []);
  const provider = providerId ? providersById.get(providerId) || null : null;
  const baseItem = mapProviderPayoutRequestAdminItem(request, provider);
  const paymentIds = readStringArray(request.paymentIds);
  const paymentSnaps = await Promise.all(
    paymentIds.map((paymentId) => db.collection("payments").doc(paymentId).get()),
  );
  const payments = paymentSnaps.map((paymentSnap, index) => mapProviderPayoutPaymentSummary(
    paymentSnap.id || paymentIds[index],
    paymentSnap.exists ? (paymentSnap.data() || {}) : {},
  ));

  return {
    ...baseItem,
    createdAt: toIso(request.createdAt),
    updatedAt: toIso(request.updatedAt),
    payments,
  };
}

export async function updateAdminProviderPayoutRequestNote(params: {
  requestId: string;
  adminNote: string;
  adminUid: string;
}) {
  const requestId = readString(params.requestId);
  const adminUid = readString(params.adminUid);

  if (!requestId) {
    throw new Error("missing_request_id");
  }

  const db = getAdminDb();
  const requestRef = db.collection("providerPayoutRequests").doc(requestId);
  const requestSnap = await requestRef.get();

  if (!requestSnap.exists) {
    throw new Error("payout_request_not_found");
  }

  const status = readString(requestSnap.data()?.status);
  if (status !== "requested" && status !== "paid") {
    throw new Error("payout_request_note_not_allowed");
  }

  const now = Timestamp.now();
  await requestRef.set({
    adminNote: readString(params.adminNote) || null,
    updatedAt: now,
    updatedBy: adminUid,
  }, { merge: true });

  return getAdminProviderPayoutRequestDetail(requestId);
}

export async function markProviderPayoutRequestPaid(params: {
  requestId: string;
  adminUid: string;
  adminNote?: string;
}) {
  const requestId = readString(params.requestId);
  const adminUid = readString(params.adminUid);

  if (!requestId) {
    throw new Error("missing_request_id");
  }

  const db = getAdminDb();
  const requestRef = db.collection("providerPayoutRequests").doc(requestId);
  const now = Timestamp.now();

  return db.runTransaction(async (transaction) => {
    const requestSnap = await transaction.get(requestRef);
    if (!requestSnap.exists) {
      throw new Error("payout_request_not_found");
    }

    const request = requestSnap.data() || {};
    if (readString(request.status) !== "requested") {
      throw new Error("payout_request_not_requested");
    }
    if (
      readString(readRecord(request.invoice).status) !== "ready"
      && readString(request.invoiceStatus) !== "ready"
    ) {
      throw new Error("payout_invoice_not_ready");
    }

    const paymentIds = readStringArray(request.paymentIds);
    const paymentRefs = paymentIds.map((paymentId) => db.collection("payments").doc(paymentId));
    const paymentSnaps = await Promise.all(paymentRefs.map((ref) => transaction.get(ref)));

    paymentSnaps.forEach((paymentSnap) => {
      if (!paymentSnap.exists) {
        throw new Error("payout_payment_not_found");
      }
      const payment = paymentSnap.data() || {};
      if (readString(payment.providerPayoutStatus) !== "requested") {
        throw new Error("payout_payment_not_requested");
      }
    });

    transaction.set(requestRef, {
      status: "paid",
      paidAt: now,
      paidByAdminUid: adminUid,
      adminNote: readString(params.adminNote) || null,
      updatedAt: now,
    }, { merge: true });

    paymentRefs.forEach((paymentRef) => {
      transaction.set(paymentRef, {
        providerPayoutStatus: "paid",
        providerPayoutPaidAt: now,
        updatedAt: now,
        updatedBy: adminUid,
      }, { merge: true });
    });

    return {
      requestId,
      status: "paid",
      paidAt: now.toDate().toISOString(),
      updatedPaymentCount: paymentRefs.length,
    };
  });
}

export async function getProviderPayoutInvoiceStorage(requestIdValue: string) {
  const requestId = readString(requestIdValue);
  if (!requestId) throw new Error("missing_request_id");

  const requestSnap = await getAdminDb()
    .collection("providerPayoutRequests")
    .doc(requestId)
    .get();
  if (!requestSnap.exists) throw new Error("payout_request_not_found");

  const invoice = readProviderPayoutInvoiceAdmin(requestSnap.data() || {});
  if (invoice.status !== "ready" || !invoice.storagePath) {
    throw new Error("payout_invoice_not_ready");
  }

  return {
    storagePath: invoice.storagePath,
    displayNumber: invoice.displayNumber,
  };
}

export async function retryProviderPayoutInvoice(params: {
  requestId: string;
  adminUid: string;
}) {
  const requestId = readString(params.requestId);
  const adminUid = readString(params.adminUid);
  if (!requestId) throw new Error("missing_request_id");

  const db = getAdminDb();
  const requestRef = db.collection("providerPayoutRequests").doc(requestId);
  await db.runTransaction(async (transaction) => {
    const requestSnap = await transaction.get(requestRef);
    if (!requestSnap.exists) throw new Error("payout_request_not_found");

    const request = requestSnap.data() || {};
    const requestInvoice = readRecord(request.invoice);
    const invoiceStatus = readString(requestInvoice.status) || readString(request.invoiceStatus);
    if (invoiceStatus !== "failed") {
      throw new Error("payout_invoice_not_failed");
    }

    transaction.set(requestRef, {
      invoice: {
        ...requestInvoice,
        status: "pending",
        error: null,
      },
      invoiceStatus: "pending",
      invoiceError: null,
      updatedAt: Timestamp.now(),
      updatedBy: adminUid,
    }, { merge: true });
  });

  return getAdminProviderPayoutRequestDetail(requestId);
}
