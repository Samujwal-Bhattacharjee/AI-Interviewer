import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTargetRoles, useCreateSession } from '../../hooks/useAssessment';
import type { AssessmentDuration } from '../../types/assessment';
import type { RoleLevel } from '../../types/roles';
import { useInterviewStore } from '../../store/interviewStore';

const levelOptions: { value: RoleLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'junior', label: 'Junior' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'senior', label: 'Senior' },
];

const durationOptions: { value: AssessmentDuration; label: string; detail: string; count: number }[] = [
  { value: 'quick', label: 'Quick', detail: '~5 questions', count: 5 },
  { value: 'standard', label: 'Standard', detail: '~10 questions', count: 10 },
  { value: 'deep', label: 'Deep', detail: '~20 questions', count: 20 },
];

export function AssessmentPage() {
  const navigate = useNavigate();
  const { data: roles, isLoading } = useTargetRoles();
  const createSession = useCreateSession();
  const setSession = useInterviewStore((s) => s.setSession);
  const reset = useInterviewStore((s) => s.reset);

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [level, setLevel] = useState<RoleLevel>('junior');
  const [duration, setDuration] = useState<AssessmentDuration>('standard');
  const [focusIds, setFocusIds] = useState<string[]>([]);

  const selectedRole = roles?.find((r) => r.id === selectedRoleId);

  function toggleFocus(compId: string) {
    setFocusIds((prev) =>
      prev.includes(compId) ? prev.filter((id) => id !== compId) : [...prev, compId]
    );
  }

  async function handleBegin() {
    if (!selectedRoleId) return;
    reset();
    const session = await createSession.mutateAsync({
      targetRoleId: selectedRoleId,
      level,
      focusCompetencies: focusIds.length > 0 ? focusIds : selectedRole?.competencies.map((c) => c.id) ?? [],
      duration,
    });
    const count = durationOptions.find((d) => d.value === duration)?.count ?? 10;
    setSession(session.id, selectedRoleId, count);
    navigate('/interview');
  }

  return (
    <main className="page-shell">
      <div className="assess-layout">
        {/* Sidebar — summary */}
        <aside className="assess-sidebar" aria-label="Assessment configuration summary">
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <div className="sys-label" style={{ marginBottom: 'var(--space-2)', color: 'var(--c-accent)' }}>
              Assessment / Configure
            </div>
            <div
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--c-ink)',
                lineHeight: 1.2,
              }}
            >
              New Assessment
            </div>
          </div>

          <hr className="rule" style={{ marginBottom: 'var(--space-8)' }} />

          {/* Summary blocks */}
          <div className="assess-summary-block">
            <div className="assess-summary-key">Target / 01</div>
            <div className="assess-summary-value">
              {selectedRole ? selectedRole.title : '—'}
            </div>
          </div>

          <div className="assess-summary-block">
            <div className="assess-summary-key">Level / 02</div>
            <div className="assess-summary-value" style={{ textTransform: 'capitalize' }}>
              {level}
            </div>
          </div>

          <div className="assess-summary-block">
            <div className="assess-summary-key">Focus / 03</div>
            <div className="assess-summary-value">
              {focusIds.length > 0
                ? selectedRole?.competencies
                    .filter((c) => focusIds.includes(c.id))
                    .map((c) => c.name)
                    .join(', ')
                : selectedRole
                ? 'All competencies'
                : '—'}
            </div>
          </div>

          <div className="assess-summary-block">
            <div className="assess-summary-key">Assessment / 04</div>
            <div className="assess-summary-value">
              {durationOptions.find((d) => d.value === duration)?.detail ?? '—'}
              <br />
              <span style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-xs)', color: 'var(--c-mid)', fontWeight: 400 }}>
                adaptive difficulty
              </span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-8)' }}>
            <motion.button
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', width: '100%' }}
              onClick={handleBegin}
              disabled={!selectedRoleId || createSession.isPending}
              aria-label="Begin the assessment"
              whileHover={selectedRoleId ? { scale: 1.01 } : {}}
              whileTap={selectedRoleId ? { scale: 0.98 } : {}}
            >
              {createSession.isPending ? 'Preparing...' : 'Begin Assessment →'}
            </motion.button>
            {!selectedRoleId && (
              <p
                style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--c-mid)',
                  marginTop: 'var(--space-3)',
                  textAlign: 'center',
                  letterSpacing: '0.06em',
                }}
              >
                Select a target role to continue
              </p>
            )}
          </div>
        </aside>

        {/* Main — steps */}
        <div className="assess-main">

          {/* Step 01 — Target */}
          <div className="assess-step">
            <div className="assess-step-header">
              <span className="assess-step-num">01</span>
              <span className="assess-step-title">Target Role</span>
            </div>

            {isLoading ? (
              <div
                style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--c-mid)',
                  letterSpacing: '0.1em',
                }}
              >
                Loading roles...
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                {roles?.map((role) => (
                  <motion.button
                    key={role.id}
                    className={`role-card ${selectedRoleId === role.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedRoleId(role.id);
                      setFocusIds([]);
                    }}
                    aria-pressed={selectedRoleId === role.id}
                    aria-label={`Select ${role.title}`}
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="role-card-title">{role.title}</div>
                    <div className="role-card-meta">
                      {role.level.toUpperCase()} · {role.technologies.slice(0, 3).join(', ')}
                    </div>
                  </motion.button>
                ))}
                {/* Upload JD placeholder */}
                <button
                  className="role-card"
                  disabled
                  aria-label="Upload job description — coming soon"
                  style={{ opacity: 0.4, cursor: 'not-allowed', borderStyle: 'dashed' }}
                >
                  <div className="role-card-title" style={{ color: 'var(--c-mid)' }}>+ Upload Job Description</div>
                  <div className="role-card-meta">coming in Phase 2</div>
                </button>
              </div>
            )}
          </div>

          {/* Step 02 — Level */}
          <div className="assess-step">
            <div className="assess-step-header">
              <span className="assess-step-num">02</span>
              <span className="assess-step-title">Seniority Level</span>
            </div>
            <div className="level-options" role="group" aria-label="Select your seniority level">
              {levelOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`level-option ${level === opt.value ? 'selected' : ''}`}
                  onClick={() => setLevel(opt.value)}
                  aria-pressed={level === opt.value}
                  aria-label={`Select level: ${opt.label}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 03 — Focus */}
          <AnimatePresence>
            {selectedRole && (
              <motion.div
                className="assess-step"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="assess-step-header">
                  <span className="assess-step-num">03</span>
                  <span className="assess-step-title">Focus Competencies</span>
                </div>
                <div className="competency-pills" role="group" aria-label="Select competencies to focus on">
                  {selectedRole.competencies.map((comp) => (
                    <button
                      key={comp.id}
                      className={`competency-pill ${focusIds.includes(comp.id) ? 'selected' : ''}`}
                      onClick={() => toggleFocus(comp.id)}
                      aria-pressed={focusIds.includes(comp.id)}
                      aria-label={`Toggle focus: ${comp.name}`}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>
                {focusIds.length === 0 && (
                  <div
                    style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--c-mid)',
                      marginTop: 'var(--space-3)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    All competencies selected by default
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 04 — Duration */}
          <div className="assess-step">
            <div className="assess-step-header">
              <span className="assess-step-num">04</span>
              <span className="assess-step-title">Assessment Depth</span>
            </div>
            <div className="duration-options" role="group" aria-label="Select assessment depth">
              {durationOptions.map((opt) => (
                <button
                  key={opt.value}
                  className={`duration-option ${duration === opt.value ? 'selected' : ''}`}
                  onClick={() => setDuration(opt.value)}
                  aria-pressed={duration === opt.value}
                  aria-label={`Select depth: ${opt.label}, ${opt.detail}`}
                >
                  <div className="duration-option-label">{opt.label}</div>
                  <div className="duration-option-detail">{opt.detail}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Competency preview */}
          <AnimatePresence>
            {selectedRole && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  borderTop: '1px solid var(--c-rule)',
                  paddingTop: 'var(--space-8)',
                  marginTop: 'var(--space-4)',
                }}
              >
                <div className="sys-label" style={{ marginBottom: 'var(--space-4)' }}>
                  Competency Model Preview
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {selectedRole.competencies.map((comp) => {
                    const req = selectedRole.requirements.find((r) => r.competencyId === comp.id);
                    return (
                      <div
                        key={comp.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-4)',
                          opacity: focusIds.length === 0 || focusIds.includes(comp.id) ? 1 : 0.35,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--f-mono)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 500,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--c-ink)',
                            minWidth: '120px',
                          }}
                        >
                          {comp.name}
                        </div>
                        <div style={{ flex: 1, height: '2px', background: 'var(--c-rule)', position: 'relative' }}>
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              height: '100%',
                              width: `${req?.targetLevel ?? 70}%`,
                              background: 'var(--c-accent)',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--f-mono)',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--c-mid)',
                            minWidth: '32px',
                            textAlign: 'right',
                          }}
                        >
                          {req?.targetLevel ?? 70}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--f-mono)',
                            fontSize: '10px',
                            color: req?.importance === 'critical'
                              ? 'var(--c-danger)'
                              : req?.importance === 'high'
                              ? 'var(--c-warning)'
                              : 'var(--c-mid-2)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            minWidth: '60px',
                            textAlign: 'right',
                          }}
                        >
                          {req?.importance ?? 'medium'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
