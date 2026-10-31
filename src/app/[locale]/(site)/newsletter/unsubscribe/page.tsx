import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/[locale]/newsletter/unsubscribe">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return pageMetadata({ locale, dict, path: "/newsletter/unsubscribe", title: dict.newsletter.unsubscribedTitle, noIndex: true });
}

export default async function UnsubscribePage({ params, searchParams }: PageProps<"/[locale]/newsletter/unsubscribe">) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const { token } = await searchParams;
  let ok = false;
  if (typeof token === "string" && /^[0-9a-f-]{36}$/i.test(token) && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("unsubscribe_newsletter", { token });
    ok = data === true;
  }
  return (
    <>
      <PageHero title={dict.newsletter.unsubscribedTitle} compact />
      <div className="container-page py-14">
        <p role="status" className={`mx-auto max-w-xl rounded-[var(--radius-card)] p-6 ${ok ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
          {ok ? dict.newsletter.unsubscribed : dict.newsletter.unsubscribeInvalid}
        </p>
      </div>
    </>
  );
}
