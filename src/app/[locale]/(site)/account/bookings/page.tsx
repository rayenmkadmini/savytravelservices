import { Plus } from "lucide-react";
import { BookingList } from "@/components/account/booking-list";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { listMyBookings } from "@/lib/data/account";
import { getDictionary, resolveLocale } from "@/lib/i18n";

export default async function MyBookingsPage({ params }: PageProps<"/[locale]/account/bookings">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const profile = await requireUser(locale, `/${locale}/account/bookings`);
  const bookings = await listMyBookings(profile.id, 200);
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <h1 className="font-display text-4xl">{dict.account.bookings}</h1>
        <ButtonLink href={`/${locale}/booking`} variant="accent" size="sm">
          <Plus aria-hidden /> {dict.account.newRequest}
        </ButtonLink>
      </header>
      <BookingList bookings={bookings} locale={locale} dict={dict} />
    </div>
  );
}
