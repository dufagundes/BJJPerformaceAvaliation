import Link from "next/link";

export default function HomePage() {
  return (
    <section>
      <h2>Welcome</h2>
      <p>
        Use this system to track GB Kids student progress using the standardized
        16-criteria evaluation rubric for each phase.
      </p>
      <div>
        <Link href="/students">Manage Students</Link>
        <br />
        <Link href="/criteria">Manage Criteria</Link>
        <br />
        <Link href="/evaluations">Create Evaluations</Link>
      </div>
    </section>
  );
}
