import Dexie, { Table } from "dexie";
import { v4 as uuidv4 } from "uuid";
import type {
  Customer,
  Transaction,
  Setting,
  ShopSettings,
  CustomerWithBalance,
  ExportData,
  MonthlySummary,
} from "@/types";

// ─────────────────────────────────────────────
// Dexie Database
// ─────────────────────────────────────────────

class BakiKhataDB extends Dexie {
  customers!: Table<Customer, string>;
  transactions!: Table<Transaction, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super("BakiKhataDB");
    this.version(1).stores({
      customers: "id, name, phone, createdAt, updatedAt",
      transactions: "id, customerId, type, date, createdAt",
      settings: "key",
    });
  }
}

export const db = new BakiKhataDB();

// ─────────────────────────────────────────────
// Repository Layer (all DB access goes through here)
// ─────────────────────────────────────────────

// ---------- Customers ----------

export async function addCustomer(
  data: Omit<Customer, "id" | "createdAt" | "updatedAt">
): Promise<Customer> {
  const now = new Date().toISOString();
  const customer: Customer = {
    id: uuidv4(),
    ...data,
    name: data.name.trim(),
    phone: data.phone.trim(),
    address: data.address?.trim() || undefined,
    note: data.note?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  await db.customers.add(customer);
  return customer;
}

export async function updateCustomer(
  id: string,
  updates: Partial<Omit<Customer, "id" | "createdAt">>
): Promise<void> {
  const existing = await db.customers.get(id);
  if (!existing) throw new Error("Customer not found");

  await db.customers.update(id, {
    ...updates,
    name: updates.name?.trim() ?? existing.name,
    phone: updates.phone?.trim() ?? existing.phone,
    address: updates.address?.trim() || undefined,
    note: updates.note?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await db.transaction("rw", db.customers, db.transactions, async () => {
    await db.transactions.where("customerId").equals(id).delete();
    await db.customers.delete(id);
  });
}

export async function listCustomers(): Promise<Customer[]> {
  return db.customers.orderBy("name").toArray();
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  return db.customers.get(id);
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const q = query.trim().toLowerCase();
  if (!q) return listCustomers();

  return db.customers
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address?.toLowerCase().includes(q) ?? false)
    )
    .toArray();
}

// ---------- Transactions ----------

export async function addTransaction(
  data: Omit<Transaction, "id" | "createdAt">
): Promise<Transaction> {
  const tx: Transaction = {
    id: uuidv4(),
    ...data,
    amount: Number(data.amount),
    note: data.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  await db.transactions.add(tx);

  // Touch customer updatedAt
  await db.customers.update(data.customerId, {
    updatedAt: new Date().toISOString(),
  });

  return tx;
}

export async function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, "id" | "createdAt" | "customerId">>
): Promise<void> {
  const existing = await db.transactions.get(id);
  if (!existing) throw new Error("Transaction not found");

  await db.transactions.update(id, {
    ...updates,
    amount: updates.amount !== undefined ? Number(updates.amount) : existing.amount,
    note: updates.note?.trim() || undefined,
  });

  await db.customers.update(existing.customerId, {
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  const existing = await db.transactions.get(id);
  if (!existing) return;

  await db.transactions.delete(id);
  await db.customers.update(existing.customerId, {
    updatedAt: new Date().toISOString(),
  });
}

export async function listTransactions(
  customerId?: string
): Promise<Transaction[]> {
  if (customerId) {
    return db.transactions
      .where("customerId")
      .equals(customerId)
      .reverse()
      .sortBy("date");
  }
  return db.transactions.orderBy("date").reverse().toArray();
}

export async function getRecentTransactions(limit = 10): Promise<Transaction[]> {
  return db.transactions.orderBy("createdAt").reverse().limit(limit).toArray();
}

// ---------- Balance ----------

export async function getBalance(customerId: string): Promise<number> {
  const txs = await db.transactions.where("customerId").equals(customerId).toArray();
  let balance = 0;
  for (const t of txs) {
    if (t.type === "due") balance += t.amount;
    else balance -= t.amount;
  }
  return balance;
}

export async function getCustomersWithBalance(): Promise<CustomerWithBalance[]> {
  const customers = await listCustomers();
  const result: CustomerWithBalance[] = [];

  for (const c of customers) {
    const balance = await getBalance(c.id);
    result.push({ ...c, balance });
  }

  // Highest due first
  return result.sort((a, b) => b.balance - a.balance);
}

export async function getTotalDue(): Promise<number> {
  const all = await getCustomersWithBalance();
  return all.reduce((sum, c) => sum + Math.max(0, c.balance), 0);
}

export async function getTotalReceivedThisMonth(): Promise<number> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based

  const txs = await db.transactions
    .where("type")
    .equals("payment")
    .toArray();

  return txs
    .filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

// ---------- Settings ----------

export async function getSetting(key: string): Promise<string | undefined> {
  const row = await db.settings.get(key);
  return row?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}

export async function getShopSettings(): Promise<ShopSettings> {
  const [shopName, ownerName, currency, lastBackupAt] = await Promise.all([
    getSetting("shopName"),
    getSetting("ownerName"),
    getSetting("currency"),
    getSetting("lastBackupAt"),
  ]);

  return {
    shopName: shopName || "",
    ownerName: ownerName || "",
    currency: currency || "BDT",
    lastBackupAt: lastBackupAt || undefined,
  };
}

export async function saveShopSettings(
  data: Partial<ShopSettings>
): Promise<void> {
  if (data.shopName !== undefined) await setSetting("shopName", data.shopName);
  if (data.ownerName !== undefined) await setSetting("ownerName", data.ownerName);
  if (data.currency !== undefined) await setSetting("currency", data.currency);
  if (data.lastBackupAt !== undefined)
    await setSetting("lastBackupAt", data.lastBackupAt);
}

export async function isOnboarded(): Promise<boolean> {
  const shopName = await getSetting("shopName");
  return Boolean(shopName && shopName.trim().length > 0);
}

// ---------- Reports ----------

export async function getMonthlySummary(
  year: number,
  month: number // 1-12
): Promise<MonthlySummary> {
  const txs = await db.transactions.toArray();
  let totalDue = 0;
  let totalPayment = 0;
  let count = 0;

  for (const t of txs) {
    const d = new Date(t.date);
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      count++;
      if (t.type === "due") totalDue += t.amount;
      else totalPayment += t.amount;
    }
  }

  return {
    year,
    month,
    totalDue,
    totalPayment,
    net: totalDue - totalPayment,
    transactionCount: count,
  };
}

// ---------- Backup / Restore ----------

export async function exportAll(): Promise<ExportData> {
  const [customers, transactions, settings] = await Promise.all([
    db.customers.toArray(),
    db.transactions.toArray(),
    db.settings.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    customers,
    transactions,
    settings,
  };
}

export async function importAll(data: ExportData): Promise<void> {
  if (!data || data.version !== 1) {
    throw new Error("Invalid backup file format");
  }

  await db.transaction(
    "rw",
    db.customers,
    db.transactions,
    db.settings,
    async () => {
      await db.customers.clear();
      await db.transactions.clear();
      await db.settings.clear();

      if (data.customers?.length) await db.customers.bulkAdd(data.customers);
      if (data.transactions?.length)
        await db.transactions.bulkAdd(data.transactions);
      if (data.settings?.length) await db.settings.bulkAdd(data.settings);
    }
  );

  // Mark backup time
  await setSetting("lastBackupAt", new Date().toISOString());
}

export async function needsBackupReminder(): Promise<boolean> {
  const last = await getSetting("lastBackupAt");
  if (!last) return true;

  const lastDate = new Date(last);
  const now = new Date();
  const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 7;
}
