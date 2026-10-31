/**
 * Database security integration tests.
 *
 * Runs against a real Supabase stack (local: `supabase start`).
 * Env: SUPABASE_TEST_* or the regular NEXT_PUBLIC_SUPABASE_* / SUPABASE_SERVICE_ROLE_KEY
 * Run: npm run test:integration
 */
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Defaults to the app's own env (.env.local). Point it at a LOCAL or staging stack only.
const url = (process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)!;
const anonKey = (process.env.SUPABASE_TEST_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
const serviceKey = (process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!;

const service = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

const run = randomUUID().slice(0, 8);
const password = `Test-${randomUUID()}`;
const createdUsers: string[] = [];

async function makeUser(label: string, role?: "admin" | "super_admin") {
  const email = `${label}-${run}@savy.test`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `${label} ${run}` },
  });
  if (error) throw error;
  createdUsers.push(data.user.id);
  if (role) {
    const { error: roleError } = await service.from("profiles").update({ role }).eq("id", data.user.id);
    if (roleError) throw roleError;
  }
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: data.user.id, email, client };
}

type User = Awaited<ReturnType<typeof makeUser>>;
let alice: User;
let bob: User;
let admin: User;
let superAdmin: User;

const bookingInput = (overrides: Record<string, unknown> = {}) => ({
  service_type: "package",
  destination: "Djerba",
  adults: 2,
  contact_name: "Alice Test",
  contact_email: "alice@example.com",
  contact_phone: "+216 20 000 000",
  ...overrides,
});

beforeAll(async () => {
  [alice, bob, admin, superAdmin] = await Promise.all([
    makeUser("alice"),
    makeUser("bob"),
    makeUser("admin", "admin"),
    makeUser("super", "super_admin"),
  ]);
});

afterAll(async () => {
  for (const id of createdUsers) {
    const { data: rows } = await service.from("bookings").select("id").eq("user_id", id);
    const ids = (rows ?? []).map((r) => r.id);
    if (ids.length) await service.from("payments").delete().in("booking_id", ids);
    await service.from("bookings").delete().eq("user_id", id);
    const { data: files } = await service.storage.from("documents").list(`${id}/booking`);
    for (const folder of files ?? []) {
      const { data: inner } = await service.storage.from("documents").list(`${id}/booking/${folder.name}`);
      await service.storage
        .from("documents")
        .remove((inner ?? []).map((f) => `${id}/booking/${folder.name}/${f.name}`));
    }
  }
  for (const id of createdUsers) {
    await service.auth.admin.deleteUser(id);
  }
});

describe("profiles & roles", () => {
  it("creates a customer profile on sign-up", async () => {
    const { data } = await alice.client.from("profiles").select("role, full_name").eq("id", alice.id).single();
    expect(data?.role).toBe("customer");
    expect(data?.full_name).toContain("alice");
  });

  it("prevents customers from escalating their own role", async () => {
    const { error } = await alice.client.from("profiles").update({ role: "super_admin" }).eq("id", alice.id);
    expect(error).not.toBeNull();
    const { data } = await service.from("profiles").select("role").eq("id", alice.id).single();
    expect(data?.role).toBe("customer");
  });

  it("prevents admins from changing roles", async () => {
    const { error } = await admin.client.from("profiles").update({ role: "admin" }).eq("id", bob.id);
    expect(error?.message).toMatch(/super admin/i);
  });

  it("lets a super admin change another user's role but not their own", async () => {
    const promote = await superAdmin.client.from("profiles").update({ role: "admin" }).eq("id", bob.id);
    expect(promote.error).toBeNull();
    const demote = await superAdmin.client.from("profiles").update({ role: "customer" }).eq("id", bob.id);
    expect(demote.error).toBeNull();
    const self = await superAdmin.client.from("profiles").update({ role: "customer" }).eq("id", superAdmin.id);
    expect(self.error?.message).toMatch(/own role/i);
  });

  it("hides other users' profiles from customers", async () => {
    const { data } = await alice.client.from("profiles").select("id");
    expect(data?.map((p) => p.id)).toEqual([alice.id]);
  });

  it("lets customers edit their own profile details", async () => {
    const { error } = await alice.client.from("profiles").update({ phone: "+216 99 999 999" }).eq("id", alice.id);
    expect(error).toBeNull();
  });
});

