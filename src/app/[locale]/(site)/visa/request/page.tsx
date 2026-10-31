import { LockKeyhole } from "lucide-react";
import type { Metadata } from "next";
import { VisaForm } from "@/components/booking/visa-form";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import { getVisaCountry, listVisaCountries } from "@/lib/data/catalog";
import { todayInTunis, tr } from "@/lib/format";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/visa/request">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/visa/request", title: dict.visa.formTitle, description: dict.visa.formLead });
}

export default async function VisaRequestPage({ params, searchParams }: PageProps<"/[locale]/visa/request">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  const country = typeof sp.country === "string" ? sp.country : undefined;
  const type = typeof sp.type === "string" ? sp.type : undefined;

  const countries = await listVisaCountries();
  const options = await Promise.all(
    countries.map(async (c) => {
      const full = await getVisaCountry(c.slug);
      return {
        id: c.id,
        slug: c.slug,
        name: tr(c.name, locale),
        types: (full?.types ?? []).map((t) => ({ id: t.id, name: tr(t.name, locale), category: t.category })),
      };
    }),
  );
  const next = `/${locale}/visa/request${country ? `?country=${country}` : ""}`;

  return (
    <>
      <PageHero eyebrow={dict.visa.title} title={dict.visa.formTitle} lead={dict.visa.formLead} compact />
      <div className="container-page py-12">
        <div className="mx-auto max-w-4xl rounded-[var(--radius-card)] border border-line bg-paper p-6 shadow-soft sm:p-10">
          {profile ? (
            <VisaForm
              countries={options}
              initialCountry={country}
              initialType={type}
              userId={profile.id}
              today={todayInTunis()}
              contact={{ name: profile.full_name, email: profile.email, phone: profile.phone ?? "", nationality: profile.nationality ?? "" }}
            />
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-gold-soft text-gold-strong">
                <LockKeyhole className="size-6" aria-hidden />
              </span>
              <h2 className="mt-5 font-display text-3xl">{dict.booking.loginTitle}</h2>
              <p className="mt-3 max-w-md text-ink-muted">{dict.booking.loginText}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href={`/${locale}/login?next=${encodeURIComponent(next)}`} size="lg">
                  {dict.nav.login}
                </ButtonLink>
                <ButtonLink href={`/${locale}/register?next=${encodeURIComponent(next)}`} variant="outline" size="lg">
                  {dict.nav.register}
                </ButtonLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
