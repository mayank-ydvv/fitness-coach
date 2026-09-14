import { ChevronDown } from "lucide-react";

const FAQS: { id?: string; q: string; a: string }[] = [
  {
    id: "privacy",
    q: "Is my health data private?",
    a: "Your data is scoped to your account and never shared with other users. Progress photos, if you add any, are kept private the same way. You can export everything or delete your account and its data at any time from Settings.",
  },
  {
    q: "Do I need a gym?",
    a: "No. Tell it what equipment you actually have — a gym, a few dumbbells, or just your bodyweight — and the plan is built from that, not from an assumed setup.",
  },
  {
    q: "How long does logging take?",
    a: "A meal is a photo and a couple of taps to confirm portions. A completed set is one tap. After the first week, most meals and habits are one-tap repeats from your recents.",
  },
  {
    q: "What if I miss a few days?",
    a: "Nothing breaks. A missed session just moves to the next one, and a habit streak survives one rest day a week without resetting. There's no guilt messaging for a missed day — it's normal.",
  },
  {
    q: "Does it work if I'm just starting out?",
    a: "Yes — onboarding asks about your actual starting point, not an assumed fitness level, and the same logic that adjusts an experienced lifter's plan adjusts a beginner's.",
  },
  {
    q: "Can I try it without creating an account?",
    a: "Yes — \"Continue as a guest\" gives you the real app immediately. Nothing you do in a guest session is saved once you sign out.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <h2 className="mb-8 text-3xl font-normal text-ink-primary">Questions</h2>
      <div className="flex flex-col divide-y divide-hairline border-y border-hairline">
        {FAQS.map((f) => (
          <details key={f.q} id={f.id} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-ink-primary">
              {f.q}
              <ChevronDown size={20} className="shrink-0 text-ink-muted transition-transform duration-[var(--duration-feedback)] group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-3 text-ink-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
