export type EmployeeRecord = {
  emplid: string;
  name: string;
  email: string | null;
  department: string | null;
  managerEmplid: string | null;
};

/** Versioned PS_JOB-style row (effective-dated). */
export type JobRow = {
  emplid: string;
  effdt: string;
  effseq: number;
  name: string;
  email: string | null;
  department: string | null;
  position: string;
  salary: number;
  managerEmplid: string | null;
};

export type JobRecord = {
  position: string;
  startDate: string;
  endDate: string | null;
  salary: number;
};
