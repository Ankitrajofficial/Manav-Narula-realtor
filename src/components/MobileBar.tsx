import Link from "next/link";
import { site } from "@/data/site";
import Icon from "./Icon";

export default function MobileBar({ enquireHref = "/contact" }: { enquireHref?: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-white md:hidden">
      <a href={site.phoneHref} className="flex items-center justify-center gap-2 py-3.5 text-sm">
        <Icon name="phone" size={18} />Call
      </a>
      <a href={site.whatsappHref} target="_blank" rel="noopener" className="flex items-center justify-center gap-2 border-x border-line py-3.5 text-sm">
        <Icon name="whatsapp" size={18} />WhatsApp
      </a>
      <Link href={enquireHref} className="flex items-center justify-center gap-2 bg-accent py-3.5 text-sm font-medium text-white">
        Enquire
      </Link>
    </div>
  );
}