describe("catalog visibility", () => {
  const slug = `hidden-${run}`;
  beforeAll(async () => {
    await service.from("destinations").insert([
      { slug, name: { fr: "Caché" }, country: { fr: "Tunisie" }, is_published: false },
      { slug: `${slug}-pub`, name: { fr: "Publié" }, country: { fr: "Tunisie" }, is_published: true },
    ]);
  });
  afterAll(async () => {
    await service.from("destinations").delete().like("slug", `${slug}%`);
  });

  it("shows only published destinations to visitors", async () => {
    const { data } = await anon.from("destinations").select("slug").like("slug", `${slug}%`);
    expect(data?.map((d) => d.slug)).toEqual([`${slug}-pub`]);
  });

  it("shows drafts to admins", async () => {
    const { data } = await admin.client.from("destinations").select("slug").like("slug", `${slug}%`);
    expect(data).toHaveLength(2);
  });

  it("rejects catalog writes from customers", async () => {
    const { error } = await alice.client
      .from("destinations")
      .insert({ slug: `${slug}-x`, name: { fr: "X" }, country: { fr: "Y" }, is_published: true });
    expect(error).not.toBeNull();
  });

  it("requires a French value for multilingual fields", async () => {
    const { error } = await admin.client
      .from("destinations")
      .insert({ slug: `${slug}-nofr`, name: { en: "Only English" }, country: { fr: "Tunisie" } });
    expect(error?.message).toMatch(/check constraint/i);
  });
});

