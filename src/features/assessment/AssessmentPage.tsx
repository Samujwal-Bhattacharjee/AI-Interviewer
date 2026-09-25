import { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateSession, useTargetRoles } from '../../hooks/useAssessment';
import type { AssessmentDuration } from '../../types/assessment';
import type { RoleLevel } from '../../types/roles';
import type { ScanState, ResumeProfile } from '../../types/setup';
import { useInterviewStore } from '../../store/interviewStore';
import { SECTORS, COMPETENCY_NAMES } from '../../mock/sectors';
import { matchResumeFile } from '../../mock/resumeProfiles';
import { SystemFooter } from '../../components/layout/SystemFooter';

// ── Sector codes ─────────────────────────────────────────────────────────────
const SECTOR_CODES: Record<string, string> = {
  technology: 'SYS_TECH',
  finance: 'SYS_FIN',
  healthcare: 'SYS_HLTH',
  marketing: 'SYS_MKTG',
  design: 'SYS_DES',
};

const SECTOR_SHORT_TITLES: Record<string, string> = {
  technology: 'TECHNOLOGY',
  finance: 'FINANCE',
  healthcare: 'HEALTHCARE',
  marketing: 'MARKETING & SALES',
  design: 'DESIGN & PRODUCT',
};

// ── Static options ───────────────────────────────────────────────────────────
const LEVEL_OPTIONS: { value: RoleLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: 'BEGINNER', desc: 'FOUNDATIONAL' },
  { value: 'junior', label: 'JUNIOR', desc: 'ENTRY-LEVEL PROFESSIONAL' },
  { value: 'intermediate', label: 'INTERMEDIATE', desc: 'INDEPENDENT PRACTITIONER' },
  { value: 'senior', label: 'SENIOR', desc: 'ADVANCED PRACTITIONER' },
];

const DURATION_OPTIONS: {
  value: AssessmentDuration;
  label: string;
  countLabel: string;
  detail: string;
  fidelity: string;
  count: number;
}[] = [
  {
    value: 'quick',
    label: 'QUICK',
    countLabel: '~5 adaptive questions',
    detail: 'Voice interview (~10 min)',
    fidelity: 'RAPID TRIAGE',
    count: 5,
  },
  {
    value: 'standard',
    label: 'STANDARD',
    countLabel: '~10 adaptive questions',
    detail: 'Voice interview (~20 min)',
    fidelity: 'RECOMMENDED FIDELITY',
    count: 10,
  },
  {
    value: 'deep',
    label: 'DEEP',
    countLabel: '~18 adaptive questions',
    detail: 'Voice interview (~35 min)',
    fidelity: 'HIGH PRECISION IRT',
    count: 18,
  },
];

