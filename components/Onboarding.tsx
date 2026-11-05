"use client";

import { useState } from "react";
import { saveShopSettings } from "@/lib/db";
import { toast } from "sonner";
import { Store, User, ArrowRight } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopName.trim()) {
      toast.error("দোকান/প্রতিষ্ঠানের নাম দিন");
      return;
    }

    setSaving(true);
    try {
      await saveShopSettings({
        shopName: shopName.trim(),
        ownerName: ownerName.trim() || shopName.trim(),
        currency: "BDT",
      });
      toast.success("সেটআপ সম্পন্ন!");
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error("কিছু ভুল হয়েছে, আবার চেষ্টা করুন");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">বাকির খাতা</h1>
          <p className="mt-2 text-sm text-slate-500">
            প্রথমে আপনার দোকান/প্রতিষ্ঠানের তথ্য দিন
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              দোকান / প্রতিষ্ঠানের নাম *
            </label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="যেমন: রহিমের মুদি দোকান"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              মালিকের নাম (ঐচ্ছিক)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="আপনার নাম"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !shopName.trim()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {saving ? (
              "সংরক্ষণ হচ্ছে..."
            ) : (
              <>
                শুরু করুন
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          সব ডাটা আপনার ফোনেই থাকবে। কোনো সার্ভারে যাবে না।
        </p>
      </div>
    </div>
  );
}
