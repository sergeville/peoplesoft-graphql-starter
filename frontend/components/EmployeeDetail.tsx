"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const GET_EMPLOYEE = gql`
  query GetEmployee($id: ID!, $asOfDate: String) {
    employee(id: $id, asOfDate: $asOfDate) {
      emplid
      name
      email
      department
      effectiveDate
      manager {
        emplid
        name
      }
      jobHistory {
        position
        startDate
        endDate
        salary
      }
    }
  }
`;

type JobRow = {
  position: string;
  startDate: string;
  endDate: string | null;
  salary: number | null;
};

type EmployeeDetailData = {
  employee: {
    emplid: string;
    name: string;
    email: string | null;
    department: string | null;
    effectiveDate: string | null;
    manager: { emplid: string; name: string } | null;
    jobHistory: JobRow[];
  } | null;
};

export function EmployeeDetail({ emplid }: { emplid: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate =
    searchParams.get("asOfDate") ?? new Date().toISOString().slice(0, 10);
  const [asOfDate, setAsOfDate] = useState(initialDate);

  const { data, loading, error, refetch } = useQuery<EmployeeDetailData>(
    GET_EMPLOYEE,
    {
      variables: { id: emplid, asOfDate },
    },
  );

  function applyDate() {
    const params = new URLSearchParams();
    params.set("asOfDate", asOfDate);
    router.replace(`/employee/${emplid}?${params.toString()}`);
    void refetch({ id: emplid, asOfDate });
  }

  if (loading) {
    return <p className="muted">Loading employee…</p>;
  }

  if (error) {
    return <p className="error">GraphQL error: {error.message}</p>;
  }

  const employee = data?.employee;
  if (!employee) {
    return <p className="error">Employee {emplid} not found for this date.</p>;
  }

  return (
    <section className="detail">
      <Link href="/" className="back-link">
        ← All employees
      </Link>

      <div className="date-bar">
        <label htmlFor="asOfDate">As-of date (PeopleSoft effective dating)</label>
        <DateControls
          asOfDate={asOfDate}
          onChange={setAsOfDate}
          onApply={applyDate}
        />
        <p className="muted hint">
          Try Jane Doe (100001): <code>2024-12-01</code> vs <code>2026-01-01</code>{" "}
          to see title/salary change.
        </p>
      </div>

      <header className="detail-header">
        <h1>{employee.name}</h1>
        <span className="badge">{employee.emplid}</span>
      </header>

      <dl className="facts">
        <dt>Email</dt>
        <dd>{employee.email ?? "—"}</dd>
        <dt>Department</dt>
        <dd>{employee.department ?? "—"}</dd>
        <dt>Manager</dt>
        <dd>
          {employee.manager ? (
            <Link href={`/employee/${employee.manager.emplid}`}>
              {employee.manager.name}
            </Link>
          ) : (
            "—"
          )}
        </dd>
        <dt>Snapshot date</dt>
        <dd>{employee.effectiveDate ?? asOfDate}</dd>
      </dl>

      <h2>Job history</h2>
      <table className="history-table">
        <thead>
          <tr>
            <th>Position</th>
            <th>Start</th>
            <th>End</th>
            <th>Salary</th>
          </tr>
        </thead>
        <tbody>
          {employee.jobHistory.map((job) => (
            <tr key={`${job.position}-${job.startDate}`}>
              <td>{job.position}</td>
              <td>{job.startDate}</td>
              <td>{job.endDate ?? "current"}</td>
              <td>
                {job.salary != null
                  ? job.salary.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function DateControls({
  asOfDate,
  onChange,
  onApply,
}: {
  asOfDate: string;
  onChange: (value: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="date-controls">
      <input
        id="asOfDate"
        type="date"
        value={asOfDate}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="button" onClick={onApply}>
        Apply
      </button>
    </div>
  );
}