export function AssessmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const createSession = useCreateSession();
  const setSession = useInterviewStore((s) => s.setSession);
  const reset = useInterviewStore((s) => s.reset);

  // Backend real roles
  const { data: backendRoles } = useTargetRoles();

  // Reassessment check
  const locationState = location.state as { focusCompetencies?: string[]; isReassessment?: boolean } | null;
  const initialFocusIds = locationState?.focusCompetencies ?? [];

  // Default selections matching Screenshot 2
  const [selectedSectorId, setSelectedSectorId] = useState<string>('technology');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('role-sw-engineer');
  const [level, setLevel] = useState<RoleLevel>('junior');
  const [duration, setDuration] = useState<AssessmentDuration>('standard');
  const [focusIds, setFocusIds] = useState<string[]>(initialFocusIds);
  const [isRequirementsOpen, setIsRequirementsOpen] = useState<boolean>(true);

  // Resume state
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active sector and role
  const selectedSector = SECTORS.find((s) => s.id === selectedSectorId) ?? SECTORS[0];
  const selectedRole = selectedSector.roles.find((r) => r.id === selectedRoleId) ?? selectedSector.roles[0];

  // Competency targets (from role or default calibrated)
  const defaultTargets: Record<string, number> = {
    'comp-dsa': 72,
    'comp-python': 78,
    'comp-debugging': 76,
    'comp-sql': 65,
    'comp-system-design': 68,
  };

  const currentTargets = selectedRole.targetLevels ?? defaultTargets;
  const activeCompetencies = selectedRole.competencyIds ?? [
    'comp-dsa',
    'comp-python',
    'comp-debugging',
    'comp-sql',
    'comp-system-design',
  ];

  // Resume scanning handler
  const runFakeScan = useCallback(async (fileName: string) => {
    setScanState('uploading');
    await new Promise((r) => setTimeout(r, 250));
    setScanState('scanning');
    await new Promise((r) => setTimeout(r, 300));
    setScanState('extracting');
    await new Promise((r) => setTimeout(r, 250));
    setScanState('matching');
    await new Promise((r) => setTimeout(r, 250));

    const profile = matchResumeFile(fileName);
    if (profile) {
      setScanState('ready');
      setResumeProfile(profile);
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

  function toggleFocus(id: string) {
    if (focusIds.includes(id)) {
      setFocusIds(focusIds.filter((f) => f !== id));
    } else {
      setFocusIds([...focusIds, id]);
    }
  }

  // Launch interview with working backend
  async function handleBegin() {
    reset();

    // Map selected role to backend role ID
    const backendRoleId =
      backendRoles?.find((r) => r.id === selectedRole.id)?.id ??
      (selectedRoleId.includes('data')
        ? 'role-002'
        : selectedRoleId.includes('ml')
        ? 'role-001'
        : 'role-001');

    try {
      const session = await createSession.mutateAsync({
        targetRoleId: backendRoleId,
        level,
        focusCompetencies: focusIds.length > 0 ? focusIds : activeCompetencies,
        duration,
      });

      const count = DURATION_OPTIONS.find((d) => d.value === duration)?.count ?? 10;
      setSession(session.id, backendRoleId, count);
      navigate('/interview');
    } catch {
      // Fallback: local session in case backend network hiccups
      const fallbackSessionId = `sess-${Date.now()}`;
      setSession(fallbackSessionId, backendRoleId, 10);
      navigate('/interview');
    }
  }

  const durationObj = DURATION_OPTIONS.find((d) => d.value === duration) ?? DURATION_OPTIONS[1];

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── MAIN 2-COLUMN LAYOUT ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          minHeight: 'calc(100vh - 52px - 56px)',
          borderBottom: '1px solid #000000',
        }}
      >
        {/* ── LEFT SIDEBAR — ASSESSMENT CONFIGURATION ── */}
        <aside
          style={{
            borderRight: '1px solid #000000',
            padding: '32px 24px',
            background: '#FFFFFF',
            position: 'sticky',
            top: '52px',
            height: 'calc(100vh - 52px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: 'var(--f-mono)',
          }}
        >
          <div>
            {/* Breadcrumb */}
            <div style={{ color: '#0047FF', fontSize: '10px', letterSpacing: '0.14em', fontWeight: 600, marginBottom: '6px' }}>
              ASSESSMENT / CONFIGURE
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: 'var(--f-sans)',
                fontSize: '38px',
                fontWeight: 900,
                lineHeight: 0.94,
                letterSpacing: '-0.03em',
                color: '#000000',
                margin: '0 0 10px 0',
                textTransform: 'uppercase',
              }}
            >
              NEW<br />ASSESSMENT
            </h1>

            <div style={{ fontSize: '9px', color: '#666666', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '20px' }}>
              CALIBRATION PROTOCOL V3.8
            </div>

            <div style={{ height: '1px', background: '#000000', marginBottom: '24px' }} />

            {/* Spec items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* TARGET */}
              <div>
                <div style={{ fontSize: '8px', color: '#777777', letterSpacing: '0.14em' }}>TARGET</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#000000', marginTop: '2px', letterSpacing: '0.04em' }}>
                  {selectedRole.title.toUpperCase()}
                </div>
                <div style={{ fontSize: '9px', color: '#666666', letterSpacing: '0.08em' }}>
                  {selectedSector.label.toUpperCase()}
                </div>
              </div>

              {/* PROFILE */}
              <div>
                <div style={{ fontSize: '8px', color: '#777777', letterSpacing: '0.14em' }}>PROFILE</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#000000', marginTop: '2px', letterSpacing: '0.04em' }}>
                  {resumeProfile ? resumeProfile.candidateName.toUpperCase() : 'NO RESUME'}
                </div>
              </div>

              {/* LEVEL */}
              <div>
                <div style={{ fontSize: '8px', color: '#777777', letterSpacing: '0.14em' }}>LEVEL</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#000000', marginTop: '2px', letterSpacing: '0.04em' }}>
                  {level.toUpperCase()}
                </div>
                <div style={{ fontSize: '9px', color: '#666666', letterSpacing: '0.08em' }}>
                  {LEVEL_OPTIONS.find((l) => l.value === level)?.desc}
                </div>
              </div>

              {/* FOCUS */}
              <div>
                <div style={{ fontSize: '8px', color: '#777777', letterSpacing: '0.14em' }}>FOCUS</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#000000', marginTop: '2px', letterSpacing: '0.04em' }}>
                  {focusIds.length > 0 ? `${focusIds.length} SELECTED` : 'ALL COMPETENCIES'}
                </div>
                <div style={{ fontSize: '9px', color: '#666666', letterSpacing: '0.08em' }}>
                  ({activeCompetencies.length} TRACKED)
                </div>
              </div>

              {/* INTERVIEW */}
              <div>
                <div style={{ fontSize: '8px', color: '#777777', letterSpacing: '0.14em' }}>INTERVIEW</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#000000', marginTop: '2px', letterSpacing: '0.04em' }}>
                  {durationObj.countLabel.toUpperCase()}
                </div>
                <div style={{ fontSize: '9px', color: '#666666', letterSpacing: '0.08em' }}>
                  ROLE-BASED • IRT ENGINE
                </div>
              </div>

              {/* VOICE */}
              <div>
                <div style={{ fontSize: '8px', color: '#777777', letterSpacing: '0.14em' }}>VOICE</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#000000', marginTop: '2px', letterSpacing: '0.04em' }}>
                  LIVE SPOKEN INTERVIEW
                </div>
                <div style={{ fontSize: '9px', color: '#666666', letterSpacing: '0.08em' }}>
                  24KHZ PCM BI-DIRECTIONAL
                </div>
              </div>
            </div>

            {/* Collapsible Target Requirements */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
              <div
                onClick={() => setIsRequirementsOpen(!isRequirementsOpen)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#000000',
                  marginBottom: '10px',
                }}
              >
                <span>TARGET REQUIREMENTS</span>
                <span style={{ color: '#0047FF' }}>{isRequirementsOpen ? '▾' : '▸'}</span>
              </div>

              {isRequirementsOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555555' }}>
                    <span>ALGORITHMS & DS BASELINE</span>
                    <span style={{ fontWeight: 700, color: '#000000' }}>72 / 100</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555555' }}>
                    <span>PYTHON SYSTEMS BASELINE</span>
                    <span style={{ fontWeight: 700, color: '#000000' }}>78 / 100</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Engine Note */}
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', marginTop: '20px' }}>
            <div style={{ fontSize: '8px', color: '#888888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ADAPTIVE PSYCHOMETRIC TEST ENGINE
            </div>
            <div style={{ fontSize: '8px', color: '#888888', letterSpacing: '0.08em', marginTop: '2px' }}>
              CALIBRATION: IRT 3-PARAMETER LOGISTIC
            </div>
          </div>
        </aside>

        {/* ── RIGHT MAIN CONFIGURATION FORM ── */}
        <main style={{ padding: '36px 48px', overflowY: 'auto', paddingBottom: '100px' }}>
          {/* ── 01 SECTOR ── */}
          <section style={{ marginBottom: '36px' }}>
            <div
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#000000',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
              }}
            >
              <span style={{ color: '#0047FF' }}>01</span>
              <span>SECTOR</span>
              <span style={{ color: '#666666', fontWeight: 400 }}>— SELECT PRIMARY DOMAIN DISCIPLINE</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              {SECTORS.map((sector) => {
                const isSelected = sector.id === selectedSectorId;
                const code = SECTOR_CODES[sector.id] ?? 'SYS_DISC';

                return (
                  <button
                    key={sector.id}
                    onClick={() => {
                      setSelectedSectorId(sector.id);
                      setSelectedRoleId(sector.roles[0]?.id ?? '');
                    }}
                    style={{
                      border: isSelected ? '2px solid #000000' : '1px solid #000000',
                      background: '#FFFFFF',
                      padding: '16px 14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '110px',
                      transition: 'all 0.15s ease',
                      borderRadius: 0,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--f-sans)',
                          fontSize: '13px',
                          fontWeight: 900,
                          letterSpacing: '0.02em',
                          color: '#000000',
                          lineHeight: 1.15,
                        }}
                      >
                        {SECTOR_SHORT_TITLES[sector.id] ?? sector.label.toUpperCase()}
                      </div>
                      <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: '#666666', marginTop: '4px' }}>
                        3 roles
                      </div>
                    </div>

                    <div
                      style={{
                        fontFamily: 'var(--f-mono)',
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        color: isSelected ? '#0047FF' : '#777777',
                      }}
                    >
                      {isSelected ? `[SELECTED] ${code}` : code}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── 02 TARGET ROLE ── */}
          <section style={{ marginBottom: '36px' }}>
            <div
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#000000',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
              }}
            >
              <span style={{ color: '#0047FF' }}>02</span>
              <span>TARGET ROLE</span>
              <span style={{ color: '#666666', fontWeight: 400 }}>
                [{selectedSector.label.toUpperCase()}]
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {selectedSector.roles.map((role, idx) => {
                const isSelected = role.id === selectedRoleId;

                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    style={{
                      border: isSelected ? '2px solid #000000' : '1px solid #000000',
                      background: '#FFFFFF',
                      padding: '20px 18px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '140px',
                      borderRadius: 0,
                      position: 'relative',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div
                          style={{
                            fontFamily: 'var(--f-sans)',
                            fontSize: '16px',
                            fontWeight: 900,
                            letterSpacing: '0.02em',
                            color: '#000000',
                            lineHeight: 1.1,
                          }}
                        >
                          {role.title.toUpperCase()}
                        </div>
                        {isSelected && (
                          <span
                            style={{
                              background: '#000000',
                              color: '#FFFFFF',
                              fontFamily: 'var(--f-mono)',
                              fontSize: '8px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              letterSpacing: '0.1em',
                            }}
                          >
                            ACTIVE
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--f-mono)',
                          fontSize: '10px',
                          color: '#555555',
                          marginTop: '8px',
                        }}
                      >
                        {role.technologies.slice(0, 3).join(' • ')}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: 'var(--f-mono)',
                        fontSize: '9px',
                        color: '#666666',
                        borderTop: '1px solid #EEEEEE',
                        paddingTop: '8px',
                      }}
                    >
                      <span>CORE ROLE #0{idx + 1}</span>
                      <span>5 METRICS</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── 03 RESUME PROFILE OPTIONAL ── */}
          <section style={{ marginBottom: '36px' }}>
            <div
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#000000',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
              }}
            >
              <span style={{ color: '#0047FF' }}>03</span>
              <span>RESUME PROFILE</span>
              <span style={{ color: '#666666', fontWeight: 400 }}>OPTIONAL</span>
            </div>

            <div
              onDrop={handleDropZone}
              onDragOver={(e) => e.preventDefault()}
              style={{
                border: '1px solid #000000',
                padding: '36px 32px 24px',
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: '#666666', letterSpacing: '0.14em' }}>
                RESUME / PROFILE
              </div>

              <div
                style={{
                  fontFamily: 'var(--f-sans)',
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#000000',
                  margin: '8px 0 4px',
                  letterSpacing: '-0.02em',
                }}
              >
                {uploadedFileName ? uploadedFileName.toUpperCase() : 'DROP PROFILE HERE'}
              </div>

              <div style={{ fontFamily: 'var(--f-mono)', fontSize: '10px', color: '#777777', marginBottom: '20px' }}>
                PDF / DOC / DOCX
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1px solid #000000',
                  background: '#FFFFFF',
                  color: '#000000',
                  padding: '8px 24px',
                  fontFamily: 'var(--f-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: 0,
                  marginBottom: '28px',
                  transition: 'all 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#000000';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.color = '#000000';
                }}
              >
                SELECT FILE
              </button>

              {/* Status / Matched profile info */}
              {resumeProfile && (
                <div
                  style={{
                    width: '100%',
                    border: '1px solid #0047FF',
                    background: 'rgba(0, 71, 255, 0.05)',
                    padding: '12px 16px',
                    fontFamily: 'var(--f-mono)',
                    fontSize: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <span style={{ color: '#0047FF', fontWeight: 700 }}>
                    MATCHED CANDIDATE: {resumeProfile.candidateName.toUpperCase()}
                  </span>
                  <span style={{ color: '#333333' }}>{resumeProfile.profileTitle}</span>
                </div>
              )}

              {/* Bottom line */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #EEEEEE',
                  paddingTop: '16px',
                  fontFamily: 'var(--f-mono)',
                  fontSize: '10px',
                }}
              >
                <div style={{ color: '#777777' }}>
                  NO RESUME? <span style={{ color: '#000000' }}>ROLE-ONLY ASSESSMENT WILL BE USED</span>
                </div>
                <button
                  onClick={() => {
                    setResumeProfile(null);
                    setUploadedFileName(null);
                  }}
                  style={{
                    color: '#000000',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  CONTINUE WITHOUT RESUME →
                </button>
              </div>
            </div>
          </section>

          {/* ── 04 SENIORITY LEVEL ── */}
          <section style={{ marginBottom: '36px' }}>
            <div
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#000000',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
              }}
            >
              <span style={{ color: '#0047FF' }}>04</span>
              <span>SENIORITY LEVEL</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                border: '1px solid #000000',
              }}
            >
              {LEVEL_OPTIONS.map((lvl, idx) => {
                const isSelected = lvl.value === level;

                return (
                  <button
                    key={lvl.value}
                    onClick={() => setLevel(lvl.value)}
                    style={{
                      borderRight: idx < 3 ? '1px solid #000000' : 'none',
                      background: isSelected ? '#000000' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#000000',
                      padding: '18px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--f-sans)',
                        fontSize: '13px',
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {lvl.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--f-mono)',
                        fontSize: '8px',
                        letterSpacing: '0.08em',
                        color: isSelected ? '#0047FF' : '#777777',
                        fontWeight: 600,
                      }}
                    >
                      {lvl.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── 05 FOCUS COMPETENCIES ── */}
          <section style={{ marginBottom: '36px' }}>
            <div
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#000000',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
              }}
            >
              <span style={{ color: '#0047FF' }}>05</span>
              <span>FOCUS COMPETENCIES</span>
            </div>

            {/* Pill tags */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {activeCompetencies.map((id) => {
                const name = COMPETENCY_NAMES[id] ?? id.replace('comp-', '').toUpperCase();
                const isSelected = focusIds.includes(id);

                return (
                  <button
                    key={id}
                    onClick={() => toggleFocus(id)}
                    style={{
                      background: '#000000',
                      color: '#FFFFFF',
                      border: '1px solid #000000',
                      padding: '6px 14px',
                      fontFamily: 'var(--f-mono)',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      borderRadius: 0,
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', color: '#666666', marginBottom: '16px' }}>
              ALL COMPETENCIES INCLUDED BY DEFAULT
            </div>

            {/* Competency Model Box */}
            <div
              style={{
                border: '1px solid #000000',
                padding: '24px 20px',
                background: '#FFFFFF',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                  fontFamily: 'var(--f-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ fontWeight: 700, color: '#000000' }}>
                  COMPETENCY MODEL — {selectedRole.title.toUpperCase()}
                </span>
                <span style={{ color: '#0047FF', fontWeight: 700 }}>
                  IRT CALIBRATED THRESHOLDS
                </span>
              </div>

              {/* 5 Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {activeCompetencies.map((id) => {
                  const name = COMPETENCY_NAMES[id] ?? id.replace('comp-', '').toUpperCase();
                  const target = currentTargets[id] ?? 70;

                  return (
                    <div key={id}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontFamily: 'var(--f-mono)',
                          fontSize: '9px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ color: '#000000' }}>{name}</span>
                        <span style={{ color: '#000000' }}>{target}</span>
                      </div>

                      <div
                        style={{
                          height: '10px',
                          background: '#EAEAEA',
                          border: '1px solid #000000',
                          overflow: 'hidden',
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${target}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{ height: '100%', background: '#0047FF' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── 06 ASSESSMENT DEPTH ── */}
          <section style={{ marginBottom: '36px' }}>
            <div
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#000000',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
              }}
            >
              <span style={{ color: '#0047FF' }}>06</span>
              <span>ASSESSMENT DEPTH</span>
              <span style={{ color: '#666666', fontWeight: 400 }}>
                — SELECT ADAPTIVE QUESTION VOLUME
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {DURATION_OPTIONS.map((d) => {
                const isSelected = d.value === duration;

                return (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    style={{
                      border: isSelected ? '2px solid #000000' : '1px solid #000000',
                      background: '#FFFFFF',
                      padding: '24px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderRadius: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '140px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--f-sans)',
                          fontSize: '18px',
                          fontWeight: 900,
                          letterSpacing: '0.04em',
                          color: '#000000',
                        }}
                      >
                        {d.label}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--f-mono)',
                          fontSize: '10px',
                          fontWeight: 600,
                          color: isSelected ? '#0047FF' : '#555555',
                          marginTop: '6px',
                        }}
                      >
                        {d.countLabel}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--f-mono)',
                          fontSize: '9px',
                          color: isSelected ? '#0047FF' : '#777777',
                          marginTop: '2px',
                        }}
                      >
                        {d.detail}
                      </div>
                    </div>

                    <div
                      style={{
                        fontFamily: 'var(--f-mono)',
                        fontSize: '9px',
                        color: '#666666',
                        letterSpacing: '0.1em',
                        borderTop: '1px solid #EEEEEE',
                        paddingTop: '8px',
                      }}
                    >
                      {d.fidelity}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      {/* ── BOTTOM DOCKED LAUNCH BAR ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          background: '#000000',
          color: '#FFFFFF',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--f-mono)',
          fontSize: '11px',
          borderTop: '1px solid #333333',
        }}
      >
        {/* Launch Button */}
        <button
          onClick={handleBegin}
          disabled={createSession.isPending}
          style={{
            background: '#FFFFFF',
            color: '#000000',
            border: '1px solid #FFFFFF',
            padding: '10px 24px',
            fontFamily: 'var(--f-mono)',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: createSession.isPending ? 'not-allowed' : 'pointer',
            borderRadius: 0,
            transition: 'all 0.15s ease',
          }}
          onMouseOver={(e) => {
            if (!createSession.isPending) {
              e.currentTarget.style.background = '#000000';
              e.currentTarget.style.color = '#FFFFFF';
            }
          }}
          onMouseOut={(e) => {
            if (!createSession.isPending) {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.color = '#000000';
            }
          }}
        >
          {createSession.isPending ? 'INITIALIZING ENGINE...' : 'BEGIN ADAPTIVE INTERVIEW →'}
        </button>

        {/* Central Specs */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', letterSpacing: '0.08em' }}>
          <span>
            {selectedRole.title.toUpperCase()} • {level.toUpperCase()}
          </span>
          <span style={{ color: '#555555' }}>|</span>
          <span>
            {durationObj.countLabel.toUpperCase()} • VOICE INTERVIEW
          </span>
          <span style={{ color: '#555555' }}>|</span>
          <span style={{ color: '#0047FF', fontWeight: 700 }}>
            ESTIMATED RUNTIME: ~{durationObj.value === 'quick' ? '10' : durationObj.value === 'deep' ? '35' : '20'} MINUTES
          </span>
        </div>
      </div>

      {/* Global System Telemetry Footer */}
      <SystemFooter />
    </div>
  );
}
