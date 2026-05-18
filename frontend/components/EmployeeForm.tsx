"use client";

import { gql, useMutation } from "@apollo/client";
import { FormEvent, useState } from "react";

const EMPLOYEE_FIELDS = gql`
  fragment EmployeeFields on Employee {
    emplid
    name
    email
    department
    manager {
      name
    }
  }
`;

const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee($input: EmployeeInput!) {
    createEmployee(input: $input) {
      ...EmployeeFields
    }
  }
  ${EMPLOYEE_FIELDS}
`;

const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployee($emplid: ID!, $input: EmployeeInput!) {
    updateEmployee(emplid: $emplid, input: $input) {
      ...EmployeeFields
    }
  }
  ${EMPLOYEE_FIELDS}
`;

export type EmployeeFormValues = {
  emplid: string;
  name: string;
  email: string;
  department: string;
  position: string;
  salary: string;
  managerEmplid: string;
  effdt: string;
};

const emptyValues = (): EmployeeFormValues => ({
  emplid: "",
  name: "",
  email: "",
  department: "",
  position: "Employee",
  salary: "",
  managerEmplid: "",
  effdt: new Date().toISOString().slice(0, 10),
});

type EmployeeFormProps = {
  mode: "create" | "edit";
  initial?: Partial<EmployeeFormValues>;
  onClose: () => void;
  onSaved: () => void;
};

function toInput(values: EmployeeFormValues) {
  return {
    emplid: values.emplid.trim() || null,
    name: values.name.trim(),
    email: values.email.trim() || null,
    department: values.department.trim() || null,
    position: values.position.trim() || null,
    salary: values.salary.trim() ? Number.parseFloat(values.salary) : null,
    managerEmplid: values.managerEmplid.trim() || null,
    effdt: values.effdt.trim() || null,
  };
}

export function EmployeeForm({
  mode,
  initial,
  onClose,
  onSaved,
}: EmployeeFormProps) {
  const [values, setValues] = useState<EmployeeFormValues>({
    ...emptyValues(),
    ...initial,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const [createEmployee, { loading: creating }] = useMutation(CREATE_EMPLOYEE);
  const [updateEmployee, { loading: updating }] = useMutation(UPDATE_EMPLOYEE);

  const saving = creating || updating;

  function setField<K extends keyof EmployeeFormValues>(
    key: K,
    value: EmployeeFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!values.name.trim()) {
      setFormError("Name is required.");
      return;
    }

    try {
      const input = toInput(values);
      if (mode === "create") {
        await createEmployee({ variables: { input } });
      } else {
        await updateEmployee({
          variables: {
            emplid: values.emplid,
            input: {
              name: input.name,
              email: input.email,
              department: input.department,
              position: input.position,
              salary: input.salary,
              managerEmplid: input.managerEmplid,
              effdt: input.effdt,
            },
          },
        });
      }
      onSaved();
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not save employee.",
      );
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="employee-form-title">
          {mode === "create" ? "Add employee" : "Edit employee"}
        </h2>

        <form className="employee-form" onSubmit={handleSubmit}>
          {mode === "create" ? (
            <label>
              EMPLID (optional — auto-generated if empty)
              <input
                value={values.emplid}
                onChange={(event) => setField("emplid", event.target.value)}
                placeholder="100001"
              />
            </label>
          ) : (
            <p className="muted">
              EMPLID: <strong>{values.emplid}</strong>
            </p>
          )}

          <label>
            Name *
            <input
              required
              value={values.name}
              onChange={(event) => setField("name", event.target.value)}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
            />
          </label>

          <label>
            Department
            <input
              value={values.department}
              onChange={(event) => setField("department", event.target.value)}
            />
          </label>

          <label>
            Position
            <input
              value={values.position}
              onChange={(event) => setField("position", event.target.value)}
            />
          </label>

          <label>
            Salary
            <input
              type="number"
              min={0}
              step={1000}
              value={values.salary}
              onChange={(event) => setField("salary", event.target.value)}
            />
          </label>

          <label>
            Manager EMPLID
            <input
              value={values.managerEmplid}
              onChange={(event) =>
                setField("managerEmplid", event.target.value)
              }
              placeholder="100003"
            />
          </label>

          <label>
            Effective date
            <input
              type="date"
              value={values.effdt}
              onChange={(event) => setField("effdt", event.target.value)}
            />
          </label>

          {formError ? <p className="error">{formError}</p> : null}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : mode === "create" ? "Add employee" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
