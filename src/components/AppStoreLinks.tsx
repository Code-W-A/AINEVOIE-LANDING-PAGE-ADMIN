import { APP_STORE_LINKS } from "@/constants/appStoreLinks";
import { Apple, Play } from "lucide-react";

type AppStoreLinksProps = {
  androidLabel: string;
  iosLabel: string;
  compact?: boolean;
  featured?: boolean;
  className?: string;
};

const STORE_LINKS = [
  {
    href: APP_STORE_LINKS.android,
    platform: "android",
    Icon: Play,
  },
  {
    href: APP_STORE_LINKS.ios,
    platform: "ios",
    Icon: Apple,
  },
] as const;

export default function AppStoreLinks({
  androidLabel,
  iosLabel,
  compact = false,
  featured = false,
  className = "",
}: AppStoreLinksProps) {
  const labels = { android: androidLabel, ios: iosLabel };

  return (
    <div
      className={`${featured ? "grid grid-cols-1 sm:grid-cols-2" : "flex flex-wrap items-center"} gap-3 ${className}`.trim()}
    >
      {STORE_LINKS.map(({ href, platform, Icon }) => (
        <a
          key={platform}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={labels[platform]}
          className={`focus-visible:outline-primary inline-flex items-center justify-center gap-2 bg-black font-medium text-white shadow-[0_12px_30px_-16px_rgba(15,23,42,0.8)] transition-all hover:-translate-y-0.5 hover:bg-black/85 hover:shadow-[0_16px_34px_-16px_rgba(15,23,42,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-white dark:text-black dark:hover:bg-white/85 ${
            featured
              ? "min-h-14 w-full rounded-xl px-5 py-3.5 text-sm"
              : compact
                ? "rounded-md px-3 py-2 text-xs"
                : "rounded-md px-5 py-3 text-sm"
          }`}
        >
          <Icon
            className={compact ? "h-4 w-4" : "h-5 w-5"}
            aria-hidden="true"
          />
          <span>{labels[platform]}</span>
        </a>
      ))}
    </div>
  );
}
