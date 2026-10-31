import { Bell, CalendarCheck2, Hourglass, Plus } from "lucide-react";
import Link from "next/link";
import { TestimonialForm } from "@/components/account/account-actions";
import { BookingList } from "@/components/account/booking-list";
import { notificationText } from "@/components/account/notification-text";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { listMyBookings, listMyNotifications } from "@/lib/data/account";
import { formatDateTime } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { fmt } from "@/lib/utils";

export default async function AccountOverview({ params }: PageProps<"/[locale]/account">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const profile = await requireUser(locale, `/${locale}/account`);
  const [bookings, notifications] = await Promise.all([listMyBookings(profile.id, 50), listMyNotifications(profile.id, 6)]);
  const open = bookings.filter((b) => b.status === "pending" || b.status === "under_review").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const unread = notifications.filter((n) => !n.read_at).length;
  const firstName = (profile.full_name || profile.email).split(" ")[0];

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">{fmt(dict.account.welcome, { name: firstName })}</h1>
          <p className="mt-2 text-ink-muted">{dict.account.welcomeLead}</p>
        </div>
        <ButtonLink href={`/${locale}/booking`} variant="accent">
          <Plus aria-hidden /> {dict.account.newRequest}
        </ButtonLink>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: dict.account.activeRequests, value: open, Icon: Hourglass },
          { label: dict.account.confirmedTrips, value: confirmed, Icon: CalendarCheck2 },
          { label: dict.account.unread, value: unread, Icon: Bell },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="rounded-[var(--radius-card)] border border-line bg-paper p-5">
            <Icon className="size-5 text-gold" aria-hidden />
            <p className="mt-3 font-display text-4xl">{value}</p>
            <p className="text-sm text-ink-muted">{label}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-3xl">{dict.account.bookings}</h2>
          {bookings.length > 5 ? (
            <Link href={`/${locale}/account/bookings`} className="text-sm font-semibold text-gold-strong hover:underline">
              {dict.common.viewAll}
            </Link>
          ) : null}
        </div>
        <BookingList bookings={bookings.slice(0, 5)} locale={locale} dict={dict} />
      </section>

      {notifications.length ? (
        <section>
          <h2 className="mb-4 font-display text-3xl">{dict.account.notifications}</h2>
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 rounded-xl border border-line bg-paper px-4 py-3 text-sm">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? "bg-line" : "bg-gold"}`} aria-hidden />
                <div className="flex-1">
                  {n.link ? (
                    <Link href={`/${locale}${n.link}`} className="hover:underline">
                      {notificationText(dict, n.kind, n.payload)}
                    </Link>
                  ) : (
                    notificationText(dict, n.kind, n.payload)
                  )}
                </div>
                <time className="shrink-0 text-xs text-ink-muted">{formatDateTime(n.created_at, locale)}</time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {confirmed > 0 ? (
        <section className="rounded-[var(--radius-card)] border border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-3xl">{dict.account.testimonialTitle}</h2>
          <p className="mt-2 mb-6 text-sm text-ink-muted">{dict.account.testimonialLead}</p>
          <TestimonialForm defaultName={profile.full_name} />
        </section>
      ) : null}
    </div>
  );
}
