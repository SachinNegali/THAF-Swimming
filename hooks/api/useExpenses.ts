import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { logApiError, parseApiError } from '@/lib/api/errorHandler';
import { queryKeys } from '@/lib/react-query/queryClient';
import { store } from '@/store';
import type { Group, Message, PaginatedResponse } from '@/types/api';
import type {
  BalancesResponse,
  CreateExpenseRequest,
  Cycle,
  Expense,
  ExpenseComment,
  ExpenseListFilters,
  Settlement,
  StartCycleResponse,
  SummaryResponse,
  UpdateExpenseRequest,
} from '@/types/expenses';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';

/**
 * Error envelope from the expense backend:
 *   { message, error: '<CODE>', retryAfter?, ... }
 */
export interface ExpenseApiError {
  status?: number;
  code?: string;
  message: string;
  retryAfter?: number;
  raw?: unknown;
}

export function asExpenseError(err: unknown): ExpenseApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as any;
    return {
      status: err.response?.status,
      code: data?.error,
      message: data?.message ?? parseApiError(err),
      retryAfter: data?.retryAfter,
      raw: data,
    };
  }
  return { message: parseApiError(err) };
}

function unwrap<T>(data: any, key?: string): T {
  if (key && data && typeof data === 'object' && key in data) return data[key];
  return data as T;
}

// ─── Cycles ─────────────────────────────────────────────

export function useActiveCycle(groupId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.expenses.activeCycle(groupId),
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>(endpoints.expenses.activeCycle(groupId));
        return unwrap<Cycle>(res.data, 'cycle') ?? (res.data as Cycle);
      } catch (err) {
        if (err instanceof AxiosError && err.response?.status === 404) {
          return null;
        }
        logApiError(err, 'useActiveCycle');
        throw err;
      }
    },
    enabled: enabled && !!groupId,
    retry: (count, err) => {
      if (err instanceof AxiosError && err.response?.status === 404) return false;
      return count < 2;
    },
  });
}

export function useCycles(groupId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.expenses.cycles(groupId),
    queryFn: async () => {
      const res = await apiClient.get<any>(endpoints.expenses.cycles(groupId));
      return (res.data?.cycles ?? res.data ?? []) as Cycle[];
    },
    enabled: enabled && !!groupId,
  });
}

export function useStartCycle(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { currency: Cycle['currency'] }) => {
      try {
        const res = await apiClient.post<any>(
          endpoints.expenses.createCycle(groupId),
          data,
        );
        return res.data as StartCycleResponse;
      } catch (err) {
        logApiError(err, 'useStartCycle');
        throw asExpenseError(err);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.groupAll(groupId) });
    },
  });
}

// ─── Balances / Summary ─────────────────────────────────

export function useBalances(groupId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.expenses.balances(groupId),
    queryFn: async () => {
      const res = await apiClient.get<BalancesResponse>(
        endpoints.expenses.balances(groupId),
      );
      return res.data;
    },
    enabled: enabled && !!groupId,
    retry: (count, err) => {
      if (err instanceof AxiosError && err.response?.status === 404) return false;
      return count < 2;
    },
  });
}

export function useSummary(groupId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.expenses.summary(groupId),
    queryFn: async () => {
      const res = await apiClient.get<SummaryResponse>(
        endpoints.expenses.summary(groupId),
      );
      return res.data;
    },
    enabled: enabled && !!groupId,
    retry: (count, err) => {
      if (err instanceof AxiosError && err.response?.status === 404) return false;
      return count < 2;
    },
  });
}

// ─── Expenses ───────────────────────────────────────────

export function useExpenses(
  groupId: string,
  filters: ExpenseListFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.expenses.list(groupId, filters as unknown as Record<string, unknown>),
    queryFn: async () => {
      const res = await apiClient.get<any>(endpoints.expenses.list(groupId), {
        params: filters as unknown as Record<string, unknown>,
      });
      const data = res.data?.data ?? res.data?.expenses ?? res.data ?? [];
      return {
        data: data as Expense[],
        pagination: res.data?.pagination,
      };
    },
    enabled: enabled && !!groupId,
  });
}

export function useExpense(
  groupId: string,
  expenseId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(expenseId),
    queryFn: async () => {
      const res = await apiClient.get<any>(
        endpoints.expenses.byId(groupId, expenseId),
      );
      return (res.data?.expense ?? res.data) as Expense;
    },
    enabled: enabled && !!groupId && !!expenseId,
  });
}

