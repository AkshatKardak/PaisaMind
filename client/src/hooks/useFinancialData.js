import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import * as expenseService from "../services/expenseService";
import * as goalService from "../services/goalService";
import * as incomeService from "../services/incomeService";
import * as invoiceService from "../services/invoiceService";

const useFinancialData = () => {
  const summaryQueries = useQueries({
    queries: [
      { queryKey: ["income-summary"], queryFn: incomeService.getSummary },
      { queryKey: ["expense-summary"], queryFn: () => expenseService.getSummary({}) },
      { queryKey: ["invoice-summary"], queryFn: invoiceService.getSummary },
    ],
  });

  const goalsQuery = useQuery({
    queryKey: ["goals"],
    queryFn: goalService.getGoals,
  });

  const [incomeSummary, expenseSummary, invoiceSummary] = summaryQueries;

  return useMemo(
    () => ({
      incomeSummary: incomeSummary.data?.data ?? [],
      expenseSummary: expenseSummary.data?.data ?? [],
      invoiceSummary: invoiceSummary.data?.data ?? {},
      goals: goalsQuery.data?.data ?? [],
      loading:
        summaryQueries.some((query) => query.isLoading) || goalsQuery.isLoading,
      refetchAll: () => {
        summaryQueries.forEach((query) => query.refetch());
        goalsQuery.refetch();
      },
    }),
    [incomeSummary.data, expenseSummary.data, invoiceSummary.data, goalsQuery.data, goalsQuery.isLoading, summaryQueries]
  );
};

export default useFinancialData;
