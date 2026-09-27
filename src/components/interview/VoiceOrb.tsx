import { motion, AnimatePresence } from 'framer-motion';
import type { VoiceState } from '../../types/interview';

interface VoiceOrbProps {
  state: VoiceState;
  onStartListening: () => void;
  onStopListening: () => void;
  /** Whether ElevenLabs is configured on the backend */
  voiceEngineActive?: boolean;
}

const stateConfig: Record<VoiceState, { label: string; sublabel: string; ariaLabel: string; color: string }> = {
  idle:        { label: 'TAP TO RESPOND',        sublabel: 'Click the orb to begin your answer',    ariaLabel: 'Tap to begin your verbal response', color: 'var(--c-rule)' },
  listening:   { label: 'LISTENING',             sublabel: 'Speak now — click STOP ANSWER when done', ariaLabel: 'Listening — click Stop Answer to submit', color: 'var(--c-accent)' },
  transcribing:{ label: 'TRANSCRIBING',          sublabel: 'Finalizing your response…',              ariaLabel: 'Transcribing your response', color: 'var(--c-mid)' },
  evaluating:  { label: 'ANALYZING ANSWER',      sublabel: 'Groq is evaluating your response…',      ariaLabel: 'Evaluating your answer', color: 'var(--c-warning)' },
  speaking:    { label: 'INTERVIEWER SPEAKING',  sublabel: 'Please wait for the question to finish',  ariaLabel: 'Interviewer is speaking', color: 'var(--c-ink)' },
  complete:    { label: 'COMPLETE',              sublabel: 'Interview finished — generating report',  ariaLabel: 'Interview complete', color: 'var(--c-success)' },
};

export function VoiceOrb({ state, onStartListening, onStopListening, voiceEngineActive }: VoiceOrbProps) {
  const config = stateConfig[state];
  const canStartListening = state === 'idle';
  const isListening = state === 'listening';
  const isBusy = state === 'transcribing' || state === 'evaluating' || state === 'speaking';

  function handleOrbClick() {
    if (canStartListening) onStartListening();
  }

  return (
    <div className="voice-orb-container" role="region" aria-label="Voice interaction">
      {/* Voice engine badge */}
      <div style={{ marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'center' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '4px',
            border: `1px solid ${voiceEngineActive ? 'rgba(52,211,153,0.4)' : 'rgba(100,116,139,0.4)'}`,
            background: voiceEngineActive ? 'rgba(6,78,59,0.3)' : 'rgba(15,23,42,0.5)',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: voiceEngineActive ? 'rgb(110,231,183)' : 'rgb(100,116,139)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: voiceEngineActive ? 'rgb(52,211,153)' : 'rgb(100,116,139)',
              boxShadow: voiceEngineActive ? '0 0 6px rgb(52,211,153)' : 'none',
              display: 'inline-block',
            }}
          />
          {voiceEngineActive ? 'ELEVENLABS ACTIVE' : 'BROWSER TTS — DEMO VOICE'}
        </span>
      </div>

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

      {/* Core orb — only clickable in idle state */}
      <motion.button
        className={`voice-orb ${state}`}
        onClick={handleOrbClick}
        disabled={!canStartListening}
        aria-label={config.ariaLabel}
        aria-pressed={isListening}
        animate={
          isListening
            ? { scale: [1, 1.04, 1], boxShadow: ['0 0 0 0px rgba(26,92,228,0)', '0 0 0 20px rgba(26,92,228,0.12)', '0 0 0 0px rgba(26,92,228,0)'] }
            : state === 'speaking'
            ? { scale: [1, 1.02, 0.99, 1] }
            : {}
        }
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={canStartListening ? { scale: 1.05 } : {}}
        whileTap={canStartListening ? { scale: 0.96 } : {}}
        style={{
          borderColor: config.color,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: canStartListening ? 'pointer' : 'default',
          opacity: isBusy ? 0.7 : 1,
        }}
      >
        <OrbInner state={state} />
      </motion.button>

      {/* State label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}
        >
          <span className="voice-state-label" style={{ color: config.color, display: 'block' }}>
            {config.label}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--c-subtle)', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '4px' }}>
            {config.sublabel}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* STOP ANSWER button — prominent, only shown while listening */}
      <AnimatePresence>
        {isListening && (
          <motion.button
            id="stop-answer-btn"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.25 }}
            onClick={onStopListening}
            aria-label="Stop answer and submit"
            style={{
              marginTop: 'var(--space-4)',
              padding: '10px 28px',
              borderRadius: '6px',
              border: '1.5px solid rgba(239,68,68,0.6)',
              background: 'rgba(127,29,29,0.5)',
              color: 'rgb(252,165,165)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 12px rgba(239,68,68,0.2)',
              transition: 'all 0.2s',
            }}
            whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(239,68,68,0.35)' }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Stop icon */}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="8" height="8" rx="1" fill="rgb(252,165,165)" />
            </svg>
            STOP ANSWER
          </motion.button>
        )}
      </AnimatePresence>

      {/* Evaluating indicator */}
      <AnimatePresence>
        {state === 'evaluating' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 'var(--space-3)',
              maxWidth: '320px',
              textAlign: 'center',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(251,191,36,0.3)',
              background: 'rgba(120,53,15,0.3)',
            }}
          >
            <div className="sys-label" style={{ color: 'var(--c-warning)', fontSize: '11px', letterSpacing: '0.08em' }}>
              GROQ EVALUATING EVIDENCE
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
          ? { height: [`${baseHeight * 0.3}px`, `${baseHeight}px`, `${baseHeight * 0.3}px`] }
          : { height: '3px' }
      }
      transition={
        isActive
          ? { duration: 0.6 + (index % 5) * 0.12, repeat: Infinity, ease: 'easeInOut', delay: (index * 0.04) % 0.5 }
          : { duration: 0.3 }
      }
      aria-hidden="true"
    />
  );
}

function OrbInner({ state }: { state: VoiceState }) {
  if (state === 'speaking') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} aria-hidden="true">
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
        style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--c-accent)' }}
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

  // Idle — microphone icon
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="7" y="2" width="6" height="10" rx="3" stroke="var(--c-mid)" strokeWidth="1.2" />
      <path d="M4 10a6 6 0 0 0 12 0" stroke="var(--c-mid)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10" y1="16" x2="10" y2="19" stroke="var(--c-mid)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
