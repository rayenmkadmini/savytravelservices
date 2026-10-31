import "server-only";
import { headers } from "next/headers";

/**
 * Best-effort, per-instance rate limiter for public forms. It slows down naive
 * abuse; for multi-instance deployments put a shared limiter (e.g. Upstash,
 * Vercel Firewall rules) in front of the public endpoints as well.
 */
const buckets = new Map<string, number[]>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

export async function rateLimit(scope: string, limit: number, windowMs: number): Promise<boolean> {
  const key = `${scope}:${await clientIp()}`;
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 5000) {
    for (const [k, times] of buckets) if (times.every((t) => now - t > windowMs)) buckets.delete(k);
  }
  return true;
}
