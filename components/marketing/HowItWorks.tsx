const STEPS = [
  { title: "Tell us where you're starting", body: "Height, weight, goal, and how much time you have — no BMI verdict, no dream-body questions." },
  { title: "Get this week's plan", body: "A training schedule and calorie target sized to your numbers, ready before your first session." },
  { title: "Log what you actually do", body: "A photo for meals, one tap for a completed set, a tap for a habit. Recents make most days faster." },
  { title: "It adjusts next week", body: "Missed sessions, hit targets, low sleep — next week's plan accounts for what actually happened." },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <h2 className="mb-8 text-3xl font-semibold text-ink-primary">How it works</h2>
      <ol className="flex flex-col gap-8">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-5">
            <span className="metric flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-lg text-ink-primary">
              {i + 1}
            </span>
            <div>
              <p className="text-lg font-medium text-ink-primary">{s.title}</p>
              <p className="mt-1 text-ink-muted">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
