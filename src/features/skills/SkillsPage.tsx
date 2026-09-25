import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSkillProfile, useGapAnalysis } from '../../hooks/useSkillProfile';
import { mockRoles } from '../../mock/roles';
import { trendSymbol, formatConfidence } from '../../lib/utils';

const competencyNameMap: Record<string, string> = {
  'comp-dsa': 'DSA',
  'comp-python': 'Python',
  'comp-sql': 'SQL',
  'comp-debugging': 'Debugging',
  'comp-system-design': 'System Design',
};

export function SkillsPage() {
  const { data: estimates, isLoading } = useSkillProfile();
  const { data: gaps } = useGapAnalysis();
  const role = mockRoles[0];

  return (
    <main className="page-shell">
      <div className="page-header">
        <div className="container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 'var(--space-4)',
            }}
          >
            <div>
              <div className="sys-label" style={{ marginBottom: 'var(--space-3)', color: 'var(--c-accent)' }}>
                Skill Profile / User-001
              </div>
              <h1
                style={{
                  fontSize: 'clamp(32px, 5vw, 64px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                  color: 'var(--c-ink)',
                }}
              >
                SKILL<br />PROFILE
              </h1>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
              <span className="sys-label">Target Role</span>
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                {role.title.toUpperCase()}
              </span>
              <span className="sys-label">Sessions Completed: 3</span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="container">

          {/* Competency estimates */}
          <div style={{ marginBottom: 'var(--space-16)' }}>
            <div className="sys-label" style={{ marginBottom: 'var(--space-8)' }}>
              Current Estimates
            </div>

            {isLoading ? (
              <div className="sys-label">Loading...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {estimates?.map((est, i) => {
                  const name = competencyNameMap[est.competencyId] ?? est.competencyId;
                  const req = role.requirements.find((r) => r.competencyId === est.competencyId);
                  const targetLevel = req?.targetLevel ?? 70;
                  const gap = est.score - targetLevel;

                  return (
                    <motion.div
                      key={est.competencyId}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '180px 1fr 80px 80px 80px',
                        gap: 'var(--space-6)',
                        alignItems: 'center',
                        padding: 'var(--space-5) 0',
                        borderBottom: '1px solid var(--c-rule)',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--f-mono)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            marginBottom: '4px',
                          }}
                        >
                          {name}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--f-mono)',
                            fontSize: '10px',
                            color: 'var(--c-mid)',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {est.estimatedLevel}
                        </div>
                      </div>

                      {/* Bar */}
                      <div style={{ position: 'relative', height: '4px', background: 'var(--c-rule)' }}>
                        <motion.div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            background: gap >= 0 ? 'var(--c-accent)' : 'var(--c-mid)',
                          }}
                          initial={{ width: '0%' }}
                          animate={{ width: `${est.score}%` }}
                          transition={{ duration: 0.9, delay: i * 0.08 }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            left: `${targetLevel}%`,
                            width: '2px',
                            height: '14px',
                            background: 'var(--c-ink)',
                          }}
                        />
                      </div>

                      {/* Score */}
                      <div
                        style={{
                          fontFamily: 'var(--f-mono)',
                          fontSize: 'var(--text-2xl)',
                          fontWeight: 500,
                          color: 'var(--c-ink)',
                          textAlign: 'right',
                        }}
                      >
                        {est.score}
                      </div>

                      {/* Gap */}
                      <div
                        style={{
                          fontFamily: 'var(--f-mono)',
                          fontSize: 'var(--text-xs)',
                          color: gap >= 0 ? 'var(--c-accent)' : 'var(--c-danger)',
                          textAlign: 'right',
                        }}
                      >
                        {gap > 0 ? `+${gap}` : gap}
                      </div>

                      {/* Trend + Confidence */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                        <span
                          style={{
                            fontFamily: 'var(--f-mono)',
                            fontSize: 'var(--text-sm)',
                            color: est.trend === 'up' ? 'var(--c-success)' : est.trend === 'down' ? 'var(--c-danger)' : 'var(--c-mid)',
                          }}
                        >
                          {trendSymbol(est.trend)}
                        </span>
                        <span className="sys-label">{formatConfidence(est.confidence)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Temporal history */}
          {estimates && (
            <div style={{ marginBottom: 'var(--space-16)' }}>
              <div className="sys-label" style={{ marginBottom: 'var(--space-8)' }}>
                Trajectory / 3 Sessions
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: 'var(--space-4)',
                }}
              >
                {estimates.map((est) => {
                  const name = competencyNameMap[est.competencyId] ?? est.competencyId;
                  const history = est.skillHistory ?? [];
                  const maxScore = 100;
                  const svgH = 60;

                  return (
                    <div
                      key={est.competencyId}
                      style={{
                        border: '1px solid var(--c-rule)',
                        padding: 'var(--space-4)',
                      }}
                    >
                      <div className="sys-label" style={{ marginBottom: 'var(--space-3)' }}>
                        {name}
                      </div>
                      <svg
                        viewBox={`0 0 80 ${svgH}`}
                        width="100%"
                        style={{ display: 'block' }}
                        aria-label={`${name} score trajectory`}
                      >
                        {history.map((pt, j) => {
                          const x = j === 0 ? 4 : j === 1 ? 40 : 76;
                          const y = svgH - (pt.score / maxScore) * svgH + 2;
                          return (
                            <g key={pt.sessionId}>
                              {j > 0 && (
                                <line
                                  x1={j === 1 ? 4 : 40}
                                  y1={svgH - ((history[j - 1]?.score ?? 0) / maxScore) * svgH + 2}
                                  x2={x}
                                  y2={y}
                                  stroke="var(--c-accent)"
                                  strokeWidth="1"
                                  strokeDasharray="2 2"
                                />
                              )}
                              <circle cx={x} cy={y} r="2.5" fill="var(--c-accent)" />
                              <text
                                x={x}
                                y={y - 5}
                                textAnchor="middle"
                                fontSize="7"
                                fontFamily="var(--f-mono)"
                                fill="var(--c-mid)"
                              >
                                {pt.score}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gap analysis */}
          {gaps && (
            <div>
              <div className="sys-label" style={{ marginBottom: 'var(--space-4)' }}>
                Gap Analysis / {role.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {gaps.map((gap, i) => (
                  <motion.div
                    key={gap.competencyId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '160px 1fr 60px 60px',
                      gap: 'var(--space-6)',
                      alignItems: 'center',
                      padding: 'var(--space-4) 0',
                      borderBottom: '1px solid var(--c-rule)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--f-mono)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {gap.competencyName}
                    </div>

                    <div style={{ position: 'relative', height: '3px', background: 'var(--c-rule)' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          width: `${gap.currentScore}%`,
                          background: gap.gap >= 0 ? 'var(--c-accent)' : 'var(--c-mid)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          left: `${gap.targetScore}%`,
                          width: '2px',
                          height: '11px',
                          background: 'var(--c-ink)',
                        }}
                      />
                    </div>

                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-xs)', textAlign: 'right', color: 'var(--c-mid)' }}>
                      {gap.currentScore} → {gap.targetScore}
                    </div>

                    <div
                      style={{
                        fontFamily: 'var(--f-mono)',
                        fontSize: 'var(--text-xs)',
                        textAlign: 'right',
                        color: gap.gap >= 0 ? 'var(--c-accent)' : 'var(--c-danger)',
                        fontWeight: 500,
                      }}
                    >
                      {gap.gap > 0 ? `+${gap.gap}` : gap.gap}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-4)' }}>
                <Link to="/plan">
                  <button className="btn btn-primary">View Improvement Plan →</button>
                </Link>
                <Link to="/reassess">
                  <button className="btn btn-outline">Reassess Weaknesses</button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
