import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInterview } from '../../hooks/useInterview';
import { VoiceOrb } from '../../components/interview/VoiceOrb';
import { LiveEstimatePanel } from '../../components/interview/LiveEstimatePanel';
import { AdaptiveStatePanel } from '../../components/interview/AdaptiveStatePanel';
import { padIndex } from '../../lib/utils';
import { mockRoles } from '../../mock/roles';
import { SystemFooter } from '../../components/layout/SystemFooter';
import { voiceService } from '../../services/voiceService';
import { getLanguageByCode } from '../../config/languages';

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
    voiceEngineStatus,
    interviewMode,
    selectedLanguage,
    professionalEnglishVersion,
  } = useInterview();

  const [showOriginalEnglish, setShowOriginalEnglish] = useState(false);
  const [isPlayingEnglish, setIsPlayingEnglish] = useState(false);

  const langConfig = getLanguageByCode(selectedLanguage || 'hi-IN');
  const isNativeMode = interviewMode === 'mode1_native' || interviewMode === 'native';
  const localizedText = currentQuestion?.localizedQuestionText || currentQuestion?.questionTranslated;
  const isTranslationUnavailable = localizedText?.startsWith('TRANSLATION UNAVAILABLE');

  const role = mockRoles.find((r) => r.id === targetRoleId);
  const currentCompetency = currentQuestion
    ? competencyNameMap[currentQuestion.competencyId] ?? currentQuestion.competencyId
    : null;


  const hasStartedRef = useRef(false);

  // Auto-start when session is ready — guarded so it fires exactly once per mount
  useEffect(() => {
    if (sessionId && targetRoleId && !currentQuestion && !isComplete && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startSession(sessionId, targetRoleId);
    }
  }, [sessionId, targetRoleId, currentQuestion, isComplete, startSession]);

  // If no session, redirect to assess
  useEffect(() => {
    if (!sessionId) {
      navigate('/assess');
    }
  }, [sessionId, navigate]);

  // When complete, redirect to report
  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(() => navigate('/report'), 2000);
      return () => clearTimeout(t);
    }
  }, [isComplete, navigate]);

  const progress = totalQuestions > 0 ? (questionIndex / totalQuestions) * 100 : 0;

  return (
    <main className="text-white min-h-screen selection:bg-cyan-500 selection:text-black relative flex flex-col justify-between">
      {/* Top glowing progress bar */}
      <div
        className="fixed top-[52px] inset-x-0 h-1 bg-black/60 z-40 overflow-hidden"
        role="progressbar"
        aria-valuenow={questionIndex}
        aria-valuemin={0}
        aria-valuemax={totalQuestions}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-cyan-300 shadow-[0_0_12px_#00f0ff]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className="max-w-[1720px] mx-auto w-full px-4 lg:px-8 py-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT SIDEBAR ── */}
          <aside className="lg:col-span-3 space-y-6" aria-label="Session information">
            <div className="glass-panel p-6 rounded-lg space-y-4 font-mono text-xs border-t-2 border-t-cyan-400/80">
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                  ACTIVE SESSION
                </span>
                <span className="text-white font-bold tracking-wider">
                  {sessionId ? sessionId.toUpperCase().slice(0, 12) : 'CALIBRATING'}
                </span>
              </div>

              {role && (
                <div className="border-l-2 border-cyan-400 pl-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">TARGET ROLE</div>
                  <div className="font-bold text-white tracking-wider text-sm mt-0.5">
                    {role.title.toUpperCase()}
                  </div>
                </div>
              )}

              <div className="border-l-2 border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">QUESTION PROGRESS</div>
                <div className="font-headline text-lg text-cyan-300 mt-0.5">
                  {padIndex(questionIndex + 1)} <span className="text-slate-500 font-mono text-xs">/ {padIndex(totalQuestions)}</span>
                </div>
              </div>

              {currentCompetency && (
                <div className="border-l-2 border-cyan-400 pl-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">COMPETENCY</div>
                  <div className="font-bold text-white text-sm mt-0.5">{currentCompetency.toUpperCase()}</div>
                </div>
              )}

              {currentQuestion && (
                <div className="border-l-2 border-slate-700 pl-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">DIFFICULTY LEVEL</div>
                  <div className="mt-0.5 flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                        currentQuestion.difficulty === 'hard' || currentQuestion.difficulty === 'expert'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                          : currentQuestion.difficulty === 'medium'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      }`}
                    >
                      {currentQuestion.difficulty.toUpperCase()}
                    </span>
                    <span className="text-slate-400 text-[10px]">{currentQuestion.questionType?.toUpperCase()}</span>
                  </div>
                </div>
              )}

              {currentQuestion?.sourceType && (
                <div className="border-l-2 border-cyan-400 pl-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">QUESTION SOURCE</div>
                  <div className="mt-0.5 font-bold text-cyan-300 text-xs uppercase tracking-wider">
                    {currentQuestion.sourceType}
                  </div>
                  {currentQuestion.documentTitle && (
                    <div className="text-[10px] text-slate-300 truncate mt-0.5">
                      {currentQuestion.documentTitle}
                    </div>
                  )}
                </div>
              )}

              <div className="border-l-2 border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">INTERVIEW MODE</div>
                <div className="mt-1 flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-cyan-950/80 border border-cyan-400/40 text-cyan-300">
                    {isNativeMode ? 'MODE 1: IN MY LANGUAGE' : 'MODE 2: BILINGUAL'}
                  </span>
                </div>
              </div>

              <div className="border-l-2 border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">QUESTION LANGUAGE</div>
                <div className="mt-1 flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-black/40 border border-white/10 text-cyan-300">
                    {isNativeMode ? `${langConfig.name.toUpperCase()} (${langConfig.nativeName})` : 'ENGLISH (EN)'}
                  </span>
                </div>
              </div>

              <div className="border-l-2 border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">ANSWER LANGUAGE</div>
                <div className="mt-1 flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-black/40 border border-white/10 text-emerald-300">
                    {isNativeMode ? `${langConfig.name.toUpperCase()} (${langConfig.nativeName})` : 'ANY LANGUAGE (AUTO)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Adaptive state panel */}
            <div className="glass-panel p-6 rounded-lg font-mono">
              <AdaptiveStatePanel
                state={adaptiveState}
                competencyName={currentCompetency ?? undefined}
                questionIndex={questionIndex}
              />
            </div>
          </aside>

          {/* ── CENTER INTERACTION AREA ── */}
          <section className="lg:col-span-6 flex flex-col items-center space-y-6" aria-label="Interview interaction area">
            {/* Adaptation notice banner */}
            <AnimatePresence>
              {adaptationNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.35 }}
                  className="glass-card p-4 rounded-lg w-full text-center border-l-4 border-l-cyan-400 font-mono shadow-glow-cyan-sm"
                >
                  <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                    [IRT ADAPTATION RECORDED]
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {(competencyNameMap[adaptationNotice.competencyName] ?? adaptationNotice.competencyName).toUpperCase()}
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    ESTIMATE: {adaptationNotice.previousEstimate} →{' '}
                    <span className="text-cyan-400 font-bold">{adaptationNotice.newEstimate}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question card */}
            <div className="glass-panel p-8 sm:p-10 rounded-lg w-full relative overflow-hidden border-t-2 border-t-cyan-400 shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-2xl pointer-events-none" />
              <AnimatePresence mode="wait">
                {currentQuestion ? (
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.45 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 font-mono text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-cyan-400 text-black font-bold uppercase shadow-glow-cyan-sm">
                          Q {padIndex(questionIndex + 1)}
                        </span>
                        <span className="text-cyan-300 font-semibold uppercase">
                          [{currentCompetency?.toUpperCase()}]
                        </span>
                      </div>
                      <span className="text-slate-400 uppercase tracking-wider text-[11px]">
                        24KHZ PCM LIVE
                      </span>
                    </div>

                    {/* Language header and explicit fallback if translation failed */}
                    <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-slate-400">
                      <span className="text-cyan-400 font-bold">
                        QUESTION / {isNativeMode && !showOriginalEnglish ? `${langConfig.name.toUpperCase()}` : 'ENGLISH'}
                      </span>
                      {isNativeMode && (
                        <span className="text-slate-500">
                          {showOriginalEnglish ? 'CANONICAL REFERENCE' : `NATIVE DELIVERY (${langConfig.nativeName})`}
                        </span>
                      )}
                    </div>

                    {/* Question Source Banner */}
                    {currentQuestion.sourceType && (
                      <div className="p-2.5 rounded bg-black/40 border border-cyan-400/30 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-bold uppercase text-[10px] border border-cyan-400/40">
                            SOURCE: {currentQuestion.sourceType}
                          </span>
                          {currentQuestion.documentTitle && (
                            <span className="text-slate-300 truncate text-[11px]">
                              {currentQuestion.documentTitle}
                              {currentQuestion.topicName ? ` // Topic: ${currentQuestion.topicName}` : ''}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:inline">
                          TRACEABLE
                        </span>
                      </div>
                    )}

                    {isTranslationUnavailable && (
                      <div className="p-3 bg-amber-950/60 border border-amber-500/50 rounded flex items-center justify-between text-xs font-mono text-amber-200">
                        <span>⚠️ TRANSLATION UNAVAILABLE</span>
                        <button
                          type="button"
                          onClick={() => setShowOriginalEnglish(true)}
                          className="px-2.5 py-1 bg-amber-500 text-black font-bold uppercase rounded hover:bg-amber-400 cursor-pointer"
                        >
                          USE ENGLISH
                        </button>
                      </div>
                    )}

                    <p className="font-body text-xl sm:text-2xl text-white font-medium leading-relaxed tracking-tight" aria-live="polite">
                      {isNativeMode && localizedText && !showOriginalEnglish && !isTranslationUnavailable
                        ? localizedText
                        : currentQuestion.question}
                    </p>

                    {isNativeMode && localizedText && !isTranslationUnavailable && (
                      <div className="flex items-center justify-between pt-1 font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => setShowOriginalEnglish((v) => !v)}
                          className="text-cyan-400 hover:text-cyan-300 text-[11px] uppercase tracking-wider underline cursor-pointer"
                        >
                          {showOriginalEnglish ? `← VIEW ${langConfig.name.toUpperCase()} QUESTION` : 'VIEW ORIGINAL ENGLISH →'}
                        </button>
                        <span className="text-slate-400 text-[10px] uppercase">
                          🗣️ ELEVENLABS {langConfig.name.toUpperCase()} VOICE
                        </span>
                      </div>
                    )}

                    {/* Expected concepts when evaluating */}
                    <AnimatePresence>
                      {voiceState === 'evaluating' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="pt-4 border-t border-white/10"
                        >
                          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-2 font-bold">
                            EVALUATING COVERAGE &amp; TECHNICAL REASONING
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentQuestion.expectedConcepts.map((concept, i) => (
                              <motion.span
                                key={concept}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.08 }}
                                className="px-2.5 py-1 rounded bg-black/60 border border-cyan-400/40 text-cyan-200 font-mono text-xs"
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
                    className="text-center py-12"
                  >
                    <div className="font-mono text-sm tracking-widest text-cyan-400 animate-pulse uppercase">
                      {isComplete ? 'ASSESSMENT COMPLETE — GENERATING REPORT' : 'CALIBRATING IRT ENGINE...'}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Voice interaction orb & controls */}
            <div className="w-full flex flex-col items-center">
              <VoiceOrb
                state={voiceState}
                onStartListening={startListening}
                onStopListening={stopListening}
                voiceEngineActive={voiceEngineStatus?.available ?? false}
              />
            </div>

            {/* Live phonetic transcript card */}
            <AnimatePresence>
              {transcript && voiceState !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass-card-subtle p-5 rounded-lg w-full max-w-xl font-mono text-xs border border-white/15"
                >
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                    <span>LIVE TRANSCRIPT</span>
                  </div>
                  <p className="text-slate-200 font-sans text-sm italic leading-relaxed">
                    "{transcript}"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Professional English formulation (Mode 2 & Multilingual coaching) */}
            <AnimatePresence>
              {professionalEnglishVersion && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="glass-panel p-6 rounded-lg w-full max-w-xl border-t-2 border-t-amber-400 font-mono text-xs space-y-3 shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">🚀</span>
                      <span className="text-amber-300 font-bold uppercase tracking-wider">
                        EXPRESSED IN PROFESSIONAL ENGLISH
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-400/40 text-[9px] font-bold uppercase">
                      BILINGUAL COACH
                    </span>
                  </div>

                  <p className="font-body text-sm text-slate-100 italic leading-relaxed">
                    "{professionalEnglishVersion}"
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsPlayingEnglish(true);
                        try {
                          await voiceService.speak(professionalEnglishVersion);
                        } finally {
                          setIsPlayingEnglish(false);
                        }
                      }}
                      disabled={isPlayingEnglish}
                      className="px-3 py-1.5 rounded bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/50 text-amber-300 text-[11px] font-bold uppercase flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <span>{isPlayingEnglish ? '🔊 SPEAKING...' : '🔊 LISTEN IN ENGLISH'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(professionalEnglishVersion);
                        alert('Copied professional English formulation to clipboard!');
                      }}
                      className="text-slate-400 hover:text-slate-200 underline text-[11px] uppercase cursor-pointer"
                    >
                      COPY FORMULATION
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* ── RIGHT SIDEBAR: LIVE ESTIMATES ── */}
          <aside className="lg:col-span-3 space-y-6" aria-label="Live skill estimates">
            <div className="glass-panel p-6 rounded-lg font-mono">
              <LiveEstimatePanel estimates={skillEstimates} roleId={targetRoleId ?? 'role-001'} />
            </div>
          </aside>
        </div>
      </div>

      <SystemFooter />
    </main>
  );
}
