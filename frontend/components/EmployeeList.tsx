"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import { useState } from "react";

const PAGE_SIZE = 50;

const GET_EMPLOYEES_PAGE = gql`
  query GetEmployeesPage(
    $asOfDate: String
    $limit: Int
    $offset: Int
  ) {
    employeeCount(asOfDate: $asOfDate)
    employees(asOfDate: $asOfDate, limit: $limit, offset: $offset) {
      emplid
      name
      email
      department
      manager {
        name
      }
    }
  }
`;

type EmployeeRow = {
  emplid: string;
  name: string;
  email: string | null;
  department: string | null;
  manager: { name: string } | null;
};

export function EmployeeList({ asOfDate }: { asOfDate?: string }) {
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;

  const { data, loading, error } = useQuery<{
    employees: EmployeeRow[];
    employeeCount: number;
  }>(GET_EMPLOYEES_PAGE, {
    variables: {
      asOfDate: asOfDate || null,
      limit: PAGE_SIZE,
      offset,
    },
  });

  const total = data?.employeeCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  if (loading) {
    return <p className="muted">Loading employees from GraphQL…</p>;
  }

  if (error) {
    return (
      <p className="error">
        GraphQL error: {error.message}. Is the backend running on port 4000?
      </p>
    );
  }

  return (
    <>
      <p className="muted">
        Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{" "}
        {total.toLocaleString()} employees
      </p>

      <ul className="employee-list">
        {data?.employees.map((employee) => (
          <li key={employee.emplid} className="employee-card">
            <Link
              href={
                asOfDate
                  ? `/employee/${employee.emplid}?asOfDate=${asOfDate}`
                  : `/employee/${employee.emplid}`
              }
              className="employee-link"
            >
              <strong>{employee.name}</strong>
            </Link>
            <span className="badge">{employee.emplid}</span>
            <p>{employee.email ?? "—"}</p>
            <p>{employee.department ?? "No department"}</p>
            {employee.manager ? (
              <p className="muted">Manager: {employee.manager.name}</p>
            ) : null}
          </li>
        ))}
      </ul>

      <nav className="pagination" aria-label="Employee list pagination">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous
        </button>
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </nav>
    </>
  );
}
