import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInterview } from '../../hooks/useInterview';
import { VoiceOrb } from '../../components/interview/VoiceOrb';
import { LiveEstimatePanel } from '../../components/interview/LiveEstimatePanel';
import { AdaptiveStatePanel } from '../../components/interview/AdaptiveStatePanel';
import { padIndex } from '../../lib/utils';
import { mockRoles } from '../../mock/roles';
import { SystemFooter } from '../../components/layout/SystemFooter';

const competencyNameMap: Record<string, string> = {
  'comp-dsa': 'DSA',
  'comp-python': 'Python',
  'comp-sql': 'SQL',
  'comp-debugging': 'Debugging',
  'comp-system-design': 'System Design',
};

export function InterviewPage() {
  const navigate = useNavigate();
  const {
    sessionId,
    targetRoleId,
    currentQuestion,
    questionIndex,
    totalQuestions,
    voiceState,
    transcript,
    adaptiveState,
    skillEstimates,
    adaptationNotice,
    isComplete,
    startSession,
    startListening,
    stopListening,
  } = useInterview();

  const role = mockRoles.find((r) => r.id === targetRoleId);
  const currentCompetency = currentQuestion
    ? competencyNameMap[currentQuestion.competencyId] ?? currentQuestion.competencyId
    : null;

  // Auto-start when session is ready
  useEffect(() => {
    if (sessionId && targetRoleId && !currentQuestion && !isComplete) {
      startSession(sessionId, targetRoleId);
    }
  }, [sessionId, targetRoleId]);

  // If no session, redirect to assess
  useEffect(() => {
    if (!sessionId) {
      navigate('/assess');
    }
  }, []);

  // When complete, redirect to report
  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => navigate('/report'), 2000);
      return () => clearTimeout(t);
    }
  }, [isComplete]);

  const progress = totalQuestions > 0 ? ((questionIndex) / totalQuestions) * 100 : 0;

  return (
    <main className="page-shell" style={{ background: 'var(--c-paper)' }}>
      {/* Progress bar */}
      <div
        className="progress-strip"
        style={{
          position: 'fixed',
          top: '56px',
          left: 0,
          right: 0,
          zIndex: 90,
        }}
        role="progressbar"
        aria-valuenow={questionIndex}
        aria-valuemin={0}
        aria-valuemax={totalQuestions}
        aria-label={`Question ${questionIndex + 1} of ${totalQuestions}`}
      >
        <motion.div
          className="progress-fill"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className="interview-layout">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="interview-sidebar-left" aria-label="Session information">
          <div className="session-block">
            <span className="session-key">Session</span>
            <span className="session-val">{sessionId ? sessionId.toUpperCase() : '—'}</span>
          </div>

          {role && (
            <div className="session-block">
              <span className="session-key">Target</span>
              <span className="session-val" style={{ fontSize: 'var(--text-xs)', lineHeight: 1.4 }}>
                {role.title.toUpperCase()}
              </span>
            </div>
          )}

          <div className="session-block">
            <span className="session-key">Question</span>
            <span className="session-val accent">
              {padIndex(questionIndex + 1)} / {padIndex(totalQuestions)}
            </span>
          </div>

          {currentCompetency && (
            <div className="session-block">
              <span className="session-key">Competency</span>
              <span className="session-val accent">{currentCompetency.toUpperCase()}</span>
            </div>
          )}

          {currentQuestion && (
            <div className="session-block">
              <span className="session-key">Difficulty</span>
              <span
                className={`session-val ${
                  currentQuestion.difficulty === 'hard' || currentQuestion.difficulty === 'expert'
                    ? 'hard'
                    : currentQuestion.difficulty === 'medium'
                    ? 'medium'
                    : ''
                }`}
              >
                {currentQuestion.difficulty.toUpperCase()}
              </span>
            </div>
          )}

          <div className="session-block">
            <span className="session-key">Type</span>
            <span className="session-val" style={{ color: 'var(--c-mid)', fontSize: 'var(--text-xs)' }}>
              {currentQuestion?.questionType?.toUpperCase() ?? '—'}
            </span>
          </div>

          {/* Adaptive state */}
          <div style={{ marginTop: 'auto' }}>
            <AdaptiveStatePanel
              state={adaptiveState}
              competencyName={currentCompetency ?? undefined}
              questionIndex={questionIndex}
            />
          </div>
        </aside>

        {/* ── CENTER ── */}
        <section className="interview-center" aria-label="Interview interaction area">
          {/* Subtle visible system adaptation notification */}
          <AnimatePresence>
            {adaptationNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.35 }}
                style={{
                  padding: 'var(--space-3) var(--space-6)',
                  background: 'var(--c-surface)',
                  border: '1px solid var(--c-accent)',
                  borderRadius: '2px',
                  marginBottom: 'var(--space-4)',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(26,92,228,0.12)',
                  maxWidth: '460px',
                  width: '100%',
                }}
              >
                <div className="sys-label" style={{ color: 'var(--c-accent)', marginBottom: '2px' }}>
                  ANSWER ANALYZED
                </div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                  {(competencyNameMap[adaptationNotice.competencyName] ?? adaptationNotice.competencyName).toUpperCase()}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--c-ink)', marginTop: '4px', fontFamily: 'var(--f-mono)' }}>
                  ESTIMATE: {adaptationNotice.previousEstimate} → <span style={{ color: 'var(--c-accent)', fontWeight: 700 }}>{adaptationNotice.newEstimate}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--c-mid)', marginTop: '2px', fontFamily: 'var(--f-mono)' }}>
                  DIFFICULTY: {adaptationNotice.previousDifficulty.toUpperCase()} → <span style={{ color: 'var(--c-ink)', fontWeight: 700 }}>{adaptationNotice.nextDifficulty.toUpperCase()}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question display */}
          <div className="question-area">
            <AnimatePresence mode="wait">
              {currentQuestion ? (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}
                >
                  {/* Question badges */}
                  <div className="question-meta-row">
                    <span className="question-badge">
                      Q {padIndex(questionIndex + 1)}
                    </span>
                    <span
                      className={`question-badge ${
                        currentQuestion.difficulty === 'hard' || currentQuestion.difficulty === 'expert'
                          ? 'hard'
                          : currentQuestion.difficulty === 'medium'
                          ? 'medium'
                          : ''
                      }`}
                    >
                      {currentQuestion.difficulty.toUpperCase()}
                    </span>
                    {currentCompetency && (
                      <span className="question-badge accent">{currentCompetency.toUpperCase()}</span>
                    )}
                  </div>

                  {/* Question text */}
                  <p className="question-text" aria-live="polite">
                    {currentQuestion.question}
                  </p>

                  {/* Expected concepts (shown after evaluation) */}
                  <AnimatePresence>
                    {voiceState === 'evaluating' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: 'left', width: '100%', maxWidth: '500px' }}
                      >
                        <div className="sys-label" style={{ marginBottom: 'var(--space-3)' }}>
                          Evaluating Coverage
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                          {currentQuestion.expectedConcepts.map((concept, i) => (
                            <motion.span
                              key={concept}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.08 }}
                              style={{
                                fontFamily: 'var(--f-mono)',
                                fontSize: '10px',
                                letterSpacing: '0.08em',
                                padding: '3px 8px',
                                border: '1px solid var(--c-rule)',
                                color: 'var(--c-mid)',
                              }}
                            >
                              {concept}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ textAlign: 'center' }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.2em',
                      color: 'var(--c-mid)',
                    }}
                    aria-live="polite"
                  >
                    {isComplete ? 'ASSESSMENT COMPLETE' : 'PREPARING ASSESSMENT...'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Voice orb */}
          <VoiceOrb
            state={voiceState}
            onStartListening={startListening}
            onStopListening={stopListening}
          />

          {/* Transcript preview */}
          <AnimatePresence>
            {transcript && voiceState !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 0.5, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  maxWidth: '540px',
                  width: '100%',
                  padding: 'var(--space-4)',
                  borderTop: '1px solid var(--c-rule)',
                }}
              >
                <div className="sys-label" style={{ marginBottom: 'var(--space-2)' }}>Transcript</div>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--c-mid)',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                  }}
                  aria-live="polite"
                >
                  "{transcript}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="interview-sidebar-right" aria-label="Live skill estimates">
          <LiveEstimatePanel estimates={skillEstimates} roleId={targetRoleId ?? 'role-001'} />
        </aside>
      </div>
      <SystemFooter />
    </main>
  );
}
