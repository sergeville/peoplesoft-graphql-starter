import { EmployeeList } from "@/components/EmployeeList";

const ARCH_STEPS = [
  "Next.js UI",
  "Apollo GraphQL :4000",
  "Mock PeopleSoft",
  "→ IB REST later",
];

export default function HomePage() {
  return (
    <main>
      <h1>PeopleSoft Employees</h1>
      <p className="subtitle">
        Next.js UI → Apollo GraphQL (port 4000) → mock data. Swap to Integration
        Broker REST when ready.
      </p>

      <div className="arch" aria-label="Architecture flow">
        {ARCH_STEPS.map((step, index) => (
          <span key={step} style={{ display: "contents" }}>
            <span>{step}</span>
            {index < ARCH_STEPS.length - 1 ? <span className="arrow">→</span> : null}
          </span>
        ))}
      </div>

      <EmployeeList />
    </main>
  );
}
