// Switch for the customer Requests list. Consumes auth + the customer's
// active and history orders via separate subscriptions (each with its own
// query limit so one tab's volume can't starve the other).

import { useState } from "react";

import { useAuthContext } from "@/providers/auth-provider";

import { useCustomerActiveOrders } from "../hooks/use-customer-active-orders";
import { useCustomerHistoryOrders } from "../hooks/use-customer-history-orders";
import { CustomerRequestsLoadingView } from "./customer-requests-loading.view";
import { CustomerRequestsErrorView } from "./customer-requests-error.view";
import { CustomerRequestsSuccessView } from "./customer-requests-success.view";
import type { RequestTab } from "../customer-requests.constants";

export const CustomerRequestsView = () => {
  const { currentUser, isHydrated } = useAuthContext();
  const active = useCustomerActiveOrders(currentUser?.id);
  const history = useCustomerHistoryOrders(currentUser?.id);
  const [tab, setTab] = useState<RequestTab>("active");

  if (!isHydrated || active.isLoading || history.isLoading) {
    return <CustomerRequestsLoadingView />;
  }
  if (active.isError || history.isError) {
    return (
      <CustomerRequestsErrorView
        onRetry={() => {
          active.refetch();
          history.refetch();
        }}
      />
    );
  }
  return (
    <CustomerRequestsSuccessView
      activeOrders={active.data ?? []}
      historyOrders={history.data ?? []}
      tab={tab}
      onTabChange={setTab}
    />
  );
};
