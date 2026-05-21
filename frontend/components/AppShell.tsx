"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useTheme } from "@/components/ThemeProvider";
import { getThemeBrand } from "@/lib/theme";

type AppShellProps = {
  children: ReactNode;
  title?: string;
  backHref?: string;
};

export function AppShell({ children, title, backHref }: AppShellProps) {
  const pathname = usePathname();
  const { themeId } = useTheme();
  const { brand, mark } = getThemeBrand(themeId);
  const isFlux = themeId === "flux";

  const onDetail = pathname.startsWith("/employee/");
  const showBack = backHref ?? (onDetail ? "/" : undefined);
  const headerTitle =
    title ?? (onDetail ? "Employee profile" : "Employees");

  return (
    <div className={`app app--${themeId}`}>
      <header className="app-header">
        <div className="app-header__inner">
          {showBack ? (
            <Link href={showBack} className="app-header__back" aria-label="Back">
              ←
            </Link>
          ) : (
            <span
              className={`app-header__mark${isFlux ? " app-header__mark--flux" : ""}`}
              aria-hidden
            >
              {mark}
            </span>
          )}
          <div className="app-header__titles">
            <p className="app-header__brand">{brand}</p>
            <h1 className="app-header__title">{headerTitle}</h1>
          </div>
          <div className="app-header__actions">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <nav className="app-tabbar" aria-label="Main navigation">
        <Link
          href="/"
          className={`app-tabbar__item${pathname === "/" ? " app-tabbar__item--active" : ""}`}
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <span className="app-tabbar__icon" aria-hidden>
            {isFlux ? "◆" : "👥"}
          </span>
          <span>Employees</span>
        </Link>
      </nav>
    </div>
  );
}