describe("booking requests", () => {
  let bookingId: string;
  let reference: string;

  it("forces new customer requests to pending / unpaid / unpriced", async () => {
    const { data, error } = await alice.client
      .from("bookings")
      .insert(
        bookingInput({
          status: "confirmed",
          payment_status: "paid",
          quoted_amount: 1,
          user_id: bob.id,
        }),
      )
      .select("id, reference, status, payment_status, quoted_amount, user_id")
      .single();
    // user_id is overwritten by the trigger, then must satisfy RLS
    expect(error).toBeNull();
    expect(data?.status).toBe("pending");
    expect(data?.payment_status).toBe("unpaid");
    expect(data?.quoted_amount).toBeNull();
    expect(data?.user_id).toBe(alice.id);
    expect(data?.reference).toMatch(/^SAVY-\d{4}-\d{5}$/);
    bookingId = data!.id;
    reference = data!.reference;
  });

  it("rejects past departure dates", async () => {
    const { error } = await alice.client
      .from("bookings")
      .insert(bookingInput({ departure_date: "2020-01-01" }));
    expect(error?.message).toMatch(/past/i);
  });

  it("notifies the customer and records history", async () => {
    const { data: notes } = await alice.client.from("notifications").select("kind, payload");
    expect(notes?.some((n) => n.kind === "booking_received" && n.payload.reference === reference)).toBe(true);
    const { data: history } = await alice.client
      .from("booking_status_history")
      .select("to_status")
      .eq("booking_id", bookingId);
    expect(history?.[0]?.to_status).toBe("pending");
  });

  it("isolates bookings between customers", async () => {
    const { data } = await bob.client.from("bookings").select("id").eq("id", bookingId);
    expect(data).toEqual([]);
    const { data: anonData } = await anon.from("bookings").select("id");
    expect(anonData).toEqual([]);
  });

  it("does not let customers change status directly", async () => {
    await alice.client.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
    const { data } = await service.from("bookings").select("status").eq("id", bookingId).single();
    expect(data?.status).toBe("pending");
  });

  it("lets customers add passengers to their own pending request only", async () => {
    const own = await alice.client
      .from("booking_passengers")
      .insert({ booking_id: bookingId, full_name: "Alice Test" });
    expect(own.error).toBeNull();
    const other = await bob.client
      .from("booking_passengers")
      .insert({ booking_id: bookingId, full_name: "Intruder" });
    expect(other.error).not.toBeNull();
  });

  it("requires a quote before confirming", async () => {
    const { error } = await admin.client.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
    expect(error?.message).toMatch(/bookings_confirmed_needs_quote/);
  });

  it("lets admins review and confirm with a quote", async () => {
    const review = await admin.client.from("bookings").update({ status: "under_review" }).eq("id", bookingId);
    expect(review.error).toBeNull();
    const confirm = await admin.client
      .from("bookings")
      .update({ status: "confirmed", quoted_amount: 1500, customer_message: "Prix confirmé" })
      .eq("id", bookingId);
    expect(confirm.error).toBeNull();
    const { data } = await alice.client.from("notifications").select("kind, payload").eq("kind", "booking_status");
    expect(data?.some((n) => n.payload.status === "confirmed")).toBe(true);
  });

  it("blocks customer cancellation once confirmed", async () => {
    const { error } = await alice.client.rpc("cancel_my_booking", { booking_reference: reference });
    expect(error?.message).toMatch(/no longer be cancelled/i);
  });

  it("hides internal notes from customers", async () => {
    const insert = await admin.client
      .from("booking_notes")
      .insert({ booking_id: bookingId, author_id: admin.id, body: "VIP client" });
    expect(insert.error).toBeNull();
    const { data } = await alice.client.from("booking_notes").select("id");
    expect(data).toEqual([]);
  });

  it("does not let admins mark online payments as completed", async () => {
    const direct = await admin.client
      .from("payments")
      .insert({ booking_id: bookingId, provider: "konnect", status: "completed", amount: 1500 });
    expect(direct.error?.message).toMatch(/pending/i);

    const pending = await admin.client
      .from("payments")
      .insert({ booking_id: bookingId, provider: "konnect", amount: 1500, provider_payment_id: `ref-${run}` })
      .select("id")
      .single();
    expect(pending.error).toBeNull();
    const tamper = await admin.client.from("payments").update({ status: "completed" }).eq("id", pending.data!.id);
    expect(tamper.error?.message).toMatch(/provider verification/i);

    const { data: booking } = await service.from("bookings").select("payment_status").eq("id", bookingId).single();
    expect(booking?.payment_status).toBe("awaiting_payment");
  });

  it("does not let admins set payment_status by hand", async () => {
    const { error } = await admin.client.from("bookings").update({ payment_status: "paid" }).eq("id", bookingId);
    expect(error?.message).toMatch(/verified payments/i);
  });

  it("marks the booking paid when the server verifies the provider payment", async () => {
    const { error } = await service
      .from("payments")
      .update({ status: "completed" })
      .eq("provider_payment_id", `ref-${run}`);
    expect(error).toBeNull();
    const { data } = await alice.client.from("bookings").select("payment_status").eq("id", bookingId).single();
    expect(data?.payment_status).toBe("paid");
    const { data: payments } = await alice.client.from("payments").select("status, verified_at");
    expect(payments?.[0]?.verified_at).not.toBeNull();
  });

  it("supports manual (bank transfer) payments recorded by staff", async () => {
    const { data: second } = await alice.client
      .from("bookings")
      .insert(bookingInput({ service_type: "hotel" }))
      .select("id")
      .single();
    await admin.client.from("bookings").update({ status: "confirmed", quoted_amount: 400 }).eq("id", second!.id);
    const partial = await admin.client
      .from("payments")
      .insert({ booking_id: second!.id, provider: "bank_transfer", status: "completed", amount: 100 });
    expect(partial.error).toBeNull();
    let { data } = await service.from("bookings").select("payment_status").eq("id", second!.id).single();
    expect(data?.payment_status).toBe("partially_paid");
    await admin.client
      .from("payments")
      .insert({ booking_id: second!.id, provider: "cash", status: "completed", amount: 300 });
    ({ data } = await service.from("bookings").select("payment_status").eq("id", second!.id).single());
    expect(data?.payment_status).toBe("paid");
  });

  it("rejects invalid status transitions", async () => {
    const { data: third } = await alice.client
      .from("bookings")
      .insert(bookingInput())
      .select("id, reference")
      .single();
    const cancel = await alice.client.rpc("cancel_my_booking", { booking_reference: third!.reference });
    expect(cancel.error).toBeNull();
    const reopen = await admin.client.from("bookings").update({ status: "pending" }).eq("id", third!.id);
    expect(reopen.error?.message).toMatch(/invalid booking status transition/i);
  });

  it("lets customers only toggle read state on notifications", async () => {
    const { data: note } = await alice.client.from("notifications").select("id").limit(1).single();
    await alice.client
      .from("notifications")
      .update({ read_at: new Date().toISOString(), kind: "hacked" })
      .eq("id", note!.id);
    const { data } = await service.from("notifications").select("kind, read_at").eq("id", note!.id).single();
    expect(data?.kind).not.toBe("hacked");
    expect(data?.read_at).not.toBeNull();
  });
});

describe("visa requests", () => {
  it("creates pending requests with a reference and isolates them", async () => {
    const { data, error } = await alice.client
      .from("visa_requests")
      .insert({
        destination_country: "France",
        nationality: "Tunisienne",
        contact_name: "Alice",
        contact_email: "alice@example.com",
        contact_phone: "+216 20 000 000",
        status: "completed",
        service_fee: 0,
      })
      .select("reference, status, service_fee")
      .single();
    expect(error).toBeNull();
    expect(data?.status).toBe("pending");
    expect(data?.service_fee).toBeNull();
    expect(data?.reference).toMatch(/^VISA-\d{4}-\d{5}$/);
    const { data: other } = await bob.client.from("visa_requests").select("id");
    expect(other).toEqual([]);
  });
});

