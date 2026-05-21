import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { ApolloWrapper } from "@/components/ApolloWrapper";
import { AppShell } from "@/components/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getThemeInitScript } from "@/lib/theme-init-script";
import { DEFAULT_THEME_ID, getThemeDefinition } from "@/lib/theme";

import "./globals.css";

const defaultTheme = getThemeDefinition(DEFAULT_THEME_ID);
const themeInitScript = getThemeInitScript();

export const metadata: Metadata = {
  title: "Employee Directory",
  description: "Browse and manage employees — mobile-friendly HR app powered by GraphQL",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Employees",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: defaultTheme.themeColor,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme={DEFAULT_THEME_ID} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={defaultTheme.themeColor} />
      </head>
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeProvider>
          <ApolloWrapper>
            <AppShell>{children}</AppShell>
          </ApolloWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
