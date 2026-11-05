export type TransactionType = "due" | "payment";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  note?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  note?: string;
  date: string; // ISO date (YYYY-MM-DD or full ISO)
  createdAt: string; // ISO
}

export interface Setting {
  key: string;
  value: string;
}

export interface ShopSettings {
  shopName: string;
  ownerName: string;
  currency: string; // "BDT"
  lastBackupAt?: string; // ISO
}

export interface CustomerWithBalance extends Customer {
  balance: number;
}

export interface MonthlySummary {
  year: number;
  month: number; // 1-12
  totalDue: number;
  totalPayment: number;
  net: number;
  transactionCount: number;
}

export interface ExportData {
  version: number;
  exportedAt: string;
  customers: Customer[];
  transactions: Transaction[];
  settings: Setting[];
}
