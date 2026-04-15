export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface MinimalUser {
  _id: string;
  name?: string;
  fName?: string;
  lName?: string;
}

export interface Cycle {
  _id: string;
  group: string;
  currency: CurrencyCode;
  status: 'active' | 'closed';
  startedAt: string;
  closedAt?: string | null;
  createdBy?: string;
}

export type SplitType = 'equal' | 'custom';

export interface ExpenseSplit {
  user: MinimalUser | string;
  amount: number;
  settled?: boolean;
  settlementStatus?: 'pending' | 'initiated' | 'settled';
}

export interface Expense {
  _id: string;
  group: string;
  cycle: string;
  amount: number;
  category: string;
  note?: string;
  imageUrl?: string | null;
  splitType: SplitType;
  paidBy: MinimalUser | string;
  splits: ExpenseSplit[];
  createdBy: string;
  messageId?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface SimplifiedDebt {
  from: MinimalUser;
  to: MinimalUser;
  amount: number;
}

export interface BalancesResponse {
  cycleId: string;
  currency: CurrencyCode;
  carryForwardIncluded: boolean;
  simplifiedDebts: SimplifiedDebt[];
}

export interface SummaryByCategory {
  category: string;
  total: number;
}

export interface SummaryByMember {
  user: MinimalUser;
  totalPaid: number;
  totalOwed: number;
}

export interface SummaryResponse {
  cycleId: string;
  currency: CurrencyCode;
  totalSpend: number;
  byCategory: SummaryByCategory[];
  byMember: SummaryByMember[];
}

export interface CycleCarryForwardWarning {
  fromUser: MinimalUser | string;
  toUser: MinimalUser | string;
  amount: number;
}

export interface StartCycleResponse {
  warnings: CycleCarryForwardWarning[];
  newCycle: Cycle;
}

export interface CreateExpenseRequest {
  amount: number;
  category: string;
  note?: string;
  imageUrl?: string | null;
  splitType: SplitType;
  memberIds?: string[];
  paidBy: string;
  customSplits?: Array<{ userId: string; amount: number }>;
}

export interface UpdateExpenseRequest extends Partial<CreateExpenseRequest> {}

export type SettlementStatus =
  | 'initiated'
  | 'confirmed'
  | 'cancelled'
  | 'rejected';

export interface Settlement {
  _id: string;
  group: string;
  cycle: string;
  fromUser: MinimalUser | string;
  toUser: MinimalUser | string;
  amount: number;
  status: SettlementStatus;
  initiatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseComment {
  _id: string;
  expense: string;
  user: MinimalUser;
  text: string;
  createdAt: string;
}

export interface ExpenseListFilters {
  cycleId?: string;
  category?: string;
  paidBy?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

/** Payload shape on spend messages (`type === 'spend'`). */
export interface SpendMessageMetadata {
  expenseId: string;
  amount: number;
  currency: CurrencyCode;
  category: string;
  note?: string;
  imageUrl?: string | null;
  splitType: SplitType;
  splitCount: number;
  paidBy: { _id: string; name: string };
  createdBy: string;
  createdAt: string;
}
