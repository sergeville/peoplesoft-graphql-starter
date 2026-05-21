"use client";

import { gql, useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { EmployeeForm, type EmployeeFormValues } from "@/components/EmployeeForm";
import { employeeInitials, formatSalary } from "@/lib/format";

const GET_EMPLOYEE = gql`
  query GetEmployee($id: ID!, $asOfDate: String) {
    employee(id: $id, asOfDate: $asOfDate) {
      emplid
      name
      email
      department
      position
      salary
      managerEmplid
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
    position: string | null;
    salary: number | null;
    managerEmplid: string | null;
    effectiveDate: string | null;
    manager: { emplid: string; name: string } | null;
    jobHistory: JobRow[];
  } | null;
};

const DELETE_EMPLOYEE = gql`
  mutation DeleteEmployee($emplid: ID!) {
    deleteEmployee(emplid: $emplid)
  }
`;

export function EmployeeDetail({ emplid }: { emplid: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate =
    searchParams.get("asOfDate") ?? new Date().toISOString().slice(0, 10);
  const [asOfDate, setAsOfDate] = useState(initialDate);
  const [showEdit, setShowEdit] = useState(false);

  const { data, loading, error, refetch } = useQuery<EmployeeDetailData>(
    GET_EMPLOYEE,
    {
      variables: { id: emplid, asOfDate },
    },
  );

  const [deleteEmployee] = useMutation(DELETE_EMPLOYEE);

  function applyDate() {
    const params = new URLSearchParams();
    params.set("asOfDate", asOfDate);
    router.replace(`/employee/${emplid}?${params.toString()}`);
    void refetch({ id: emplid, asOfDate });
  }

  if (loading) {
    return (
      <div className="loading-block" role="status">
        <span className="spinner" aria-hidden />
        Loading profile…
      </div>
    );
  }

  if (error) {
    return <p className="error">Could not load profile: {error.message}</p>;
  }

  const employee = data?.employee;
  if (!employee) {
    return (
      <p className="error">Employee {emplid} not found for the selected date.</p>
    );
  }

  return (
    <section className="detail">
      <div className="detail-panel profile-hero">
        <div className="profile-hero__avatar" aria-hidden>
          {employeeInitials(employee.name)}
        </div>
        <div>
          <h2 className="profile-hero__name">{employee.name}</h2>
          <p className="profile-hero__id">EMPLID {employee.emplid}</p>
          {employee.position ? (
            <p className="profile-hero__id">{employee.position}</p>
          ) : null}
        </div>
      </div>

      <div className="detail-panel date-bar">
        <label htmlFor="asOfDate">As-of date</label>
        <DateControls
          asOfDate={asOfDate}
          onChange={setAsOfDate}
          onApply={applyDate}
        />
        <p className="hint">
          PeopleSoft effective dating — try Jane Doe (100001):{" "}
          <code>2024-12-01</code> vs <code>2026-01-01</code>.
        </p>
      </div>

      <div className="detail-panel">
        <dl className="facts">
          <div className="fact-row">
            <dt>Email</dt>
            <dd>{employee.email ?? "—"}</dd>
          </div>
          <div className="fact-row">
            <dt>Department</dt>
            <dd>{employee.department ?? "—"}</dd>
          </div>
          <div className="fact-row fact-row--salary">
            <dt>Salary</dt>
            <dd>{formatSalary(employee.salary)}</dd>
          </div>
          <div className="fact-row">
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
          </div>
          <div className="fact-row">
            <dt>Snapshot</dt>
            <dd>{employee.effectiveDate ?? asOfDate}</dd>
          </div>
        </dl>

        <div className="detail-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowEdit(true)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={async () => {
              const confirmed = window.confirm(
                `Terminate ${employee.name} (${employee.emplid})?`,
              );
              if (!confirmed) return;
              try {
                await deleteEmployee({ variables: { emplid: employee.emplid } });
                router.push("/");
              } catch (deleteError) {
                window.alert(
                  deleteError instanceof Error
                    ? deleteError.message
                    : "Could not terminate employee.",
                );
              }
            }}
          >
            Terminate
          </button>
        </div>
      </div>

      <h3 className="section-title">Job history</h3>

      <div className="history-cards" aria-label="Job history">
        {employee.jobHistory.map((job) => (
          <article
            key={`${job.position}-${job.startDate}`}
            className="history-card"
          >
            <strong>{job.position}</strong>
            <p>
              {job.startDate} → {job.endDate ?? "current"}
            </p>
            <p>{formatSalary(job.salary)}</p>
          </article>
        ))}
      </div>

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
              <td>{formatSalary(job.salary)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showEdit ? (
        <EmployeeForm
          mode="edit"
          initial={{
            emplid: employee.emplid,
            name: employee.name,
            email: employee.email ?? "",
            department: employee.department ?? "",
            position: employee.position ?? "Employee",
            salary: employee.salary != null ? String(employee.salary) : "",
            managerEmplid: employee.managerEmplid ?? "",
            effdt: asOfDate,
          } satisfies EmployeeFormValues}
          onClose={() => setShowEdit(false)}
          onSaved={() => void refetch()}
        />
      ) : null}
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
