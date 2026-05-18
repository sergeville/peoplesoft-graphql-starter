"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";

const GET_EMPLOYEES = gql`
  query GetEmployees($asOfDate: String) {
    employees(asOfDate: $asOfDate) {
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
  const { data, loading, error } = useQuery<{ employees: EmployeeRow[] }>(
    GET_EMPLOYEES,
    { variables: { asOfDate: asOfDate || null } },
  );

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
  );
}
