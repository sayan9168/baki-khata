"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getTotalDue,
  getTotalReceivedThisMonth,
  getCustomersWithBalance,
  getRecentTransactions,
  isOnboarded,
  listCustomers,
} from "@/lib/db";
import { formatCurrency, formatDateLabel, toBengaliDigits } from "@/lib/format";
import type { CustomerWithBalance, Transaction } from "@/types";
import { Onboarding } from "@/components/Onboarding";
import {
  Wallet,
  TrendingUp,
  Users,
  ArrowRight,
  Plus,
  Receipt,
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [totalDue, setTotalDue] = useState(0);
  const [receivedThisMonth, setReceivedThisMonth] = useState(0);
  const [topCustomers, setTopCustomers] = useState<CustomerWithBalance[]>([]);
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const isDone = await isOnboarded();
      setOnboarded(isDone);

      if (!isDone) {
        setLoading(false);
        return;
      }

      const [due, received, customers, txs, allCustomers] = await Promise.all([
        getTotalDue(),
        getTotalReceivedThisMonth(),
        getCustomersWithBalance(),
        getRecentTransactions(10),
        listCustomers(),
      ]);

      setTotalDue(due);
      setReceivedThisMonth(received);
      setTopCustomers(customers.filter((c) => c.balance > 0).slice(0, 5));
      setRecentTxs(txs);

      const map: Record<string, string> = {};
      allCustomers.forEach((c) => {
        map[c.id] = c.name;
      });
      setCustomerMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-teal-700 font-medium">লোড হচ্ছে...</div>
      </div>
    );
  }

  if (!onboarded) {
    return <Onboarding onComplete={loadData} />;
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ড্যাশবোর্ড</h1>
          <p className="text-sm text-slate-500 mt-0.5">বাকির খাতা</p>
        </div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition"
        >
          <Plus className="h-4 w-4" />
          নতুন
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-4 text-white shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5 opacity-90" />
            <span className="text-sm font-medium opacity-90">মোট বাকি</span>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {formatCurrency(totalDue)}
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-4 text-white shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 opacity-90" />
            <span className="text-sm font-medium opacity-90">এই মাসে পেয়েছি</span>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {formatCurrency(receivedThisMonth)}
          </p>
        </div>
      </div>

      {/* Top Debtors */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" />
            সবচেয়ে বেশি বাকি
          </h2>
          <Link
            href="/customers"
            className="text-sm text-teal-600 font-medium flex items-center gap-0.5"
          >
            সব দেখুন
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {topCustomers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-500 text-sm">এখনো কোনো বাকি নেই</p>
            <Link
              href="/customers"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-600"
            >
              <Plus className="h-4 w-4" />
              গ্রাহক যোগ করুন
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {topCustomers.map((c, idx) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="flex items-center justify-between rounded-xl bg-white border border-slate-100 px-4 py-3 shadow-sm hover:border-teal-200 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                    {toBengaliDigits(idx + 1)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.phone}</p>
                  </div>
                </div>
                <p className="font-semibold text-rose-600">
                  {formatCurrency(c.balance)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-teal-600" />
            সাম্প্রতিক লেনদেন
          </h2>
        </div>

        {recentTxs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-500 text-sm">কোনো লেনদেন নেই</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTxs.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl bg-white border border-slate-100 px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {customerMap[tx.customerId] || "অজানা"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatDateLabel(tx.date)}
                    {tx.note ? ` · ${tx.note}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      tx.type === "due" ? "text-rose-600" : "text-teal-600"
                    }`}
                  >
                    {tx.type === "due" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {tx.type === "due" ? "বাকি" : "পেমেন্ট"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
