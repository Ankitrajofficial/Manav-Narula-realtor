import Image from "next/image";

/** The Manav Narula Realtor logo mark (gold on navy), used wherever the brand appears as an icon. */
export default function Logo({ size = 36, className = "" }: { size?: number; className?: string }) {
  return <Image src="/brand/logo-mark.png" alt="Manav Narula Realtor logo" width={size} height={size} className={`shrink-0 rounded-brand ${className}`} />;
}
