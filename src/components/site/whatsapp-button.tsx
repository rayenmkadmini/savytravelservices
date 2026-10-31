"use client";

import { useI18n } from "@/lib/i18n/client";
import { WhatsappIcon } from "./social-icons";

export function WhatsappButton({ href }: { href: string }) {
  const { dict } = useI18n();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={dict.common.sendWhatsApp}
      className="fixed end-5 bottom-5 z-40 grid size-14 place-items-center rounded-full bg-[#1f9d55] text-white shadow-lift transition-transform hover:scale-105"
    >
      <WhatsappIcon className="size-7" />
    </a>
  );
}
