import { Suspense } from "react";

import { EmployeeDetail } from "@/components/EmployeeDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmployeePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <EmployeeDetail emplid={id} />
      </Suspense>
    </main>
  );
}
