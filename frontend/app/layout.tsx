import type { Metadata } from "next";

import { ApolloWrapper } from "@/components/ApolloWrapper";

import "./globals.css";

export const metadata: Metadata = {
  title: "PeopleSoft GraphQL Starter",
  description: "Next.js UI → Apollo GraphQL → mock PeopleSoft data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