export function useCreateExpense(groupId: string) {
  const qc = useQueryClient();

  type MessagesCache = {
    pages: PaginatedResponse<Message>[];
    pageParams: unknown[];
  };

  return useMutation({
    mutationFn: async (data: CreateExpenseRequest) => {
      try {
        const res = await apiClient.post<any>(
          endpoints.expenses.create(groupId),
          data,
        );
        return (res.data?.expense ?? res.data) as Expense;
      } catch (err) {
        logApiError(err, 'useCreateExpense');
        throw asExpenseError(err);
      }
    },

    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: queryKeys.groups.messages(groupId) });

      const previous = qc.getQueryData<MessagesCache>(
        queryKeys.groups.messages(groupId),
      );

      const currentUserId = store.getState().auth.user?._id ?? '';
      const tempId = `temp-expense-${Date.now()}-${Math.random()}`;
      const tempExpenseId = `temp-exp-${Date.now()}`;
      const nowIso = new Date().toISOString();

      const cycle = qc.getQueryData<Cycle>(
        queryKeys.expenses.activeCycle(groupId),
      );
      const group = qc.getQueryData<Group>(queryKeys.groups.detail(groupId));
      const paidByMember = group?.members?.find(
        (m) => (m.userId ?? m.user?._id) === data.paidBy,
      );
      const paidByName = paidByMember?.user
        ? `${paidByMember.user.fName ?? ''} ${paidByMember.user.lName ?? ''}`.trim()
        : '';

      const optimisticMessage: Message = {
        _id: tempId,
        group: groupId,
        sender: currentUserId,
        content: data.note ?? data.category,
        type: 'spend',
        isDeleted: false,
        readBy: [],
        deliveredTo: [],
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: currentUserId,
        metadata: {
          spend: {
            expenseId: tempExpenseId,
            amount: data.amount,
            currency: cycle?.currency ?? 'INR',
            category: data.category,
            note: data.note,
            imageUrl: data.imageUrl ?? null,
            splitType: data.splitType,
            splitCount: data.memberIds?.length ?? 0,
            paidBy: { _id: data.paidBy, name: paidByName },
            createdBy: currentUserId,
            createdAt: nowIso,
          },
        },
      };

      qc.setQueryData<MessagesCache>(
        queryKeys.groups.messages(groupId),
        (old) => {
          if (!old?.pages?.length) return old;
          const firstPage = old.pages[0];
          return {
            ...old,
            pages: [
              { ...firstPage, data: [...firstPage.data, optimisticMessage] },
              ...old.pages.slice(1),
            ],
          };
        },
      );

      return { previous, tempId };
    },

    onError: (_err, _data, context) => {
      if (context?.previous) {
        qc.setQueryData(
          queryKeys.groups.messages(groupId),
          context.previous,
        );
      }
    },

    onSuccess: (expense, _vars, context) => {
      // Replace the temp spend message with the real one. If the SSE echo
      // already inserted the real message, drop the temp to avoid duplicates.
      if (context?.tempId && expense) {
        qc.setQueryData<MessagesCache>(
          queryKeys.groups.messages(groupId),
          (old) => {
            if (!old?.pages?.length) return old;
            const realId = expense.messageId;
            return {
              ...old,
              pages: old.pages.map((page) => {
                const hasReal =
                  !!realId && page.data.some((m) => m._id === realId);
                return {
                  ...page,
                  data: hasReal
                    ? page.data.filter((m) => m._id !== context.tempId)
                    : page.data.map((m) => {
                        if (m._id !== context.tempId) return m;
                        const prevSpend = m.metadata?.spend;
                        return {
                          ...m,
                          _id: realId ?? m._id,
                          metadata: {
                            ...(m.metadata ?? {}),
                            spend: prevSpend
                              ? { ...prevSpend, expenseId: expense._id }
                              : prevSpend,
                          },
                        };
                      }),
                };
              }),
            };
          },
        );
      }

      qc.invalidateQueries({ queryKey: queryKeys.expenses.balances(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.expenses.summary(groupId) });
      qc.invalidateQueries({
        queryKey: [...queryKeys.expenses.all, 'group', groupId, 'list'],
      });
      qc.invalidateQueries({ queryKey: queryKeys.groups.lists() });
    },
  });
}

