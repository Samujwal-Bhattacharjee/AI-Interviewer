import { motion, AnimatePresence } from 'framer-motion';
import type { SkillEstimate } from '../../types/skills';
import { formatScore, formatConfidence, trendSymbol } from '../../lib/utils';
import { mockRoles } from '../../mock/roles';

interface LiveEstimatePanelProps {
  estimates: SkillEstimate[];
  roleId?: string;
}

const competencyNameMap: Record<string, string> = {
  'comp-dsa': 'DSA',
  'comp-python': 'Python',
  'comp-sql': 'SQL',
  'comp-debugging': 'Debugging',
  'comp-system-design': 'System Design',
};

export function LiveEstimatePanel({ estimates, roleId = 'role-001' }: LiveEstimatePanelProps) {
  const role = mockRoles.find((r) => r.id === roleId);
  const requirements = role?.requirements ?? [];

  return (
    <div
      role="region"
      aria-label="Live skill estimates"
      style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--c-rule)',
        }}
      >
        <span className="sys-label">Live Estimate</span>
        <span
          className="sys-label"
          style={{
            color: 'var(--c-accent)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--c-accent)',
              display: 'inline-block',
              animation: 'pulse-border 1.5s ease-in-out infinite',
            }}
          />
          Updating
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {estimates.map((estimate, i) => {
          const req = requirements.find((r) => r.competencyId === estimate.competencyId);
          const targetLevel = req?.targetLevel ?? 70;
          const name = competencyNameMap[estimate.competencyId] ?? estimate.competencyId;

          return (
            <motion.div
              key={estimate.competencyId}
              className="skill-row"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <div className="skill-row-header">
                <span className="skill-name">{name}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                  <motion.span
                    className="skill-score"
                    key={estimate.score}
                    initial={{ opacity: 0.4, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    aria-label={`${name} score: ${estimate.score}`}
                  >
                    {formatScore(estimate.score)}
                  </motion.span>
                  <span
                    style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 'var(--text-xs)',
                      color: estimate.trend === 'up'
                        ? 'var(--c-success)'
                        : estimate.trend === 'down'
                        ? 'var(--c-danger)'
                        : 'var(--c-mid)',
                    }}
                    aria-label={`Trend: ${estimate.trend}`}
                  >
                    {trendSymbol(estimate.trend)}
                  </span>
                </div>
              </div>

              <div className="skill-bar-track" role="progressbar" aria-valuenow={estimate.score} aria-valuemin={0} aria-valuemax={100}>
                <motion.div
                  className="skill-bar-fill"
                  style={{ width: `${estimate.score}%` }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${estimate.score}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
                <div
                  className="skill-bar-target"
                  style={{ left: `${targetLevel}%` }}
                  aria-label={`Target: ${targetLevel}`}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span className="skill-confidence">
                  conf {formatConfidence(estimate.confidence)}
                </span>
                {req && estimate.score < targetLevel && (
                  <span
                    style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--c-danger)',
                    }}
                    aria-label={`Gap: ${estimate.score - targetLevel}`}
                  >
                    {estimate.score - targetLevel}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
