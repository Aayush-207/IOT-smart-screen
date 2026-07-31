import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Monitor,
  Upload,
} from 'lucide-react';

const steps = [
  {
    title: 'Upload',
    description: 'A club or college adds a poster.',
    icon: Upload,
  },
  {
    title: 'Review & schedule',
    description: 'An admin approves when and where it plays.',
    icon: CheckCircle2,
  },
  {
    title: 'Secure delivery',
    description: 'AWS IoT sends the approved update.',
    icon: Cloud,
  },
  {
    title: 'Campus screens',
    description: 'Kiosks cache, play, and report health.',
    icon: Monitor,
  },
] as const;

export function ArchitectureView() {
  return (
    <div className="cc-page">
      <section>
        <p className="cc-eyebrow">System flow</p>
        <h1 className="cc-page-title">How CampusCast works</h1>
        <p className="cc-page-description">
          One content path to the screens, with health status coming back.
        </p>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
        {steps.map(({ title, description, icon: Icon }, index) => (
          <div key={title} className="contents">
            <article className="cc-panel p-5">
              <span className="cc-summary-icon bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-xs font-semibold text-[var(--accent)]">
                Step {index + 1}
              </p>
              <h2 className="mt-1 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {description}
              </p>
            </article>
            {index < steps.length - 1 && (
              <ArrowRight className="mx-auto hidden h-5 w-5 text-[var(--accent)] lg:block" />
            )}
          </div>
        ))}
      </section>

      <p className="text-center text-sm text-[var(--muted-foreground)]">
        Screens send heartbeat and playback status back to the dashboard.
      </p>
    </div>
  );
}
