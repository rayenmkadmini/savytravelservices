import "server-only";
import { createClient } from "../supabase/server";
import type { Row } from "../supabase/types";

export type BookingSummary = Pick<
  Row<"bookings">,
  "id" | "reference" | "service_type" | "status" | "payment_status" | "destination" | "departure_date" | "return_date" | "created_at" | "quoted_amount" | "quoted_currency"
> & { package: { title: unknown } | null; hotel: { name: string; city: string } | null };

const summaryColumns =
  "id, reference, service_type, status, payment_status, destination, departure_date, return_date, created_at, quoted_amount, quoted_currency, package:travel_packages(title), hotel:hotels(name, city)";

export async function listMyBookings(userId: string, limit = 50): Promise<BookingSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(summaryColumns)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as BookingSummary[];
}

export async function getMyBooking(userId: string, reference: string) {
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, package:travel_packages(slug, title), hotel:hotels(slug, name, city), room:hotel_rooms(name)")
    .eq("user_id", userId)
    .eq("reference", reference)
    .maybeSingle();
  if (!booking) return null;
  const [passengers, documents, history, payments] = await Promise.all([
    supabase.from("booking_passengers").select("*").eq("booking_id", booking.id).order("created_at"),
    supabase.from("booking_documents").select("*").eq("booking_id", booking.id).order("created_at"),
    supabase.from("booking_status_history").select("*").eq("booking_id", booking.id).order("created_at"),
    supabase.from("payments").select("*").eq("booking_id", booking.id).order("created_at", { ascending: false }),
  ]);
  return {
    booking: booking as Row<"bookings"> & {
      package: { slug: string; title: unknown } | null;
      hotel: { slug: string; name: string; city: string } | null;
      room: { name: unknown } | null;
    },
    passengers: passengers.data ?? [],
    documents: await withSignedUrls(documents.data ?? []),
    history: history.data ?? [],
    payments: payments.data ?? [],
  };
}

export async function listMyVisaRequests(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("visa_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const requests = data ?? [];
  if (!requests.length) return [];
  const { data: docs } = await supabase
    .from("booking_documents")
    .select("*")
    .in(
      "visa_request_id",
      requests.map((r) => r.id),
    );
  const signed = await withSignedUrls(docs ?? []);
  return requests.map((r) => ({ ...r, documents: signed.filter((d) => d.visa_request_id === r.id) }));
}

export async function listMyNotifications(userId: string, limit = 50) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function countUnread(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

/** Short-lived signed URLs for private documents (RLS checks access). */
export async function withSignedUrls<T extends { storage_path: string }>(docs: T[]): Promise<(T & { url: string | null })[]> {
  if (!docs.length) return [];
  const supabase = await createClient();
  const { data } = await supabase.storage.from("documents").createSignedUrls(
    docs.map((d) => d.storage_path),
    60 * 10,
  );
  return docs.map((d) => ({ ...d, url: data?.find((s) => s.path === d.storage_path)?.signedUrl ?? null }));
}
