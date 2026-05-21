import type { Metadata } from "next";

import { ApolloWrapper } from "@/components/ApolloWrapper";

import "./globals.css";

export const metadata: Metadata = {
  title: "Using GraphQL to get PeopleSoft data",
  description: "Using GraphQL to get PeopleSoft data — Next.js UI and Apollo BFF",
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
