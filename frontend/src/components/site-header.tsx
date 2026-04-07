import Link from "next/link";

type SiteHeaderProps = {
  currentPath: "/" | "/privacy" | "/api-docs" | "/terms" | "/contact";
};

const NAV_ITEMS: Array<{ href: SiteHeaderProps["currentPath"]; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/privacy", label: "Privacy" },
  { href: "/api-docs", label: "API" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader({ currentPath }: SiteHeaderProps) {
  return (
    <header className="bg-white border-b border-[#e5e7eb]">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-3 sm:px-8 sm:py-0 sm:h-16 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img alt="SafeDataFlow logo" className="size-8" src="/figma/icon-logo.svg" />
          <span className="text-xl leading-none tracking-[-0.02em] text-[#101828] font-semibold">
            SafeDataFlow
          </span>
        </Link>

        <nav aria-label="Primary" className="-mx-1 overflow-x-auto px-1">
          <ul className="flex min-w-max items-center gap-4 sm:gap-6">
            {NAV_ITEMS.map((item) => {
              const active = item.href === currentPath;
              return (
                <li key={item.href}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "text-[15px] sm:text-base leading-none tracking-[-0.02em] text-[#101828] font-semibold whitespace-nowrap"
                        : "text-[15px] sm:text-base leading-none tracking-[-0.02em] text-[#64748b] hover:text-[#364153] font-medium whitespace-nowrap"
                    }
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
