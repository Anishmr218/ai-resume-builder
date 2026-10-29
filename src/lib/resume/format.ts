const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Formats a YYYY-MM value without timezone drift. */
export function formatMonth(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return "";
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) return "";
  return `${MONTHS[month - 1]} ${year}`;
}

export function formatDateRange(
  startDate: string,
  endDate: string,
  current = false,
): string {
  const start = formatMonth(startDate);
  const end = current ? "Present" : formatMonth(endDate);
  if (!start && !end) return "";
  if (!start) return end;
  if (!end) return start;
  return `${start} — ${end}`;
}

export function formatStatusDate(value: string | undefined): string {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";

  const diff = Date.now() - date.getTime();
  if (diff < 45_000) return "just now";
  if (diff < 3_600_000) {
    const minutes = Math.max(1, Math.round(diff / 60_000));
    return `${minutes} min ago`;
  }
  if (diff < 86_400_000) {
    const hours = Math.max(1, Math.round(diff / 3_600_000));
    return `${hours} hr ago`;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

/** Returns a safe, clickable href or null. Only http(s) links are allowed. */
export function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)
    ? value
    : `https://${value}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function displayLink(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
}

export function slugify(value: string, fallback = "resume"): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || fallback;
}

export function firstName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}
