"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmployeeForm, type EmployeeFormValues } from "@/components/EmployeeForm";
import { employeeInitials } from "@/lib/format";

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

function matchesSearch(employee: EmployeeRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    employee.emplid,
    employee.name,
    employee.email,
    employee.department,
    employee.position,
    employee.manager?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function EmployeeList({ asOfDate }: { asOfDate?: string }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
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

  const employees = useMemo(
    () => (data?.employees ?? []).filter((row) => matchesSearch(row, search)),
    [data?.employees, search],
  );

  const total = data?.employeeCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  async function handleTerminate(employee: EmployeeRow) {
    const confirmed = window.confirm(
      `Terminate ${employee.name} (${employee.emplid})? In PeopleSoft this adds an inactive row; history is kept.`,
    );
    if (!confirmed) return;

    try {
      await deleteEmployee({ variables: { emplid: employee.emplid } });
      void refetch();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Could not terminate employee.";
      window.alert(message);
    }
  }

  if (loading) {
    return (
      <div className="loading-block" role="status">
        <span className="spinner" aria-hidden />
        Loading directory…
      </div>
    );
  }

  if (error) {
    return (
      <p className="error">
        Could not load employees: {error.message}. Is the GraphQL backend running
        on port 4000?
      </p>
    );
  }

  return (
    <>
      <div className="list-toolbar">
        <label className="search-field">
          <span aria-hidden>🔍</span>
          <input
            type="search"
            placeholder="Search name, ID, department…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            enterKeyHint="search"
            autoComplete="off"
          />
        </label>
        <div className="toolbar-row">
          <button
            type="button"
            className="btn-primary btn-block"
            onClick={() => {
              setEditing(null);
              setFormMode("create");
            }}
          >
            + New employee
          </button>
        </div>
      </div>

      <p className="list-meta">
        {search.trim()
          ? `${employees.length} match on this page`
          : `Showing ${offset + 1}–${Math.min(offset + PAGE_SIZE, total)} of ${total.toLocaleString()}`}
      </p>

      {employees.length === 0 ? (
        <p className="empty-state">
          {search.trim()
            ? "No employees match your search on this page."
            : "No employees on this page."}
        </p>
      ) : (
        <ul className="employee-list">
          {employees.map((employee) => (
            <li key={employee.emplid} className="employee-card">
              <div className="employee-card__avatar" aria-hidden>
                {employeeInitials(employee.name)}
              </div>
              <div className="employee-card__body">
                <div className="employee-card__top">
                  <Link
                    href={
                      asOfDate
                        ? `/employee/${employee.emplid}?asOfDate=${asOfDate}`
                        : `/employee/${employee.emplid}`
                    }
                    className="employee-link"
                  >
                    {employee.name}
                  </Link>
                  <span className="badge">{employee.emplid}</span>
                </div>
                <p className="employee-card__meta">
                  {employee.department ?? "No department"}
                  {employee.position ? ` · ${employee.position}` : ""}
                </p>
                <p className="employee-card__meta">{employee.email ?? "No email"}</p>
                {employee.manager ? (
                  <p className="employee-card__meta">
                    Reports to {employee.manager.name}
                  </p>
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
                    onClick={() => void handleTerminate(employee)}
                  >
                    Terminate
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!search.trim() ? (
        <nav className="pagination" aria-label="Employee list pagination">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <span className="pagination__label">
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
      ) : null}

      {formMode ? (
        <EmployeeForm
          mode={formMode}
          initial={
            formMode === "edit" && editing ? toFormValues(editing) : undefined
          }
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
