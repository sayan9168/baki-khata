import { format, parseISO, isValid } from "date-fns";
import { bn } from "date-fns/locale";

/** Convert English digits 0-9 → Bengali ০-৯ (display only) */
export function toBengaliDigits(input: string | number): string {
  const str = String(input);
  const map: Record<string, string> = {
    "0": "০",
    "1": "১",
    "2": "২",
    "3": "৩",
    "4": "৪",
    "5": "৫",
    "6": "৬",
    "7": "৭",
    "8": "৮",
    "9": "৯",
  };
  return str.replace(/[0-9]/g, (d) => map[d] ?? d);
}

/** Format number as BDT currency with Bengali digits */
export function formatCurrency(amount: number, withSymbol = true): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
  const bengali = toBengaliDigits(formatted);
  const sign = amount < 0 ? "-" : "";
  return withSymbol ? `${sign}৳${bengali}` : `${sign}${bengali}`;
}

/** Format ISO date → Bengali readable (e.g. ০৫ নভেম্বর ২০২৬) */
export function formatDateBn(iso: string | Date, pattern = "dd MMMM yyyy"): string {
  try {
    const date = typeof iso === "string" ? parseISO(iso) : iso;
    if (!isValid(date)) return toBengaliDigits(String(iso));
    const eng = format(date, pattern, { locale: bn });
    return toBengaliDigits(eng);
  } catch {
    return toBengaliDigits(String(iso));
  }
}

/** Short date for lists (dd/MM/yyyy in Bengali digits) */
export function formatDateShort(iso: string | Date): string {
  return formatDateBn(iso, "dd/MM/yyyy");
}

/** Relative-ish label for transaction date */
export function formatDateLabel(iso: string): string {
  try {
    const date = parseISO(iso);
    if (!isValid(date)) return formatDateShort(iso);
    const today = new Date();
    const diffDays = Math.floor(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "আজ";
    if (diffDays === 1) return "গতকাল";
    if (diffDays < 7) return `${toBengaliDigits(diffDays)} দিন আগে`;
    return formatDateShort(iso);
  } catch {
    return formatDateShort(iso);
  }
}

/** Phone number display helper (keeps +880 etc, only digits → Bengali) */
export function formatPhone(phone: string): string {
  return toBengaliDigits(phone);
}
