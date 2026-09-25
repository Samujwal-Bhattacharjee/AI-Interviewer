import { motion, AnimatePresence } from 'framer-motion';
import type { AdaptiveState } from '../../types/assessment';

interface AdaptiveStatePanelProps {
  state: AdaptiveState;
  competencyName?: string;
  questionIndex: number;
}

const actionLabels: Record<string, string> = {
  increase: 'Difficulty ↑',
  decrease: 'Difficulty ↓',
  probe: 'Probing',
  deepen: 'Deepening',
  gather_evidence: 'Evidence collection',
};

const difficultyOrder = ['foundational', 'easy', 'medium', 'hard', 'expert'];

function difficultyPosition(d: string): number {
  return (difficultyOrder.indexOf(d) / (difficultyOrder.length - 1)) * 100;
}

export function AdaptiveStatePanel({ state, competencyName, questionIndex }: AdaptiveStatePanelProps) {
  const currentPos = difficultyPosition(state.currentDifficulty);

  return (
    <div className="adaptive-panel">
      <div className="adaptive-panel-header">
        <span className="adaptive-panel-title">Adaptive Engine</span>
      </div>

      <div className="adaptive-panel-body">
        {/* Current question context */}
        <div className="adaptive-row">
          <span className="adaptive-key">Question</span>
          <span className="adaptive-val" style={{ fontFamily: 'var(--f-mono)', fontSize: '11px' }}>
            {String(questionIndex + 1).padStart(2, '0')}
          </span>
        </div>

        {competencyName && (
          <div className="adaptive-row">
            <span className="adaptive-key">Testing</span>
            <span className="adaptive-val" style={{ color: 'var(--c-accent)', fontSize: '11px' }}>
              {competencyName.toUpperCase()}
            </span>
          </div>
        )}

        <div className="adaptive-row">
          <span className="adaptive-key">Difficulty</span>
          <span
            className="adaptive-val"
            style={{
              color: state.currentDifficulty === 'hard' || state.currentDifficulty === 'expert'
                ? 'var(--c-danger)'
                : state.currentDifficulty === 'medium'
                ? 'var(--c-warning)'
                : 'var(--c-mid)',
            }}
          >
            {state.currentDifficulty.toUpperCase()}
          </span>
        </div>

        {/* Ability search bar */}
        <div style={{ padding: '0 0 var(--space-2)' }}>
          <div className="adaptive-key" style={{ marginBottom: 'var(--space-2)' }}>Search Region</div>
          <div style={{ position: 'relative', height: '6px', background: 'var(--c-rule)' }}>
            {/* Active search region */}
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: `${difficultyPosition(state.searchRegion.lower)}%`,
                width: `${difficultyPosition(state.searchRegion.upper) - difficultyPosition(state.searchRegion.lower)}%`,
                height: '100%',
                background: 'var(--c-accent-dim)',
                borderLeft: '1px solid var(--c-accent)',
                borderRight: '1px solid var(--c-accent)',
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Current position marker */}
            <motion.div
              style={{
                position: 'absolute',
                top: '-3px',
                left: `${currentPos}%`,
                width: '2px',
                height: '12px',
                background: 'var(--c-accent)',
                transform: 'translateX(-50%)',
              }}
              animate={{ opacity: 1 }}
              layoutId="current-difficulty-marker"
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
            }}
          >
            {difficultyOrder.map((d) => (
              <span
                key={d}
                style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: '9px',
                  color: d === state.currentDifficulty ? 'var(--c-accent)' : 'var(--c-mid-2)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {d.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>

        <div className="adaptive-row">
          <span className="adaptive-key">Estimate</span>
          <motion.span
            className="adaptive-val"
            key={state.currentEstimate}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {state.currentEstimate}
          </motion.span>
        </div>

        {state.lastAction && (
          <AnimatePresence mode="wait">
            <motion.div
              key={state.lastAction}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                borderTop: '1px solid var(--c-rule)',
                paddingTop: 'var(--space-3)',
              }}
            >
              <span className="adaptive-key" style={{ display: 'block', marginBottom: '2px' }}>
                Last Action
              </span>
              <span
                style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: '10px',
                  color: 'var(--c-accent)',
                  letterSpacing: '0.08em',
                }}
              >
                {actionLabels[state.lastAction] ?? state.lastAction}
              </span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
