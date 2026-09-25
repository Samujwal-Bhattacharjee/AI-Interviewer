import { motion, AnimatePresence } from 'framer-motion';
import type { VoiceState } from '../../types/interview';

interface VoiceOrbProps {
  state: VoiceState;
  onStartListening: () => void;
  onStopListening: () => void;
}

const stateConfig: Record<VoiceState, { label: string; ariaLabel: string; color: string }> = {
  idle: { label: 'TAP TO RESPOND', ariaLabel: 'Tap to begin your verbal response', color: 'var(--c-rule)' },
  listening: { label: 'LISTENING', ariaLabel: 'Listening — tap to finish', color: 'var(--c-accent)' },
  transcribing: { label: 'TRANSCRIBING', ariaLabel: 'Transcribing your response', color: 'var(--c-mid)' },
  evaluating: { label: 'EVALUATING', ariaLabel: 'Evaluating your answer', color: 'var(--c-warning)' },
  speaking: { label: 'INTERVIEWER SPEAKING', ariaLabel: 'Interviewer is speaking', color: 'var(--c-ink)' },
  complete: { label: 'COMPLETE', ariaLabel: 'Interview complete', color: 'var(--c-success)' },
};

export function VoiceOrb({ state, onStartListening, onStopListening }: VoiceOrbProps) {
  const config = stateConfig[state];
  const isInteractive = state === 'idle' || state === 'listening';

  function handleClick() {
    if (state === 'idle') onStartListening();
    else if (state === 'listening') onStopListening();
  }

  return (
    <div className="voice-orb-container" role="region" aria-label="Voice interaction">
      {/* Waveform bars — visible during listening/speaking */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          height: '32px',
          marginBottom: 'var(--space-2)',
        }}
        aria-hidden="true"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <WaveBar key={i} index={i} state={state} />
        ))}
      </div>

      {/* Core orb */}
      <motion.button
        className={`voice-orb ${state}`}
        onClick={handleClick}
        disabled={!isInteractive}
        aria-label={config.ariaLabel}
        aria-pressed={state === 'listening'}
        animate={
          state === 'listening'
            ? { scale: [1, 1.04, 1], boxShadow: ['0 0 0 0px rgba(26,92,228,0)', '0 0 0 20px rgba(26,92,228,0.12)', '0 0 0 0px rgba(26,92,228,0)'] }
            : state === 'speaking'
            ? { scale: [1, 1.02, 0.99, 1] }
            : {}
        }
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={isInteractive ? { scale: 1.05 } : {}}
        whileTap={isInteractive ? { scale: 0.96 } : {}}
        style={{
          borderColor: config.color,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <OrbInner state={state} />
      </motion.button>

      {/* State label */}
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          className="voice-state-label"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          style={{ color: config.color }}
        >
          {config.label}
        </motion.span>
      </AnimatePresence>

      {/* Transcript preview */}
      <AnimatePresence>
        {state === 'evaluating' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              maxWidth: '400px',
              textAlign: 'center',
              padding: '0 var(--space-4)',
            }}
          >
            <div className="sys-label" style={{ marginBottom: 'var(--space-2)', color: 'var(--c-warning)' }}>
              Analyzing Evidence
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WaveBar({ index, state }: { index: number; state: VoiceState }) {
  const isActive = state === 'listening' || state === 'speaking';

  const heights = [4, 8, 12, 6, 16, 10, 4, 20, 8, 12, 6, 18, 4, 10, 14, 6, 20, 8, 4, 16, 10, 6, 12, 4];
  const baseHeight = heights[index] ?? 8;

  return (
    <motion.div
      style={{
        width: '2px',
        borderRadius: '1px',
        background: isActive
          ? state === 'listening'
            ? 'var(--c-accent)'
            : 'var(--c-mid)'
          : 'var(--c-rule)',
        originY: '100%',
      }}
      animate={
        isActive
          ? {
              height: [`${baseHeight * 0.3}px`, `${baseHeight}px`, `${baseHeight * 0.3}px`],
            }
          : { height: '3px' }
      }
      transition={
        isActive
          ? {
              duration: 0.6 + (index % 5) * 0.12,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: (index * 0.04) % 0.5,
            }
          : { duration: 0.3 }
      }
      aria-hidden="true"
    />
  );
}

function OrbInner({ state }: { state: VoiceState }) {
  if (state === 'speaking') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
        }}
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{ width: '3px', borderRadius: '2px', background: 'var(--c-paper)' }}
            animate={{ height: ['6px', '14px', '6px'] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
    );
  }

  if (state === 'transcribing' || state === 'evaluating') {
    return (
      <motion.div
        style={{
          width: '20px',
          height: '20px',
          border: '1.5px solid var(--c-mid)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        aria-hidden="true"
      />
    );
  }

  if (state === 'listening') {
    return (
      <div
        style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: 'var(--c-accent)',
        }}
        aria-hidden="true"
      />
    );
  }

  if (state === 'complete') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 10L8 14L16 6" stroke="var(--c-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Idle — microphone icon (thin)
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="7" y="2" width="6" height="10" rx="3" stroke="var(--c-mid)" strokeWidth="1.2" />
      <path d="M4 10a6 6 0 0 0 12 0" stroke="var(--c-mid)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10" y1="16" x2="10" y2="19" stroke="var(--c-mid)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
