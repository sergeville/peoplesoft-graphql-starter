"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useState } from "react";

import { EmployeeForm, type EmployeeFormValues } from "@/components/EmployeeForm";

const PAGE_SIZE = 50;

const GET_EMPLOYEES_PAGE = gql`
  query GetEmployeesPage($asOfDate: String, $limit: Int, $offset: Int) {
    employeeCount(asOfDate: $asOfDate)
    employees(asOfDate: $asOfDate, limit: $limit, offset: $offset) {
      emplid
      name
      email
      department
      position
      salary
      managerEmplid
      manager {
        name
      }
    }
  }
`;

const DELETE_EMPLOYEE = gql`
  mutation DeleteEmployee($emplid: ID!) {
    deleteEmployee(emplid: $emplid)
  }
`;

type EmployeeRow = {
  emplid: string;
  name: string;
  email: string | null;
  department: string | null;
  position: string | null;
  salary: number | null;
  managerEmplid: string | null;
  manager: { name: string } | null;
};

function toFormValues(employee: EmployeeRow): EmployeeFormValues {
  return {
    emplid: employee.emplid,
    name: employee.name,
    email: employee.email ?? "",
    department: employee.department ?? "",
    position: employee.position ?? "Employee",
    salary: employee.salary != null ? String(employee.salary) : "",
    managerEmplid: employee.managerEmplid ?? "",
    effdt: new Date().toISOString().slice(0, 10),
  };
}

export function EmployeeList({ asOfDate }: { asOfDate?: string }) {
  const [page, setPage] = useState(0);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);
  const offset = page * PAGE_SIZE;

  const { data, loading, error, refetch } = useQuery<{
    employees: EmployeeRow[];
    employeeCount: number;
  }>(GET_EMPLOYEES_PAGE, {
    variables: {
      asOfDate: asOfDate || null,
      limit: PAGE_SIZE,
      offset,
    },
  });

  const [deleteEmployee] = useMutation(DELETE_EMPLOYEE, {
    refetchQueries: ["GetEmployeesPage"],
  });

  const total = data?.employeeCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  async function handleDelete(employee: EmployeeRow) {
    const confirmed = window.confirm(
      `Delete ${employee.name} (${employee.emplid})? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteEmployee({ variables: { emplid: employee.emplid } });
      void refetch();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete employee.";
      window.alert(message);
    }
  }

  if (loading) {
    return <p className="muted">Loading employees from GraphQL…</p>;
  }

  if (error) {
    return (
      <p className="error">
        GraphQL error: {error.message}. Is the backend running on port 4000 with{" "}
        <code>PEOPLESOFT_DATA_SOURCE=mock</code>?
      </p>
    );
  }

  return (
    <>
      <div className="toolbar">
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setFormMode("create");
          }}
        >
          + Add employee
        </button>
      </div>

      <p className="muted">
        Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{" "}
        {total.toLocaleString()} employees
      </p>

      <ul className="employee-list">
        {data?.employees.map((employee) => (
          <li key={employee.emplid} className="employee-card">
            <div className="card-header">
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
            </div>
            <p>{employee.email ?? "—"}</p>
            <p>{employee.department ?? "No department"}</p>
            {employee.position ? (
              <p className="muted">{employee.position}</p>
            ) : null}
            {employee.manager ? (
              <p className="muted">Manager: {employee.manager.name}</p>
            ) : null}
            <div className="card-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditing(employee);
                  setFormMode("edit");
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => void handleDelete(employee)}
              >
                Delete
              </button>
            </div>
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

      {formMode ? (
        <EmployeeForm
          mode={formMode}
          initial={formMode === "edit" && editing ? toFormValues(editing) : undefined}
          onClose={() => {
            setFormMode(null);
            setEditing(null);
          }}
          onSaved={() => void refetch()}
        />
      ) : null}
    </>
  );
}
