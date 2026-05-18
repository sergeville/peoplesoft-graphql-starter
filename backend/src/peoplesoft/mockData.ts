import type { JobRow } from "./types.js";

/**
 * Mock PS_JOB-style history. Use asOfDate on queries to see effective-dated snapshots.
 * Jane Doe: promoted 2025-06-01 (try asOfDate 2024-12-01 vs 2026-01-01).
 */
export const mockJobRows: JobRow[] = [
  {
    emplid: "100001",
    effdt: "2024-01-01",
    effseq: 0,
    name: "Jane Doe",
    email: "jane.doe@example.com",
    department: "Engineering",
    position: "Software Engineer",
    salary: 95000,
    managerEmplid: "100003",
  },
  {
    emplid: "100001",
    effdt: "2025-06-01",
    effseq: 0,
    name: "Jane Doe",
    email: "jane.doe@example.com",
    department: "Engineering",
    position: "Senior Software Engineer",
    salary: 110000,
    managerEmplid: "100003",
  },
  {
    emplid: "100002",
    effdt: "2023-03-15",
    effseq: 0,
    name: "John Smith",
    email: "john.smith@example.com",
    department: "Finance",
    position: "Financial Analyst",
    salary: 82000,
    managerEmplid: "100003",
  },
  {
    emplid: "100003",
    effdt: "2022-01-10",
    effseq: 0,
    name: "Alex Rivera",
    email: "alex.rivera@example.com",
    department: "Engineering",
    position: "Director of Engineering",
    salary: 165000,
    managerEmplid: null,
  },
];
