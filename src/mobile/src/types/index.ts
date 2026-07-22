export interface BillItem {
  id: number;
  name: string;
  price: number;
  isPaid: boolean;
  lockedByUserId: string | null;
  amountPaid: number;
  paidByUserId?: string | null;
}

export interface Participant {
  id: number;
  name: string;
}

export interface TableSession {
  id: string;
  tableName: string;
  totalAmount: number;
  billItems: BillItem[];
  participants?: Participant[];
}

export interface PayPartialRequest {
  itemId: number;
  amount: number;
  userId: string;
}

export interface SplitRemainingRequest {
  userIds: string[];
}

export interface SplitSharedRequest {
  itemId: number;
  userIds: string[];
}

export interface ApplyTaxRequest {
  userBaseShares: Record<string, number>;
  taxPercent: number;
  tipPercent: number;
}

export interface RouletteRequest {
  participantIds: string[];
}

export interface RouletteResult {
  loserUserId: string;
  itemId: number;
  amount: number;
  itemName: string;
}

export interface ReceiptItem {
  name: string;
  price: number;
}

export interface ReceiptResponse {
  transactionId: string;
  date: string;
  baseTotal: number;
  taxAndTip: number;
  grandTotal: number;
  items: ReceiptItem[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  splitBreakdown?: Record<string, number>;
  rouletteResult?: RouletteResult;
  receipt?: ReceiptResponse;
}