describe("documents storage", () => {
  let bookingId: string;
  const file = new Blob(["%PDF-1.4 test"], { type: "application/pdf" });

  beforeAll(async () => {
    const { data } = await alice.client.from("bookings").insert(bookingInput()).select("id").single();
    bookingId = data!.id;
  });

  it("lets a customer upload into their own folder only", async () => {
    const own = await alice.client.storage
      .from("documents")
      .upload(`${alice.id}/booking/${bookingId}/passport.pdf`, file, { contentType: "application/pdf" });
    expect(own.error).toBeNull();
    const foreign = await alice.client.storage
      .from("documents")
      .upload(`${bob.id}/booking/${bookingId}/evil.pdf`, file, { contentType: "application/pdf" });
    expect(foreign.error).not.toBeNull();
  });

  it("rejects disallowed file types", async () => {
    const { error } = await alice.client.storage
      .from("documents")
      .upload(`${alice.id}/booking/${bookingId}/script.html`, new Blob(["<script>"], { type: "text/html" }), {
        contentType: "text/html",
      });
    expect(error).not.toBeNull();
  });

  it("keeps documents private to the owner and admins", async () => {
    const path = `${alice.id}/booking/${bookingId}/passport.pdf`;
    const record = await alice.client.from("booking_documents").insert({
      user_id: alice.id,
      booking_id: bookingId,
      storage_path: path,
      file_name: "passport.pdf",
      mime_type: "application/pdf",
      size_bytes: 13,
      kind: "passport",
    });
    expect(record.error).toBeNull();
    expect((await bob.client.storage.from("documents").download(path)).error).not.toBeNull();
    expect((await anon.storage.from("documents").download(path)).error).not.toBeNull();
    expect((await admin.client.storage.from("documents").download(path)).error).toBeNull();
    const { data: bobRows } = await bob.client.from("booking_documents").select("id");
    expect(bobRows).toEqual([]);
  });

  it("restricts the public media bucket to admins for writes", async () => {
    const img = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" });
    const customer = await alice.client.storage.from("media").upload(`test-${run}.jpg`, img, { contentType: "image/jpeg" });
    expect(customer.error).not.toBeNull();
    const staff = await admin.client.storage.from("media").upload(`test-${run}.jpg`, img, { contentType: "image/jpeg" });
    expect(staff.error).toBeNull();
    await admin.client.storage.from("media").remove([`test-${run}.jpg`]);
  });
});

describe("public forms", () => {
  it("accepts contact messages from visitors but never exposes them", async () => {
    const { error } = await anon.from("contact_messages").insert({
      full_name: "Visitor",
      email: "visitor@example.com",
      message: "Bonjour, je souhaite un devis pour Istanbul.",
    });
    expect(error).toBeNull();
    const { data } = await anon.from("contact_messages").select("id");
    expect(data).toEqual([]);
    const { data: customerView } = await alice.client.from("contact_messages").select("id");
    expect(customerView).toEqual([]);
  });

  it("subscribes to the newsletter idempotently through the RPC only", async () => {
    const email = `news-${run}@example.com`;
    expect((await anon.rpc("subscribe_newsletter", { subscriber_email: email })).error).toBeNull();
    expect((await anon.rpc("subscribe_newsletter", { subscriber_email: email.toUpperCase() })).error).toBeNull();
    expect((await anon.rpc("subscribe_newsletter", { subscriber_email: "not-an-email" })).error).not.toBeNull();
    const { data } = await anon.from("newsletter_subscribers").select("id");
    expect(data).toEqual([]);
    const { count } = await service
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .ilike("email", email);
    expect(count).toBe(1);
    await service.from("newsletter_subscribers").delete().ilike("email", email);
  });

  it("hides non-public settings and blocks visitor writes", async () => {
    await service.from("website_settings").upsert({ key: `secret_${run}`, value: { a: 1 }, is_public: false });
    const { data } = await anon.from("website_settings").select("key").eq("key", `secret_${run}`);
    expect(data).toEqual([]);
    const write = await alice.client.from("website_settings").update({ value: {} }).eq("key", "contact");
    expect(write.data ?? []).toEqual([]);
    const { data: contact } = await anon.from("website_settings").select("value").eq("key", "contact").single();
    expect(contact?.value.email).toBe("contact@savytravelservices.tn");
    await service.from("website_settings").delete().eq("key", `secret_${run}`);
  });

  it("restricts dashboard statistics to admins", async () => {
    expect((await alice.client.rpc("admin_dashboard_stats")).error).not.toBeNull();
    const { data, error } = await admin.client.rpc("admin_dashboard_stats");
    expect(error).toBeNull();
    expect(data).toHaveProperty("bookings_total");
  });
});
