import { Suspense } from "react";

import { EmployeeDetail } from "@/components/EmployeeDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EmployeePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="loading-block" role="status">
          <span className="spinner" aria-hidden />
          Loading profile…
        </div>
      }
    >
      <EmployeeDetail emplid={id} />
    </Suspense>
  );
}
