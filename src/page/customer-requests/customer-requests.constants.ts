import type { OrderStatus } from "@/types/order.interface";

export const CUSTOMER_REQUESTS_COPY = {
  title: "Requests",
  loading: "Loading your requests…",
  error: "We couldn't load your requests.",
  retry: "Try again",
  emptyTitle: "No requests yet",
  emptyBody: "Request a quote from the Services tab and it'll show up here.",
  emptyActiveTitle: "No active requests",
  emptyActiveBody: "You don't have any open jobs right now.",
  emptyHistoryTitle: "No history yet",
  emptyHistoryBody: "Completed and cancelled jobs will appear here.",
} as const;

export const REQUEST_TABS = [
  { value: "active", label: "Active" },
  { value: "history", label: "History" },
] as const;

export type RequestTab = (typeof REQUEST_TABS)[number]["value"];

// Statuses that belong in the Active tab.
export const ACTIVE_STATUSES: OrderStatus[] = [
  "Pending",
  "Accepted",
  "QuoteProposed",
  "Scheduled",
  "InProgress",
];

// Statuses that belong in the History tab.
export const HISTORY_STATUSES: OrderStatus[] = [
  "Completed",
  "Cancelled",
  "Expired",
];
