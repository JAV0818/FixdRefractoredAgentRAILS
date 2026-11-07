import { initializeApp } from "firebase-admin/app";

import { createStripePaymentIntent } from "./payments/create-stripe-payment-intent";
import { captureDepositAndApproveQuote } from "./payments/capture-deposit-and-approve-quote";
import { recordCashPayment } from "./payments/record-cash-payment";
import { verifyDepositHold } from "./payments/verify-deposit-hold";
import { releaseDepositHold } from "./payments/release-deposit-hold";
import { addCustomCharges } from "./payments/add-custom-charges";
import { approveCustomCharges } from "./payments/approve-custom-charges";
import { rejectCustomCharges } from "./payments/reject-custom-charges";
import { startOrderAndCapture } from "./payments/start-order-and-capture";
import { cancelOrderWithPolicy } from "./payments/cancel-order-with-policy";
import { completeOrder } from "./payments/complete-order";
import { expireStaleOrders } from "./scheduled/expire-stale-orders";
import { expireQuoteWindows } from "./scheduled/expire-quote-windows";
import { expirePendingCharges } from "./scheduled/expire-pending-charges";

initializeApp();

export {
  createStripePaymentIntent,
  captureDepositAndApproveQuote,
  recordCashPayment,
  verifyDepositHold,
  releaseDepositHold,
  addCustomCharges,
  approveCustomCharges,
  rejectCustomCharges,
  startOrderAndCapture,
  cancelOrderWithPolicy,
  completeOrder,
  expireStaleOrders,
  expireQuoteWindows,
  expirePendingCharges,
};
