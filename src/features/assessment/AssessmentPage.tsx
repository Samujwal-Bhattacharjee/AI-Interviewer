/**
 * AssessmentPage.tsx — The adaptive assessment entry flow.
 *
 * Sectors → Role → Resume (optional) → Level → Focus → Depth → Begin
 */
import { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateSession } from '../../hooks/useAssessment';
import type { AssessmentDuration } from '../../types/assessment';
import type { RoleLevel } from '../../types/roles';
import type { ScanState } from '../../types/setup';
import { useInterviewStore } from '../../store/interviewStore';
import { SECTORS, COMPETENCY_NAMES } from '../../mock/sectors';
import { matchResumeFile } from '../../mock/resumeProfiles';
import type { ResumeProfile, SectorRole } from '../../types/setup';

// ── Static options ─────────────────────────────────────────────────────────────

const LEVEL_OPTIONS: { value: RoleLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'Foundational' },
  { value: 'junior', label: 'Junior', desc: 'Entry-level professional' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Independent practitioner' },
  { value: 'senior', label: 'Senior', desc: 'Advanced practitioner' },
];

const DURATION_OPTIONS: { value: AssessmentDuration; label: string; detail: string; count: number }[] = [
  { value: 'quick', label: 'Quick', detail: '~5 adaptive questions', count: 5 },
  { value: 'standard', label: 'Standard', detail: '~10 adaptive questions', count: 10 },
  { value: 'deep', label: 'Deep', detail: '~15 adaptive questions', count: 15 },
];

const SCAN_LABELS: Record<ScanState, string> = {
  idle: '',
  uploading: 'UPLOADING',
  scanning: 'SCANNING PROFILE',
  extracting: 'EXTRACTING SKILLS',
  matching: 'MATCHING CANDIDATE',
  ready: 'PROFILE MATCHED',
  error: 'NO MATCH FOUND',
};

// ── Helper ─────────────────────────────────────────────────────────────────────

