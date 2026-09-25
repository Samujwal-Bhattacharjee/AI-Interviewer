import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInterviewStore } from '../../store/interviewStore';
import { getAssessmentReport } from '../../services/assessmentService';
import { getRoleById } from '../../services/roleService';
import type { AssessmentReport, CourseResource } from '../../types/assessment';
import type { TargetRole } from '../../types/roles';
import { formatScore, formatConfidence, trendSymbol } from '../../lib/utils';

const competencyNameMap: Record<string, string> = {
  'comp-dsa': 'Algorithms & Data Structures',
  'comp-python': 'Python Systems & Core',
  'comp-sql': 'Relational Data & SQL',
  'comp-debugging': 'Diagnostic Debugging',
  'comp-system-design': 'Distributed System Design',
};

export function ReportPage() {
  const navigate = useNavigate();
  const sessionId = useInterviewStore((s) => s.sessionId);
  const targetRoleId = useInterviewStore((s) => s.targetRoleId);

  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [role, setRole] = useState<TargetRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        if (sessionId) {
          const reportData = await getAssessmentReport(sessionId);
          if (isMounted) setReport(reportData);
          if (reportData.targetRoleId) {
            const roleData = await getRoleById(reportData.targetRoleId);
            if (isMounted && roleData) setRole(roleData);
          }
        } else {
          // If no active session, try fallback demo role
          const roleData = await getRoleById(targetRoleId ?? 'role-001');
          if (isMounted && roleData) setRole(roleData);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load assessment report.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [sessionId, targetRoleId]);

  if (isLoading) {
    return (
      <main className="page-shell" style={{ background: 'var(--c-paper)' }}>
        <div className="container" style={{ paddingTop: 'var(--space-24)', textAlign: 'center' }}>
          <div className="sys-label" style={{ letterSpacing: '0.2em', color: 'var(--c-accent)' }}>
            ANALYZING ADAPTIVE TRAJECTORY
          </div>
          <h1 style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-3xl)', fontWeight: 700 }}>
            Compiling Assessment Report...
          </h1>
          <p style={{ marginTop: 'var(--space-4)', color: 'var(--c-mid)' }}>
            Synthesizing evidence across competencies and computing knowledge gaps.
          </p>
        </div>
      </main>
    );
  }

  if (error || (!report && !sessionId)) {
    return (
      <main className="page-shell" style={{ background: 'var(--c-paper)' }}>
        <div className="container" style={{ paddingTop: 'var(--space-20)', maxWidth: '640px', margin: '0 auto' }}>
          <div className="sys-label" style={{ color: 'var(--c-warning)', marginBottom: 'var(--space-2)' }}>
            Report Status
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            {error ? 'Unable to Retrieve Report' : 'No Completed Session Detected'}
          </h1>
          <p style={{ color: 'var(--c-mid)', lineHeight: 1.6, marginBottom: 'var(--space-8)' }}>
            {error ??
              'To generate an adaptive skill report, complete an interview session. The backend will evaluate responses, trace evidence, and calculate gap metrics.'}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <button className="btn btn-primary" onClick={() => navigate('/assess')}>
              Start New Assessment →
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/skills')}>
              View General Skills
            </button>
          </div>
        </div>
      </main>
    );
  }

  const overallScore = report?.overallScore ?? 0;
  const isPassing = overallScore >= 70;

  return (
    <main className="page-shell" style={{ background: 'var(--c-paper)', paddingBottom: 'var(--space-24)' }}>
      {/* ── HEADER ── */}
      <section className="page-header" style={{ borderBottom: '1px solid var(--c-rule)' }}>
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 'var(--space-6)',
              padding: 'var(--space-8) 0',
            }}
          >
            <div>
              <div className="sys-label" style={{ color: 'var(--c-accent)', marginBottom: 'var(--space-2)' }}>
                Assessment / Comprehensive Evaluation
              </div>
              <h1
                style={{
                  fontSize: 'clamp(32px, 4vw, 56px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: 'var(--c-ink)',
                  lineHeight: 1.1,
                }}
              >
                EVALUATION<br />REPORT
              </h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
              <span className="sys-label">Target Role</span>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-md)', fontWeight: 600 }}>
                {role?.title.toUpperCase() ?? report?.targetRoleId.toUpperCase()}
              </span>
              <span className="sys-label" style={{ color: 'var(--c-mid)' }}>
                Session ID: {report?.sessionId.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: 'var(--space-12)' }}>
        {/* ── TOP KPI ROW ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-6)',
            marginBottom: 'var(--space-12)',
          }}
        >
          {/* Overall score card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: 'var(--space-6)',
              background: 'var(--c-surface)',
              border: '1px solid var(--c-rule)',
              borderRadius: '2px',
            }}
          >
            <div className="sys-label" style={{ marginBottom: 'var(--space-2)' }}>Overall Role Score</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
              <span
                style={{
                  fontSize: 'clamp(44px, 5vw, 64px)',
                  fontWeight: 700,
                  fontFamily: 'var(--f-mono)',
                  letterSpacing: '-0.04em',
                  color: isPassing ? 'var(--c-accent)' : 'var(--c-warning)',
                }}
              >
                {overallScore}
              </span>
              <span style={{ fontSize: 'var(--text-lg)', color: 'var(--c-mid)', fontFamily: 'var(--f-mono)' }}>
                / 100
              </span>
            </div>
            <div
              style={{
                marginTop: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--f-mono)',
                color: isPassing ? 'var(--c-success)' : 'var(--c-warning)',
              }}
            >
              {isPassing ? '● MEETS BASELINE EXPECTATION' : '▲ DEVELOPING COMPETENCY'}
            </div>
          </motion.div>

          {/* Competencies evaluated */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              padding: 'var(--space-6)',
              background: 'var(--c-surface)',
              border: '1px solid var(--c-rule)',
              borderRadius: '2px',
            }}
          >
            <div className="sys-label" style={{ marginBottom: 'var(--space-2)' }}>Competencies Evaluated</div>
            <div
              style={{
                fontSize: 'clamp(44px, 5vw, 64px)',
                fontWeight: 700,
                fontFamily: 'var(--f-mono)',
                color: 'var(--c-ink)',
                letterSpacing: '-0.04em',
              }}
            >
              {report?.skillEstimates.length ?? 0}
            </div>
            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--c-mid)' }}>
              Across {report?.evidence?.length ?? 0} verified evidence points
            </div>
          </motion.div>

          {/* Critical gaps */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              padding: 'var(--space-6)',
              background: 'var(--c-surface)',
              border: '1px solid var(--c-rule)',
              borderRadius: '2px',
            }}
          >
            <div className="sys-label" style={{ marginBottom: 'var(--space-2)' }}>Gaps Identified</div>
            <div
              style={{
                fontSize: 'clamp(44px, 5vw, 64px)',
                fontWeight: 700,
                fontFamily: 'var(--f-mono)',
                color: (report?.gapAnalysis.filter((g) => g.gap < 0).length ?? 0) > 0 ? 'var(--c-danger)' : 'var(--c-success)',
                letterSpacing: '-0.04em',
              }}
            >
              {report?.gapAnalysis.filter((g) => g.gap < 0).length ?? 0}
            </div>
            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--c-mid)' }}>
              Areas requiring targeted practice
            </div>
          </motion.div>
        </div>

        {/* ── SUMMARY BANNER ── */}
        {report?.summary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              padding: 'var(--space-6)',
              background: 'var(--c-surface-2)',
              borderLeft: '3px solid var(--c-accent)',
              marginBottom: 'var(--space-12)',
            }}
          >
            <div className="sys-label" style={{ color: 'var(--c-accent)', marginBottom: 'var(--space-2)' }}>
              Diagnostic Summary
            </div>
            <p style={{ fontSize: 'var(--text-md)', lineHeight: 1.6, color: 'var(--c-ink)' }}>
              {report.summary}
            </p>
          </motion.div>
        )}

        {/* ── SECTION: COMPETENCY BREAKDOWN & GAP ANALYSIS ── */}
        <section style={{ marginBottom: 'var(--space-16)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderBottom: '1px solid var(--c-rule)',
              paddingBottom: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div className="sys-label" style={{ color: 'var(--c-ink)' }}>
              01 / Competency Breakdown & Gap Analysis
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-mid)', fontFamily: 'var(--f-mono)' }}>
              Target Level vs Demonstrated Level
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {report?.skillEstimates.map((est, i) => {
              const name = competencyNameMap[est.competencyId] ?? est.competencyId;
              const gapItem = report?.gapAnalysis.find((g) => g.competencyId === est.competencyId);
              const target = gapItem?.targetScore ?? 70;
              const gap = gapItem?.gap ?? est.score - target;

              return (
                <motion.div
                  key={est.competencyId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '240px 1fr 140px',
                    gap: 'var(--space-6)',
                    alignItems: 'center',
                    padding: 'var(--space-5) 0',
                    borderBottom: '1px solid var(--c-rule)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{name}</div>
                    <div
                      style={{
                        fontFamily: 'var(--f-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--c-mid)',
                        marginTop: '2px',
                      }}
                    >
                      Confidence: {formatConfidence(est.confidence)} ({est.confidenceLevel})
                    </div>
                  </div>

                  {/* Dual comparison bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: 'var(--text-xs)', fontFamily: 'var(--f-mono)' }}>
                      <span>Score: {formatScore(est.score)}</span>
                      <span style={{ color: 'var(--c-mid)' }}>Target: {target}</span>
                    </div>
                    <div style={{ position: 'relative', height: '6px', background: 'var(--c-rule)', borderRadius: '2px', overflow: 'hidden' }}>
                      {/* Target marker line */}
                      <div
                        style={{
                          position: 'absolute',
                          left: `${target}%`,
                          top: 0,
                          bottom: 0,
                          width: '2px',
                          background: 'var(--c-ink)',
                          zIndex: 2,
                        }}
                      />
                      {/* Score fill */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${est.score}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          height: '100%',
                          background: est.score >= target ? 'var(--c-accent)' : 'var(--c-warning)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Gap metric */}
                  <div style={{ textAlign: 'right', fontFamily: 'var(--f-mono)' }}>
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        color: gap < 0 ? 'var(--c-danger)' : 'var(--c-success)',
                      }}
                    >
                      {gap > 0 ? `+${gap}` : gap}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-mid)', marginLeft: 'var(--space-2)' }}>
                      {trendSymbol(est.trend)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── SECTION: VERIFIED EVIDENCE ── */}
        {report?.evidence && report.evidence.length > 0 && (
          <section style={{ marginBottom: 'var(--space-16)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderBottom: '1px solid var(--c-rule)',
                paddingBottom: 'var(--space-4)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div className="sys-label" style={{ color: 'var(--c-ink)' }}>
                02 / Traceable Evidence Extract
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-mid)', fontFamily: 'var(--f-mono)' }}>
                Concept-Level Verification
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
              {report.evidence.map((ev, idx) => (
                <div
                  key={`${ev.questionId}-${ev.concept}-${idx}`}
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--c-surface)',
                    border: '1px solid var(--c-rule)',
                    borderRadius: '2px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                      {ev.concept}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--f-mono)',
                        fontSize: '9px',
                        letterSpacing: '0.08em',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        background:
                          ev.status === 'demonstrated'
                            ? 'rgba(26, 122, 74, 0.12)'
                            : ev.status === 'partial'
                            ? 'rgba(184, 124, 40, 0.12)'
                            : 'rgba(184, 50, 50, 0.12)',
                        color:
                          ev.status === 'demonstrated'
                            ? 'var(--c-success)'
                            : ev.status === 'partial'
                            ? 'var(--c-warning)'
                            : 'var(--c-danger)',
                      }}
                    >
                      {ev.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-mid)', lineHeight: 1.5 }}>
                    {ev.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION: ACTIONABLE RECOMMENDATIONS ── */}
        {report?.recommendations && report.recommendations.length > 0 && (
          <section style={{ marginBottom: 'var(--space-16)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderBottom: '1px solid var(--c-rule)',
                paddingBottom: 'var(--space-4)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div className="sys-label" style={{ color: 'var(--c-ink)' }}>
                03 / Recommended Learning Path
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {report.recommendations.map((rec, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 'var(--space-4)',
                    padding: 'var(--space-4)',
                    background: 'var(--c-surface)',
                    border: '1px solid var(--c-rule)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-xs)', color: 'var(--c-accent)', fontWeight: 600 }}>
                    [{i + 1}]
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--c-ink)' }}>{rec}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SECTION: COURSE RESOURCES ── */}
        {report?.resources && (report.resources.free.length > 0 || report.resources.paid.length > 0) && (
          <section style={{ marginBottom: 'var(--space-16)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderBottom: '1px solid var(--c-rule)',
                paddingBottom: 'var(--space-4)',
                marginBottom: 'var(--space-8)',
              }}
            >
              <div className="sys-label" style={{ color: 'var(--c-ink)' }}>
                {report.recommendations && report.recommendations.length > 0 ? '04' : '03'} / Learning Resources
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-mid)', fontFamily: 'var(--f-mono)' }}>
                Curated — {report.resources.source}
              </span>
            </div>

            {/* FREE resources */}
            {report.resources.free.length > 0 && (
              <div style={{ marginBottom: 'var(--space-8)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: '10px',
                      letterSpacing: '0.12em',
                      padding: '2px 8px',
                      background: 'rgba(26, 122, 74, 0.1)',
                      color: 'var(--c-success)',
                      border: '1px solid rgba(26, 122, 74, 0.2)',
                    }}
                  >
                    FREE
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-mid)' }}>
                    {report.resources.free.length} resource{report.resources.free.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                  {report.resources.free.map((r) => (
                    <ResourceCard key={r.id} resource={r} />
                  ))}
                </div>
              </div>
            )}

            {/* PAID resources */}
            {report.resources.paid.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: '10px',
                      letterSpacing: '0.12em',
                      padding: '2px 8px',
                      background: 'rgba(100, 100, 200, 0.1)',
                      color: 'var(--c-accent)',
                      border: '1px solid rgba(100, 100, 200, 0.2)',
                    }}
                  >
                    PAID
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-mid)' }}>
                    {report.resources.paid.length} resource{report.resources.paid.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                  {report.resources.paid.map((r) => (
                    <ResourceCard key={r.id} resource={r} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── CALL TO ACTION ROW ── */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/assess')}>
            Start Next Assessment →
          </button>
          {report?.gapAnalysis && report.gapAnalysis.filter((g) => g.gap < 0).length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                // Navigate to reassessment focused on weakest competencies
                const weakest = report.gapAnalysis
                  .filter((g) => g.gap < 0)
                  .sort((a, b) => a.gap - b.gap)
                  .slice(0, 3)
                  .map((g) => g.competencyId);
                navigate('/assess', { state: { focusCompetencies: weakest, isReassessment: true } });
              }}
            >
              Targeted Reassessment
            </button>
          )}
          <Link to="/skills">
            <button className="btn btn-secondary">View Complete Skill Profile</button>
          </Link>
        </div>
      </div>
    </main>
  );
}

// ── ResourceCard component ──────────────────────────────────────────────────
function ResourceCard({ resource }: { resource: CourseResource }) {
  return (
    <motion.a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'block',
        padding: 'var(--space-5)',
        background: 'var(--c-surface)',
        border: '1px solid var(--c-rule)',
        borderRadius: '2px',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.15s ease',
      }}
      whileHover={{ borderColor: 'var(--c-accent)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <span
          style={{
            fontFamily: 'var(--f-mono)',
            fontSize: '9px',
            letterSpacing: '0.1em',
            padding: '1px 5px',
            background: 'var(--c-surface-2)',
            color: 'var(--c-mid)',
            border: '1px solid var(--c-rule)',
          }}
        >
          {resource.resourceType.toUpperCase()}
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-mid)', fontFamily: 'var(--f-mono)' }}>
          {resource.estimatedDuration}
        </span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)', lineHeight: 1.35 }}>
        {resource.title}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--c-mid)', marginBottom: 'var(--space-3)' }}>
        {resource.provider} · {resource.difficulty}
      </div>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-mid)', lineHeight: 1.5, marginBottom: 0 }}>
        {resource.reason}
      </p>
    </motion.a>
  );
}
