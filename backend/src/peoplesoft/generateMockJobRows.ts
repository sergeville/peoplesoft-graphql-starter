import type { JobRow } from "./types.js";

const DEPARTMENTS = [
  "Engineering",
  "Finance",
  "HR",
  "Operations",
  "IT",
  "Sales",
  "Legal",
  "Marketing",
] as const;

const POSITIONS = [
  "Analyst",
  "Specialist",
  "Consultant",
  "Engineer",
  "Senior Engineer",
  "Manager",
  "Director",
  "VP",
] as const;

const FIRST_NAMES = [
  "Jane",
  "John",
  "Alex",
  "Maria",
  "David",
  "Sarah",
  "James",
  "Emily",
  "Michael",
  "Lisa",
  "Robert",
  "Anna",
  "William",
  "Priya",
  "Chen",
  "Fatima",
  "Omar",
  "Yuki",
  "Lucas",
  "Elena",
] as const;

const LAST_NAMES = [
  "Doe",
  "Smith",
  "Rivera",
  "Garcia",
  "Kim",
  "Patel",
  "Johnson",
  "Brown",
  "Lee",
  "Wilson",
  "Martinez",
  "Nguyen",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Clark",
  "Lewis",
] as const;

/** Fixed seed rows (Jane / John / Alex) for effective-dating demos. */
export const seedMockJobRows: JobRow[] = [
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

function padEmplid(index: number): string {
  return String(100001 + index);
}

function isoDateFromOffset(baseYear: number, dayOffset: number): string {
  const date = new Date(Date.UTC(baseYear, 0, 1));
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

function buildName(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length]!;
  const last = LAST_NAMES[(index * 7) % LAST_NAMES.length]!;
  return `${first} ${last}`;
}

function buildEmail(emplid: string, name: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, ".");
  return `${slug}.${emplid}@example.com`;
}

/** Director every 10 employees (100001, 100011, …) has no manager. */
function managerEmplidForIndex(index: number): string | null {
  if (index % 10 === 0) return null;
  const directorIndex = Math.floor(index / 10) * 10;
  return padEmplid(directorIndex);
}

/**
 * Generate `count` employees (EMPLID 100001 … 100000+count-1).
 * First 3 match seed rows; remaining rows are synthetic but deterministic.
 */
export function generateMockJobRows(count: number): JobRow[] {
  const safeCount = Math.max(3, Math.min(count, 50_000));
  const rows: JobRow[] = [...seedMockJobRows];

  for (let index = 3; index < safeCount; index++) {
    const emplid = padEmplid(index);
    const name = buildName(index);
    const department = DEPARTMENTS[index % DEPARTMENTS.length]!;
    const level = index % 10 === 0 ? 6 : (index % 5) + 1;
    const position = POSITIONS[Math.min(level, POSITIONS.length - 1)]!;
    const salary = 55_000 + (index % 120) * 750 + level * 8_000;
    const effdt = isoDateFromOffset(2018 + (index % 5), index % 300);
    const managerEmplid = managerEmplidForIndex(index);

    rows.push({
      emplid,
      effdt,
      effseq: 0,
      name,
      email: buildEmail(emplid, name),
      department,
      position,
      salary,
      managerEmplid,
    });

    // ~15% receive a promotion row (second effective-dated job).
    if (index % 7 === 0) {
      const promoYear = 2019 + (index % 4);
      const promoEffdt = isoDateFromOffset(promoYear, (index % 300) + 400);
      rows.push({
        emplid,
        effdt: promoEffdt,
        effseq: 0,
        name,
        email: buildEmail(emplid, name),
        department,
        position: POSITIONS[Math.min(level + 1, POSITIONS.length - 1)]!,
        salary: salary + 12_000,
        managerEmplid,
      });
    }
  }

  return rows;
}

export function resolveMockEmployeeCount(): number {
  const raw = process.env.MOCK_EMPLOYEE_COUNT ?? "1000";
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 3) return 1000;
  return Math.min(parsed, 50_000);
}