function ScanProgress({ state }: { state: ScanState }) {
  const pct =
    state === 'uploading' ? 20
    : state === 'scanning' ? 45
    : state === 'extracting' ? 68
    : state === 'matching' ? 85
    : state === 'ready' ? 100
    : 0;

  return (
    <div style={{ marginTop: 'var(--space-3)' }}>
      <div
        style={{
          fontFamily: 'var(--f-mono)',
          fontSize: '10px',
          letterSpacing: '0.14em',
          color: state === 'error' ? 'var(--c-danger)' : state === 'ready' ? 'var(--c-success)' : 'var(--c-accent)',
          marginBottom: '6px',
        }}
      >
        {SCAN_LABELS[state]}
      </div>
      {state !== 'idle' && state !== 'error' && (
        <div style={{ height: '2px', background: 'var(--c-rule)', position: 'relative', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              background: state === 'ready' ? 'var(--c-success)' : 'var(--c-accent)',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AssessmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const createSession = useCreateSession();
  const setSession = useInterviewStore((s) => s.setSession);
  const reset = useInterviewStore((s) => s.reset);

  // Reassessment entry from ReportPage
  const locationState = location.state as { focusCompetencies?: string[]; isReassessment?: boolean } | null;
  const initialFocusIds = locationState?.focusCompetencies ?? [];
  const isReassessment = locationState?.isReassessment ?? false;

  // ── Step state ───────────────────────────────────────────────────────────────
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [level, setLevel] = useState<RoleLevel>('junior');
  const [duration, setDuration] = useState<AssessmentDuration>('standard');
  const [focusIds, setFocusIds] = useState<string[]>(initialFocusIds);

  // ── Resume state ─────────────────────────────────────────────────────────────
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const selectedSector = SECTORS.find((s) => s.id === selectedSectorId) ?? null;
  const selectedRole = selectedSector?.roles.find((r) => r.id === selectedRoleId) ?? null;

  // Focus IDs: if none explicitly chosen, use resume suggestions or all role competencies
  const effectiveFocus =
    focusIds.length > 0
      ? focusIds
      : resumeProfile?.suggestedFocus.filter((id) => selectedRole?.competencyIds.includes(id)) ?? [];

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function selectSector(sectorId: string) {
    setSelectedSectorId(sectorId);
    setSelectedRoleId(null);
    setFocusIds([]);
  }

  function selectRole(role: SectorRole) {
    setSelectedRoleId(role.id);
    setFocusIds([]);
  }

  function toggleFocus(compId: string) {
    setFocusIds((prev) =>
      prev.includes(compId) ? prev.filter((id) => id !== compId) : [...prev, compId]
    );
  }

  const runFakeScan = useCallback(async (fileName: string) => {
    setScanState('uploading');
    await new Promise((r) => setTimeout(r, 300));
    setScanState('scanning');
    await new Promise((r) => setTimeout(r, 400));
    setScanState('extracting');
    await new Promise((r) => setTimeout(r, 350));
    setScanState('matching');
    await new Promise((r) => setTimeout(r, 350));

    const profile = matchResumeFile(fileName);
    if (profile) {
      setScanState('ready');
      setResumeProfile(profile);
      // Pre-fill focus from resume suggestion filtered to current role
    } else {
      setScanState('error');
    }
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setResumeProfile(null);
    runFakeScan(file.name);
  }

  function handleDropZone(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setResumeProfile(null);
    runFakeScan(file.name);
  }

  function clearResume() {
    setResumeProfile(null);
    setUploadedFileName(null);
    setScanState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleBegin() {
    if (!selectedRoleId) return;
    reset();

    // Map our setup role ID to the backend role IDs (from seeded DB)
    // For MVP: use role-001 for any SW engineer equivalent, otherwise fallback to first available role
    const backendRoleId = selectedRoleId === 'role-sw-engineer' || selectedRoleId === 'role-ml-engineer'
      ? 'role-001'
      : selectedRoleId === 'role-data-engineer' || selectedRoleId === 'role-financial-analyst'
      ? 'role-002'
      : selectedRoleId === 'role-product-designer' || selectedRoleId === 'role-ux-designer'
      ? 'role-003'
      : selectedRoleId === 'role-product-manager' || selectedRoleId === 'role-health-informatics'
      ? 'role-004'
      : 'role-001';

    const focusForSession =
      effectiveFocus.length > 0 ? effectiveFocus : (selectedRole?.competencyIds ?? []);

    const session = await createSession.mutateAsync({
      targetRoleId: backendRoleId,
      level,
      focusCompetencies: focusForSession,
      duration,
    });

    const count = DURATION_OPTIONS.find((d) => d.value === duration)?.count ?? 10;
    setSession(session.id, backendRoleId, count);
    navigate('/interview');
  }

  const canBegin = !!selectedRoleId && !createSession.isPending;
  const durationCount = DURATION_OPTIONS.find((d) => d.value === duration)?.count ?? 10;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <main className="page-shell" style={{ background: 'var(--c-paper)' }}>
      <div className="assess-layout">

        {/* ── LEFT SIDEBAR — Live Assessment Blueprint ── */}
        <aside className="assess-sidebar" aria-label="Assessment blueprint">
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <div className="sys-label" style={{ color: 'var(--c-accent)', marginBottom: 'var(--space-1)' }}>
              Assessment / {isReassessment ? 'Reassessment' : 'Configure'}
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--c-ink)', lineHeight: 1.2 }}>
              {isReassessment ? 'Targeted Reassessment' : 'New Assessment'}
            </div>
          </div>

          <hr className="rule" style={{ marginBottom: 'var(--space-6)' }} />

          {/* TARGET */}
          <BlueprintBlock label="TARGET">
            <AnimatePresence mode="wait">
              {selectedRole ? (
                <motion.div key={selectedRole.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--c-ink)', letterSpacing: '0.02em' }}>
                    {selectedRole.title.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', marginTop: '3px', letterSpacing: '0.08em' }}>
                    {selectedSector?.label.toUpperCase()}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-sm)', color: 'var(--c-mid-2)' }}>—</motion.div>
              )}
            </AnimatePresence>
          </BlueprintBlock>

          {/* PROFILE */}
          <BlueprintBlock label="PROFILE">
            <AnimatePresence mode="wait">
              {resumeProfile && scanState === 'ready' ? (
                <motion.div key="profile" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--c-ink)' }}>
                    {resumeProfile.candidateName.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-success)', marginTop: '3px', letterSpacing: '0.08em' }}>
                    ● RESUME MATCHED
                  </div>
                </motion.div>
              ) : (
                <motion.div key="no-profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', letterSpacing: '0.08em' }}>
                  {scanState === 'idle' ? 'No resume' : scanState === 'error' ? '▲ Not matched' : '⟳ Scanning...'}
                </motion.div>
              )}
            </AnimatePresence>
          </BlueprintBlock>

          {/* LEVEL */}
          <BlueprintBlock label="LEVEL">
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-sm)', color: 'var(--c-ink)', textTransform: 'capitalize' }}>
              {level}
            </div>
          </BlueprintBlock>

          {/* FOCUS */}
          <BlueprintBlock label="FOCUS">
            {effectiveFocus.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {effectiveFocus.slice(0, 4).map((id) => (
                  <motion.div key={id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                    style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--c-accent)', textTransform: 'uppercase' }}>
                    {COMPETENCY_NAMES[id] ?? id}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid-2)' }}>
                {selectedRole ? 'All competencies' : '—'}
              </div>
            )}
          </BlueprintBlock>

          {/* INTERVIEW */}
          <BlueprintBlock label="INTERVIEW">
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-sm)', color: 'var(--c-ink)' }}>
              ~{durationCount} adaptive questions
            </div>
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', marginTop: '2px', letterSpacing: '0.08em' }}>
              {resumeProfile ? 'ROLE + PROFILE + PROJECTS' : 'ROLE-BASED'}
            </div>
          </BlueprintBlock>

          {/* VOICE */}
          <BlueprintBlock label="VOICE">
            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', letterSpacing: '0.08em' }}>
              Live spoken interview
            </div>
          </BlueprintBlock>

          {/* Target requirements visualization */}
          <AnimatePresence>
            {selectedRole && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--c-rule)', paddingTop: 'var(--space-5)' }}
              >
                <div className="sys-label" style={{ marginBottom: 'var(--space-4)', color: 'var(--c-mid)' }}>TARGET REQUIREMENTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {selectedRole.competencyIds.map((compId) => {
                    const lvl = selectedRole.targetLevels[compId] ?? 70;
                    const isFocused = effectiveFocus.length === 0 || effectiveFocus.includes(compId);
                    return (
                      <div key={compId} style={{ opacity: isFocused ? 1 : 0.3, transition: 'opacity 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-ink)' }}>
                            {COMPETENCY_NAMES[compId] ?? compId}
                          </span>
                          <span style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: 'var(--c-mid)' }}>{lvl}</span>
                        </div>
                        <div style={{ height: '2px', background: 'var(--c-rule)', position: 'relative' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${lvl}%` }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'var(--c-accent)' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-8)' }}>
            <motion.button
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', width: '100%' }}
              onClick={handleBegin}
              disabled={!canBegin}
              aria-label="Begin the adaptive interview"
              whileHover={canBegin ? { scale: 1.01 } : {}}
              whileTap={canBegin ? { scale: 0.98 } : {}}
            >
              {createSession.isPending ? 'Preparing...' : 'Begin Adaptive Interview →'}
            </motion.button>
            {!selectedRoleId && (
              <p style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', marginTop: 'var(--space-3)', textAlign: 'center', letterSpacing: '0.06em' }}>
                Select a sector and role to continue
              </p>
            )}
          </div>
        </aside>

        {/* ── RIGHT MAIN — Steps ── */}
        <div className="assess-main">

          {/* ── 01 / SECTOR ── */}
          <div className="assess-step">
            <div className="assess-step-header">
              <span className="assess-step-num">01</span>
              <span className="assess-step-title">Sector</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 'var(--space-3)',
              }}
            >
              {SECTORS.map((sector) => (
                <motion.button
                  key={sector.id}
                  className={`role-card ${selectedSectorId === sector.id ? 'selected' : ''}`}
                  onClick={() => selectSector(sector.id)}
                  aria-pressed={selectedSectorId === sector.id}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.12 }}
                  style={{ textAlign: 'left' }}
                >
                  <div className="role-card-title">{sector.label}</div>
                  <div className="role-card-meta">{sector.roles.length} roles</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* ── 02 / TARGET ROLE ── */}
          <AnimatePresence>
            {selectedSector && (
              <motion.div
                className="assess-step"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3 }}
              >
                <div className="assess-step-header">
                  <span className="assess-step-num">02</span>
                  <span className="assess-step-title">Target Role</span>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', letterSpacing: '0.1em', marginLeft: 'var(--space-3)' }}>
                    {selectedSector.label.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                  {selectedSector.roles.map((role) => (
                    <motion.button
                      key={role.id}
                      className={`role-card ${selectedRoleId === role.id ? 'selected' : ''}`}
                      onClick={() => selectRole(role)}
                      aria-pressed={selectedRoleId === role.id}
                      whileHover={{ y: -1 }}
                      transition={{ duration: 0.12 }}
                      style={{ textAlign: 'left' }}
                    >
                      <div className="role-card-title">{role.title}</div>
                      <div className="role-card-meta">{role.technologies.slice(0, 3).join(' · ')}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 03 / RESUME ── */}
          <AnimatePresence>
            {selectedRole && (
              <motion.div
                className="assess-step"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="assess-step-header">
                  <span className="assess-step-num">03</span>
                  <span className="assess-step-title">Resume Profile</span>
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', marginLeft: 'var(--space-3)' }}>Optional</span>
                </div>

                {scanState === 'idle' ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropZone}
                    style={{
                      border: '1px solid var(--c-rule)',
                      padding: 'var(--space-8) var(--space-6)',
                      position: 'relative',
                      background: 'var(--c-surface)',
                      cursor: 'pointer',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    aria-label="Upload resume"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', letterSpacing: '0.14em', color: 'var(--c-mid)', marginBottom: 'var(--space-4)' }}>
                      RESUME / PROFILE
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-md)', color: 'var(--c-ink)', marginBottom: 'var(--space-3)' }}>
                      Drop profile here
                    </div>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid-2)', letterSpacing: '0.1em', marginBottom: 'var(--space-5)' }}>
                      PDF / DOC / DOCX
                    </div>
                    <button
                      className="btn btn-secondary"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      style={{ fontSize: 'var(--text-xs)' }}
                    >
                      Select File
                    </button>

                    <div
                      style={{
                        marginTop: 'var(--space-8)',
                        paddingTop: 'var(--space-5)',
                        borderTop: '1px solid var(--c-rule)',
                      }}
                    >
                      <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', letterSpacing: '0.1em', marginBottom: 'var(--space-3)' }}>
                        No resume?
                      </div>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 'var(--text-xs)' }}
                        onClick={(e) => { e.stopPropagation(); /* Continue without resume — already works by default */ }}
                      >
                        Continue without resume →
                      </button>
                      <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid-2)', marginTop: 'var(--space-2)', letterSpacing: '0.06em' }}>
                        Role-only assessment will be used
                      </div>
                    </div>
                  </div>
                ) : scanState === 'ready' && resumeProfile ? (
                  // ── Profile matched state ──
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <div
                      style={{
                        border: '1px solid var(--c-rule)',
                        borderLeft: '3px solid var(--c-success)',
                        background: 'var(--c-surface)',
                        padding: 'var(--space-6)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', letterSpacing: '0.14em', color: 'var(--c-success)', marginBottom: '4px' }}>
                            PROFILE MATCHED
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--c-ink)', letterSpacing: '-0.01em' }}>
                            {resumeProfile.candidateName}
                          </div>
                          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-xs)', color: 'var(--c-mid)', marginTop: '2px' }}>
                            {resumeProfile.profileTitle}
                          </div>
                        </div>
                        <button
                          onClick={clearResume}
                          style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.08em' }}
                        >
                          ✕ CLEAR
                        </button>
                      </div>

                      <div style={{ borderTop: '1px solid var(--c-rule)', paddingTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                        <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--c-mid)', marginBottom: 'var(--space-2)' }}>
                          SKILLS IDENTIFIED
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                          {resumeProfile.skills.slice(0, 8).map((skill) => (
                            <span
                              key={skill}
                              style={{
                                fontFamily: 'var(--f-mono)',
                                fontSize: '9px',
                                letterSpacing: '0.1em',
                                padding: '2px 6px',
                                border: '1px solid var(--c-rule)',
                                color: 'var(--c-ink)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--c-rule)', paddingTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                        <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--c-mid)', marginBottom: 'var(--space-2)' }}>
                          PROJECTS
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {resumeProfile.projects.map((proj) => (
                            <div key={proj} style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-ink)', letterSpacing: '0.06em' }}>
                              → {proj}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--c-rule)', paddingTop: 'var(--space-4)' }}>
                        <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--c-mid)', marginBottom: 'var(--space-2)' }}>
                          INTERVIEW MODE
                        </div>
                        <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-xs)', color: 'var(--c-accent)', fontWeight: 600, letterSpacing: '0.08em' }}>
                          ROLE + RESUME SKILLS + PROJECTS
                        </div>
                        <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', marginTop: '3px', letterSpacing: '0.06em' }}>
                          Question Set: {resumeProfile.questionSetId}
                        </div>
                      </div>
                    </div>

                    <ScanProgress state="ready" />
                  </motion.div>
                ) : scanState === 'error' ? (
                  // ── No match ──
                  <div style={{ border: '1px solid var(--c-rule)', borderLeft: '3px solid var(--c-warning)', background: 'var(--c-surface)', padding: 'var(--space-6)' }}>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-warning)', letterSpacing: '0.14em', marginBottom: 'var(--space-3)' }}>
                      NO PROFILE MATCHED
                    </div>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-xs)', color: 'var(--c-ink)', marginBottom: 'var(--space-3)' }}>
                      {uploadedFileName}
                    </div>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
                      No matching candidate profile found for this file.
                      The interview will proceed with role-only questions.
                    </div>
                    <button className="btn btn-secondary" onClick={clearResume} style={{ fontSize: 'var(--text-xs)' }}>
                      Try different file
                    </button>
                  </div>
                ) : (
                  // ── Scanning state ──
                  <div style={{ border: '1px solid var(--c-rule)', background: 'var(--c-surface)', padding: 'var(--space-6)' }}>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', letterSpacing: '0.1em', marginBottom: 'var(--space-3)' }}>
                      FILE RECEIVED
                    </div>
                    <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-xs)', color: 'var(--c-ink)', marginBottom: 'var(--space-4)' }}>
                      {uploadedFileName}
                    </div>
                    <ScanProgress state={scanState} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 04 / SENIORITY ── */}
          <AnimatePresence>
            {selectedRole && (
              <motion.div
                className="assess-step"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <div className="assess-step-header">
                  <span className="assess-step-num">04</span>
                  <span className="assess-step-title">Seniority Level</span>
                </div>
                <div className="level-options" role="group" aria-label="Select your seniority level">
                  {LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`level-option ${level === opt.value ? 'selected' : ''}`}
                      onClick={() => setLevel(opt.value)}
                      aria-pressed={level === opt.value}
                      aria-label={`Select level: ${opt.label}`}
                    >
                      <div>{opt.label}</div>
                      <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: level === opt.value ? 'var(--c-accent)' : 'var(--c-mid)', marginTop: '2px', letterSpacing: '0.06em' }}>
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 05 / FOCUS COMPETENCIES ── */}
          <AnimatePresence>
            {selectedRole && (
              <motion.div
                className="assess-step"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="assess-step-header">
                  <span className="assess-step-num">05</span>
                  <span className="assess-step-title">Focus Competencies</span>
                </div>
                <div className="competency-pills" role="group" aria-label="Select competencies to focus on">
                  {selectedRole.competencyIds.map((compId) => (
                    <button
                      key={compId}
                      className={`competency-pill ${focusIds.includes(compId) ? 'selected' : ''}`}
                      onClick={() => toggleFocus(compId)}
                      aria-pressed={focusIds.includes(compId)}
                      aria-label={`Toggle focus: ${COMPETENCY_NAMES[compId] ?? compId}`}
                    >
                      {COMPETENCY_NAMES[compId] ?? compId}
                    </button>
                  ))}
                </div>

                {resumeProfile && resumeProfile.suggestedFocus.length > 0 && focusIds.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ marginTop: 'var(--space-3)', fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-accent)', letterSpacing: '0.08em' }}
                  >
                    ↑ Resume-suggested focus applied
                  </motion.div>
                )}

                {focusIds.length === 0 && !resumeProfile && (
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', marginTop: 'var(--space-3)', letterSpacing: '0.08em' }}>
                    All competencies included by default
                  </div>
                )}

                {/* Target requirements preview */}
                <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--c-rule)', paddingTop: 'var(--space-5)' }}>
                  <div className="sys-label" style={{ marginBottom: 'var(--space-4)' }}>Competency Model — {selectedRole.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {selectedRole.competencyIds.map((compId) => {
                      const lvl = selectedRole.targetLevels[compId] ?? 70;
                      const isFocused = focusIds.length === 0 || focusIds.includes(compId);
                      return (
                        <div key={compId} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', opacity: isFocused ? 1 : 0.3, transition: 'opacity 0.2s' }}>
                          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-xs)', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-ink)', minWidth: '140px' }}>
                            {COMPETENCY_NAMES[compId] ?? compId}
                          </div>
                          <div style={{ flex: 1, height: '2px', background: 'var(--c-rule)', position: 'relative' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${lvl}%` }}
                              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                              style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'var(--c-accent)' }}
                            />
                          </div>
                          <div style={{ fontFamily: 'var(--f-mono)', fontSize: 'var(--text-xs)', color: 'var(--c-mid)', minWidth: '28px', textAlign: 'right' }}>
                            {lvl}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 06 / ASSESSMENT DEPTH ── */}
          <AnimatePresence>
            {selectedRole && (
              <motion.div
                className="assess-step"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                <div className="assess-step-header">
                  <span className="assess-step-num">06</span>
                  <span className="assess-step-title">Assessment Depth</span>
                </div>
                <div className="duration-options" role="group" aria-label="Select assessment depth">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`duration-option ${duration === opt.value ? 'selected' : ''}`}
                      onClick={() => setDuration(opt.value)}
                      aria-pressed={duration === opt.value}
                      aria-label={`Select depth: ${opt.label}`}
                    >
                      <div className="duration-option-label">{opt.label}</div>
                      <div className="duration-option-detail">{opt.detail}</div>
                      <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: duration === opt.value ? 'var(--c-accent)' : 'var(--c-mid-2)', marginTop: '3px', letterSpacing: '0.08em' }}>
                        Voice interview
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── BEGIN BUTTON (bottom of main) ── */}
          <AnimatePresence>
            {selectedRole && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, delay: 0.2 }}
                style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-12)' }}
              >
                <div style={{ borderTop: '1px solid var(--c-rule)', paddingTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <motion.button
                    className="btn btn-primary"
                    onClick={handleBegin}
                    disabled={!canBegin}
                    style={{ minWidth: '280px' }}
                    whileHover={canBegin ? { scale: 1.01 } : {}}
                    whileTap={canBegin ? { scale: 0.98 } : {}}
                  >
                    {createSession.isPending ? 'Preparing session...' : 'Begin Adaptive Interview →'}
                  </motion.button>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: 'var(--c-mid)', lineHeight: 1.7, letterSpacing: '0.06em' }}>
                    <div>{selectedRole.title.toUpperCase()} · {level.toUpperCase()}</div>
                    <div>{durationCount} adaptive questions · Voice interview</div>
                    {resumeProfile && <div style={{ color: 'var(--c-success)' }}>Profile: {resumeProfile.candidateName}</div>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </main>
  );
}

// ── Blueprint block helper ─────────────────────────────────────────────────────

function BlueprintBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="assess-summary-block" style={{ paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--c-rule)' }}>
      <div className="assess-summary-key" style={{ marginBottom: 'var(--space-2)' }}>{label}</div>
      <div className="assess-summary-value">{children}</div>
    </div>
  );
}