export function useUpdateExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      expenseId,
      data,
    }: {
      expenseId: string;
      data: UpdateExpenseRequest;
    }) => {
      try {
        const res = await apiClient.patch<any>(
          endpoints.expenses.update(groupId, expenseId),
          data,
        );
        return (res.data?.expense ?? res.data) as Expense;
      } catch (err) {
        logApiError(err, 'useUpdateExpense');
        throw asExpenseError(err);
      }
    },
    onSuccess: (_expense, { expenseId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.detail(expenseId) });
      qc.invalidateQueries({ queryKey: queryKeys.expenses.balances(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.expenses.summary(groupId) });
      qc.invalidateQueries({
        queryKey: [...queryKeys.expenses.all, 'group', groupId, 'list'],
      });
    },
  });
}

export function useDeleteExpense(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expenseId: string) => {
      try {
        await apiClient.delete(endpoints.expenses.delete(groupId, expenseId));
        return expenseId;
      } catch (err) {
        logApiError(err, 'useDeleteExpense');
        throw asExpenseError(err);
      }
    },
    onSuccess: (expenseId) => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.detail(expenseId) });
      qc.invalidateQueries({ queryKey: queryKeys.expenses.balances(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.expenses.summary(groupId) });
      qc.invalidateQueries({
        queryKey: [...queryKeys.expenses.all, 'group', groupId, 'list'],
      });
    },
  });
}

// ─── Settlements ────────────────────────────────────────

export function useSettlements(groupId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.expenses.settlements(groupId),
    queryFn: async () => {
      const res = await apiClient.get<any>(
        endpoints.expenses.settlements(groupId),
      );
      return (res.data?.settlements ?? res.data ?? []) as Settlement[];
    },
    enabled: enabled && !!groupId,
  });
}

export function useCreateSettlement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      fromUserId: string;
      toUserId: string;
      amount: number;
    }) => {
      try {
        const res = await apiClient.post<any>(
          endpoints.expenses.createSettlement(groupId),
          data,
        );
        return (res.data?.settlement ?? res.data) as Settlement;
      } catch (err) {
        logApiError(err, 'useCreateSettlement');
        throw asExpenseError(err);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.settlements(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.expenses.balances(groupId) });
    },
  });
}

export function useConfirmSettlement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settlementId: string) => {
      try {
        const res = await apiClient.post<any>(
          endpoints.expenses.confirmSettlement(groupId, settlementId),
        );
        return (res.data?.settlement ?? res.data) as Settlement;
      } catch (err) {
        logApiError(err, 'useConfirmSettlement');
        throw asExpenseError(err);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.settlements(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.expenses.balances(groupId) });
    },
  });
}

export function useCancelSettlement(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settlementId: string) => {
      try {
        const res = await apiClient.post<any>(
          endpoints.expenses.cancelSettlement(groupId, settlementId),
        );
        return (res.data?.settlement ?? res.data) as Settlement;
      } catch (err) {
        logApiError(err, 'useCancelSettlement');
        throw asExpenseError(err);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.settlements(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.expenses.balances(groupId) });
    },
  });
}

// ─── Nudge ──────────────────────────────────────────────

export function useNudge(groupId: string) {
  return useMutation({
    mutationFn: async (data: { toUserId: string }) => {
      try {
        const res = await apiClient.post<any>(
          endpoints.expenses.nudge(groupId),
          data,
        );
        return res.data;
      } catch (err) {
        logApiError(err, 'useNudge');
        throw asExpenseError(err);
      }
    },
  });
}

// ─── Comments ───────────────────────────────────────────

export function useExpenseComments(
  groupId: string,
  expenseId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.expenses.comments(expenseId),
    queryFn: async () => {
      const res = await apiClient.get<any>(
        endpoints.expenses.comments(groupId, expenseId),
      );
      return (res.data?.comments ?? res.data ?? []) as ExpenseComment[];
    },
    enabled: enabled && !!groupId && !!expenseId,
  });
}

export function useAddExpenseComment(groupId: string, expenseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      try {
        const res = await apiClient.post<any>(
          endpoints.expenses.comments(groupId, expenseId),
          { text },
        );
        return (res.data?.comment ?? res.data) as ExpenseComment;
      } catch (err) {
        logApiError(err, 'useAddExpenseComment');
        throw asExpenseError(err);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.expenses.comments(expenseId) });
    },
  });
}
