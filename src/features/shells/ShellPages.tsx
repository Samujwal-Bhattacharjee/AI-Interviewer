import { Link } from 'react-router-dom';

function ShellPage({
  label,
  title,
  desc,
  cta,
  ctaHref,
}: {
  label: string;
  title: string;
  desc: string;
  cta?: string;
  ctaHref?: string;
}) {
  return (
    <main className="page-shell">
      <div className="shell-message">
        <div className="shell-label">{label}</div>
        <h1 className="shell-title">{title}</h1>
        <p className="shell-desc">{desc}</p>
        {cta && ctaHref && (
          <Link to={ctaHref}>
            <button className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-4)' }}>
              {cta}
            </button>
          </Link>
        )}
      </div>
    </main>
  );
}

export function ReportPage() {
  return (
    <ShellPage
      label="Report / Phase 2"
      title="ASSESSMENT REPORT"
      desc="After completing an assessment, your full report with evidence, competency scores, and gap analysis will appear here."
      cta="Start New Assessment →"
      ctaHref="/assess"
    />
  );
}

export function PlanPage() {
  return (
    <ShellPage
      label="Improvement Plan / Phase 2"
      title="YOUR PLAN"
      desc="A personalized improvement plan based on observed weaknesses and evidence from your assessments will be generated here."
      cta="View Skill Profile"
      ctaHref="/skills"
    />
  );
}

export function ReassessPage() {
  return (
    <ShellPage
      label="Reassessment / Phase 2"
      title="TARGETED REASSESSMENT"
      desc="After identifying gaps, the system will focus your next session only on weak or uncertain competencies — not a full restart."
      cta="View Skill Profile"
      ctaHref="/skills"
    />
  );
}
