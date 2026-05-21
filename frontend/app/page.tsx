import { EmployeeList } from "@/components/EmployeeList";

export default function HomePage() {
  return (
    <>
      <div className="page-hero">
        <p>
          Browse your team, open profiles, and manage HR data — optimized for mobile
          and desktop.
        </p>
      </div>
      <EmployeeList />
    </>
  );
}
