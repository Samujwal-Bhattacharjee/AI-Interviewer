import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateSession } from '../../hooks/useAssessment';
import type { AssessmentDuration, InterviewLanguageMode } from '../../types/assessment';
import type { RoleLevel } from '../../types/roles';
import { useInterviewStore } from '../../store/interviewStore';
import { matchResumeFile } from '../../mock/resumeProfiles';
import type { ResumeProfile } from '../../types/setup';
import type { ScanState } from '../../types/setup';
import { voiceService } from '../../services/voiceService';

import {
  INDIAN_LANGUAGES,
  MODE_2_SUPPORTED_LANGUAGES,
  getLanguageByCode,
  DEFAULT_LANGUAGE_CODE,
} from '../../config/languages';

// Backwards-compatible export
export const AVAILABLE_LANGUAGES = INDIAN_LANGUAGES;

const SECTORS_LIST = [
  { id: 'technology', name: 'TECHNOLOGY', rolesCount: '3 roles', code: 'SYS_TECH' },
  { id: 'finance', name: 'FINANCE', rolesCount: '3 roles', code: 'SYS_FIN' },
  { id: 'healthcare', name: 'HEALTHCARE', rolesCount: '3 roles', code: 'SYS_HLTH' },
  { id: 'marketing', name: 'MARKETING & SALES', rolesCount: '3 roles', code: 'SYS_MKTG' },
  { id: 'design', name: 'DESIGN & PRODUCT', rolesCount: '3 roles', code: 'SYS_DES' },
];

const ROLES_BY_SECTOR: Record<string, Array<{ id: string; title: string; skills: string; num: string }>> = {
  technology: [
    { id: 'role-sw-engineer', title: 'SOFTWARE\nENGINEER', skills: 'Python · Java · SQL', num: '#01' },
    { id: 'role-data-engineer', title: 'DATA\nENGINEER', skills: 'Python · SQL · Spark', num: '#02' },
    { id: 'role-ml-engineer', title: 'ML\nENGINEER', skills: 'Python · PyTorch · Scikit-learn', num: '#03' },
  ],
  finance: [
    { id: 'role-quant-analyst', title: 'QUANTITATIVE\nANALYST', skills: 'Python · C++ · Stochastic Calculus', num: '#01' },
    { id: 'role-fin-engineer', title: 'FINANCIAL\nENGINEER', skills: 'Risk Models · R · SQL', num: '#02' },
    { id: 'role-algo-trader', title: 'ALGO\nTRADER', skills: 'Low Latency · C++ · Linux', num: '#03' },
  ],
  healthcare: [
    { id: 'role-bio-engineer', title: 'BIOMEDICAL\nENGINEER', skills: 'Signal Processing · MATLAB · Python', num: '#01' },
    { id: 'role-health-informatics', title: 'HEALTH\nINFORMATICS', skills: 'FHIR · HL7 · SQL · Python', num: '#02' },
    { id: 'role-clinical-data', title: 'CLINICAL DATA\nSCIENTIST', skills: 'Biostatistics · R · Survival Analysis', num: '#03' },
  ],
  marketing: [
    { id: 'role-growth-engineer', title: 'GROWTH\nENGINEER', skills: 'A/B Testing · SQL · TypeScript', num: '#01' },
    { id: 'role-martech-lead', title: 'MARKETING TECH\nLEAD', skills: 'Segment · GA4 · ETL · Python', num: '#02' },
    { id: 'role-revops-architect', title: 'REVOPS\nARCHITECT', skills: 'Salesforce · Data Modeling · API', num: '#03' },
  ],
  design: [
    { id: 'role-product-designer', title: 'PRODUCT\nDESIGNER', skills: 'Figma · Prototyping · Systems', num: '#01' },
    { id: 'role-design-technologist', title: 'DESIGN\nTECHNOLOGIST', skills: 'React · WebGL · CSS Architecture', num: '#02' },
    { id: 'role-ux-researcher', title: 'UX\nRESEARCHER', skills: 'Cognitive Walkthrough · Usability', num: '#03' },
  ],
};

const LEVELS: Array<{ id: RoleLevel; label: string; desc: string }> = [
  { id: 'beginner', label: 'BEGINNER', desc: 'FOUNDATIONAL' },
  { id: 'junior', label: 'JUNIOR', desc: 'ENTRY-LEVEL PROFESSIONAL' },
  { id: 'intermediate', label: 'INTERMEDIATE', desc: 'INDEPENDENT PRACTITIONER' },
  { id: 'senior', label: 'SENIOR', desc: 'ADVANCED PRACTITIONER' },
];

const DEFAULT_COMPETENCIES = [
  { id: 'comp-dsa', name: 'ALGORITHMS & DS', score: 72 },
  { id: 'comp-python', name: 'PYTHON SYSTEMS', score: 78 },
  { id: 'comp-debugging', name: 'DEBUGGING', score: 70 },
  { id: 'comp-sql', name: 'DATABASES & SQL', score: 65 },
  { id: 'comp-system-design', name: 'SYSTEM DESIGN', score: 68 },
];

const SCAN_MESSAGES: Record<ScanState, string> = {
  idle: '',
  uploading: 'UPLOADING DOCUMENT...',
  scanning: 'SCANNING DOCUMENT...',
  extracting: 'EXTRACTING SKILLS & EXPERIENCE...',
  matching: 'MATCHING PROFILE...',
  ready: 'PROFILE LOADED',
  error: 'NO MATCHING PROFILE FOUND — ROLE-ONLY MODE',
};

export function AssessmentPage() {
  const navigate = useNavigate();
  const createSession = useCreateSession();
  const setSession = useInterviewStore((s) => s.setSession);
  const reset = useInterviewStore((s) => s.reset);

  const [selectedSector, setSelectedSector] = useState('technology');
  const [selectedRole, setSelectedRole] = useState('role-sw-engineer');
  const [selectedLevel, setSelectedLevel] = useState<RoleLevel>('junior');
  const [selectedDepth, setSelectedDepth] = useState<AssessmentDuration>('standard');
  const [interviewMode, setInterviewMode] = useState<InterviewLanguageMode>('native');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(DEFAULT_LANGUAGE_CODE);

  const isNativeMode = interviewMode === 'native' || interviewMode === 'mode1_native';
  const selectedLangObj = getLanguageByCode(selectedLanguage);

  // Resume / scan state
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile | null>(null);

  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>(
    DEFAULT_COMPETENCIES.map((c) => c.name)
  );

  const [isLaunching, setIsLaunching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Derive roles for sector
  const currentRoles = ROLES_BY_SECTOR[selectedSector] || ROLES_BY_SECTOR.technology;
  const activeRoleObj = currentRoles.find((r) => r.id === selectedRole) || currentRoles[0];

  const handleSectorChange = (sectorId: string) => {
    setSelectedSector(sectorId);
    const newRoles = ROLES_BY_SECTOR[sectorId] || ROLES_BY_SECTOR.technology;
    if (newRoles.length > 0) {
      setSelectedRole(newRoles[0].id);
    }
  };

  const toggleCompetency = (name: string) => {
    setSelectedCompetencies((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  // When a resume profile is loaded, auto-apply its suggested focus competencies
  useEffect(() => {
    if (resumeProfile) {
      const profileCompNames = resumeProfile.suggestedFocus
        .map((id) => DEFAULT_COMPETENCIES.find((c) => c.id === id)?.name)
        .filter((n): n is string => Boolean(n));
      if (profileCompNames.length > 0) {
        setSelectedCompetencies(profileCompNames);
      }
    }
  }, [resumeProfile]);

  // Simulate the multi-step scan pipeline
  const runScanPipeline = useCallback(async (fileName: string) => {
    setScanState('uploading');
    await new Promise((r) => setTimeout(r, 500));
    setScanState('scanning');
    await new Promise((r) => setTimeout(r, 800));
    setScanState('extracting');
    await new Promise((r) => setTimeout(r, 700));
    setScanState('matching');
    await new Promise((r) => setTimeout(r, 600));

    const matched = matchResumeFile(fileName);
    if (matched) {
      setResumeProfile(matched);
      setScanState('ready');
    } else {
      setResumeProfile(null);
      setScanState('error');
      // Auto-revert to idle after showing the error
      setTimeout(() => setScanState('idle'), 3500);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setResumeProfile(null);
    void runScanPipeline(file.name);
  };

  const handleClearResume = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFileName(null);
    setResumeProfile(null);
    setScanState('idle');
    setSelectedCompetencies(DEFAULT_COMPETENCIES.map((c) => c.name));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLaunchAssessment = async () => {
    if (isLaunching) return;
    // IMPORTANT: unlock browser audio autoplay from this user-gesture click
    voiceService.unlockAudioContext();
    setIsLaunching(true);
    reset();

    const estimatedQuestions = selectedDepth === 'quick' ? 5 : selectedDepth === 'deep' ? 15 : 10;
    const isNative = interviewMode === 'native' || interviewMode === 'mode1_native';
    const langCode = isNative ? selectedLanguage : 'en-IN';
    const qLang = isNative ? selectedLanguage : 'en-IN';
    const aLang = isNative ? selectedLanguage : 'auto';

    try {
      const session = await createSession.mutateAsync({
        targetRoleId: selectedRole,
        level: selectedLevel,
        focusCompetencies: selectedCompetencies,
        duration: selectedDepth,
        resumeProfileId: resumeProfile?.id ?? null,
        interviewMode,
        targetLanguage: langCode,
        language: langCode,
        questionLanguage: qLang,
        answerLanguage: aLang,
      });

      setSession(session.id, selectedRole, estimatedQuestions, interviewMode, langCode);
      navigate('/interview');
    } catch {
      // Fallback local mock session if backend is offline
      const mockSessionId = 'sess_' + Math.random().toString(36).substring(2, 9);
      setSession(mockSessionId, selectedRole, estimatedQuestions, interviewMode, langCode);
      navigate('/interview');
    } finally {
      setIsLaunching(false);
    }
  };

  const activeSectorObj = SECTORS_LIST.find((s) => s.id === selectedSector) || SECTORS_LIST[0];
  const isScanning = scanState !== 'idle' && scanState !== 'ready' && scanState !== 'error';

  return (
    <div className="text-slate-100 font-mono antialiased relative min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden bg-transparent z-10">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx"
        className="hidden"
        id="resume-file-input"
      />

      {/* Main Viewport Layout */}
      <main className="max-w-[1720px] mx-auto px-4 lg:px-8 py-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* BEGIN: Left Calibration Sidebar */}
          <aside className="lg:col-span-3 space-y-6" data-purpose="target-summary-sidebar">
            {/* Header Banner */}
            <div className="glass-panel p-6 rounded-lg relative overflow-hidden border-t-2 border-t-cyan-400/80">
              <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 mb-1 flex items-center space-x-2">
                <span>ASSESSMENT</span>
                <span className="text-slate-600">/</span>
                <span className="text-cyan-300">CONFIGURE</span>
              </div>
              <h1 className="font-display font-black text-2xl lg:text-3xl text-white tracking-tight uppercase leading-none drop-shadow-md">
                NEW<br />ASSESSMENT
              </h1>
              <p className="mt-2 text-xs text-slate-400 font-mono tracking-wide border-t border-white/10 pt-2">
                CALIBRATION PROTOCOL V3.8
              </p>
            </div>

            {/* Telemetry Parameters Summary Card */}
            <div className="glass-panel p-6 rounded-lg space-y-5 text-xs font-mono">
              {/* Param: Target */}
              <div className="border-l-2 border-cyan-400 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">TARGET</div>
                <div className="font-bold text-white tracking-wider text-sm mt-0.5">
                  {activeRoleObj.title.replace('\n', ' ')}
                </div>
                <div className="text-[10px] text-cyan-400 uppercase">{activeSectorObj.name}</div>
              </div>

              {/* Param: Profile */}
              <div className={`border-l-2 pl-3 transition-colors ${resumeProfile ? 'border-emerald-400' : 'border-slate-700'}`}>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">PROFILE</div>
                {resumeProfile ? (
                  <div>
                    <div className="font-semibold text-emerald-300 mt-0.5">{resumeProfile.candidateName.toUpperCase()}</div>
                    <div className="text-[10px] text-emerald-400/80 mt-0.5">{resumeProfile.profileTitle}</div>
                  </div>
                ) : (
                  <div className="font-semibold text-slate-400 mt-0.5">
                    {isScanning ? SCAN_MESSAGES[scanState] : 'NO RESUME'}
                  </div>
                )}
              </div>

              {/* Param: Level */}
              <div className="border-l-2 border-cyan-400 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">LEVEL</div>
                <div className="font-bold text-white uppercase mt-0.5">{selectedLevel}</div>
                <div className="text-[10px] text-slate-400">
                  {LEVELS.find((l) => l.id === selectedLevel)?.desc}
                </div>
              </div>

              {/* Param: Focus */}
              <div className="border-l-2 border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">FOCUS</div>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {selectedCompetencies.length === DEFAULT_COMPETENCIES.length
                    ? 'ALL COMPETENCIES'
                    : `${selectedCompetencies.length} SELECTED`}
                </div>
                <div className="text-[10px] text-cyan-400/80">({DEFAULT_COMPETENCIES.length} TRACKED)</div>
              </div>

              {/* Param: Interview Type */}
              <div className="border-l-2 border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">INTERVIEW</div>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {selectedDepth === 'quick' ? '~5' : selectedDepth === 'deep' ? '~15' : '~10'} ADAPTIVE QUESTIONS
                </div>
                <div className="text-[10px] text-slate-400">ROLE-BASED · IRT ENGINE</div>
              </div>

              {/* Param: Language */}
              <div className="border-l-2 border-cyan-400 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">LANGUAGE</div>
                <div className="font-bold text-white uppercase mt-0.5">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isNativeMode ? selectedLangObj.name : 'MULTILINGUAL'}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      transition={{ duration: 0.15 }}
                      className="inline-block"
                    >
                      {isNativeMode ? selectedLangObj.name.toUpperCase() : 'MULTILINGUAL'}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="text-[10px] text-cyan-400">
                  {isNativeMode ? selectedLangObj.nativeName : 'INDIC MULTI-SPEECH'}
                </div>
              </div>

              {/* Param: Mode */}
              <div className="border-l-2 border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">MODE</div>
                <div className="font-semibold text-slate-200 uppercase mt-0.5">
                  {isNativeMode ? 'IN MY LANGUAGE' : 'ANSWER IN ANY LANGUAGE'}
                </div>
                <div className="text-[10px] text-slate-400 uppercase">
                  {isNativeMode ? 'NATIVE VOICE INTERVIEW' : 'BILINGUAL CAREER ACCELERATOR'}
                </div>
              </div>

              {/* Param: Voice Engine */}
              <div className="border-l-2 border-cyan-400 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">VOICE</div>
                <div className="font-bold text-cyan-300 mt-0.5">ELEVENLABS</div>
                <div className="text-[10px] text-slate-400">MULTILINGUAL V2 · 24KHZ PCM</div>
              </div>

              {/* Param: Question Language */}
              <div className="border-l-2 border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">QUESTION LANGUAGE</div>
                <div className="font-semibold text-slate-200 uppercase mt-0.5">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isNativeMode ? selectedLangObj.name : 'ENGLISH'}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      transition={{ duration: 0.15 }}
                      className="inline-block"
                    >
                      {isNativeMode ? selectedLangObj.name.toUpperCase() : 'ENGLISH'}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="text-[10px] text-slate-400">
                  {isNativeMode ? `CODE: ${selectedLangObj.code}` : 'CODE: en-IN'}
                </div>
              </div>

              {/* Param: Answer Language */}
              <div className="border-l-2 border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">ANSWER LANGUAGE</div>
                <div className="font-semibold text-slate-200 uppercase mt-0.5">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isNativeMode ? selectedLangObj.name : 'AUTO-DETECT'}
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      transition={{ duration: 0.15 }}
                      className="inline-block"
                    >
                      {isNativeMode ? selectedLangObj.name.toUpperCase() : 'AUTO-DETECT'}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="text-[10px] text-slate-400">
                  {isNativeMode ? selectedLangObj.nativeName : 'SUPPORTED: 6 INDIAN LANGS'}
                </div>
              </div>

              {/* Target Score Baseline */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-slate-300 tracking-wider flex items-center space-x-1">
                    <span>TARGET REQUIREMENTS</span>
                    <span className="text-cyan-400 text-xs">▼</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono bg-black/40 px-3 py-2 rounded border border-white/5">
                  <span className="text-slate-400">ALGORITHMS &amp; DS BASELINE</span>
                  <span className="text-white font-bold tracking-widest">
                    <span className="text-cyan-400">72</span> / 100
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Engine Tag */}
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-2 leading-relaxed">
              ADAPTIVE PSYCHOMETRIC TEST ENGINE<br />
              CALIBRATION: IRT 3-PARAMETER LOGISTIC
            </div>
          </aside>
          {/* END: Left Calibration Sidebar */}

          {/* BEGIN: Main Multi-Step Config Form Area */}
          <section className="lg:col-span-9 space-y-10" data-purpose="assessment-configuration-flow">
            {/* 01 SECTOR SELECTOR */}
            <article className="space-y-4" data-purpose="step-01-sector">
              <div className="flex items-center justify-between border-b border-white/15 pb-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-cyan-400 font-bold text-sm tracking-wider">01</span>
                  <h2 className="text-white font-tech font-bold text-sm uppercase tracking-widest">
                    SECTOR <span className="text-slate-500 font-mono text-xs font-normal">— SELECT PRIMARY DOMAIN DISCIPLINE</span>
                  </h2>
                </div>
              </div>

              {/* Sector Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {SECTORS_LIST.map((sector) => {
                  const isSelected = selectedSector === sector.id;
                  return (
                    <button
                      key={sector.id}
                      type="button"
                      onClick={() => handleSectorChange(sector.id)}
                      className={`${
                        isSelected ? 'glass-card-active' : 'glass-card-interactive'
                      } p-4 rounded-lg text-left relative group transition`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#00f0ff]" />
                      )}
                      <div
                        className={`font-tech font-bold text-sm uppercase tracking-wide ${
                          isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {sector.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">{sector.rolesCount}</div>
                      <div
                        className={`mt-4 pt-2 border-t ${
                          isSelected ? 'border-cyan-500/20 text-cyan-400 font-semibold' : 'border-white/10 text-slate-500'
                        } text-[10px] font-mono uppercase tracking-wider`}
                      >
                        {isSelected ? `[SELECTED]${sector.code}` : sector.code}
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>

            {/* 02 TARGET ROLE */}
            <article className="space-y-4" data-purpose="step-02-target-role">
              <div className="flex items-center justify-between border-b border-white/15 pb-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-cyan-400 font-bold text-sm tracking-wider">02</span>
                  <h2 className="text-white font-tech font-bold text-sm uppercase tracking-widest">
                    TARGET ROLE <span className="text-cyan-400/80 font-mono text-xs">[{activeSectorObj.name}]</span>
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentRoles.map((role) => {
                  const isActive = selectedRole === role.id;
                  return (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`${
                        isActive ? 'glass-card-active' : 'glass-card-interactive'
                      } p-5 rounded-lg relative flex flex-col justify-between cursor-pointer group`}
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <h3
                            className={`font-tech font-bold text-lg uppercase tracking-wider leading-tight ${
                              isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                            }`}
                          >
                            {role.title.split('\n').map((line, idx) => (
                              <span key={idx}>
                                {line}
                                <br />
                              </span>
                            ))}
                          </h3>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded bg-cyan-400 text-black text-[10px] font-mono font-bold uppercase tracking-wider shadow-glow-cyan-sm">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-mono mt-3 ${isActive ? 'text-cyan-200/80' : 'text-slate-400'}`}>
                          {role.skills}
                        </p>
                      </div>
                      <div
                        className={`mt-6 pt-3 border-t ${
                          isActive ? 'border-cyan-400/20 text-slate-400' : 'border-white/10 text-slate-400'
                        } flex items-center justify-between text-[10px] font-mono uppercase`}
                      >
                        <span>CORE ROLE {role.num}</span>
                        <span className={isActive ? 'text-cyan-300' : ''}>5 METRICS</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            {/* 03 RESUME PROFILE */}
            <article className="space-y-4" data-purpose="step-03-resume-profile">
              <div className="flex items-center justify-between border-b border-white/15 pb-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-cyan-400 font-bold text-sm tracking-wider">03</span>
                  <h2 className="text-white font-tech font-bold text-sm uppercase tracking-widest">
                    RESUME PROFILE <span className="text-slate-500 font-mono text-xs font-normal">OPTIONAL</span>
                  </h2>
                </div>
              </div>

              {/* Dropzone Card — shows three states: idle/uploading, ready, error */}
              <AnimatePresence mode="wait">
                {scanState === 'ready' && resumeProfile ? (
                  /* ── PROFILE LOADED STATE ── */
                  <motion.div
                    key="profile-ready"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="glass-panel p-8 rounded-lg border-2 border-emerald-400/50 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-2xl pointer-events-none" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 mb-1">
                            ✓ PROFILE EXTRACTED
                          </div>
                          <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">
                            {resumeProfile.candidateName}
                          </h3>
                          <div className="text-sm text-emerald-300 font-mono mt-0.5">{resumeProfile.profileTitle}</div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">SKILLS DETECTED</div>
                            <div className="flex flex-wrap gap-1">
                              {resumeProfile.skills.slice(0, 6).map((s) => (
                                <span key={s} className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 font-mono text-[10px]">
                                  {s}
                                </span>
                              ))}
                              {resumeProfile.skills.length > 6 && (
                                <span className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-slate-400 font-mono text-[10px]">
                                  +{resumeProfile.skills.length - 6}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">PROJECTS</div>
                            <div className="space-y-0.5">
                              {resumeProfile.projects.slice(0, 3).map((p) => (
                                <div key={p} className="text-[11px] text-slate-300 font-mono">· {p}</div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">FOCUS AREAS</div>
                            <div className="space-y-0.5">
                              {resumeProfile.suggestedFocus.map((id) => {
                                const comp = DEFAULT_COMPETENCIES.find((c) => c.id === id);
                                return comp ? (
                                  <div key={id} className="text-[11px] text-cyan-300 font-mono">→ {comp.name}</div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearResume}
                        className="flex-shrink-0 px-3 py-1.5 rounded border border-white/15 hover:border-red-400/50 text-slate-400 hover:text-red-300 font-mono text-[10px] uppercase tracking-wider transition"
                        aria-label="Remove resume"
                      >
                        REMOVE
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* ── UPLOAD / SCANNING / ERROR STATE ── */
                  <motion.div
                    key="upload-zone"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => !isScanning && fileInputRef.current?.click()}
                    className={`glass-panel p-8 rounded-lg border-2 border-dashed transition-all duration-300 text-center relative overflow-hidden group ${
                      isScanning
                        ? 'border-cyan-400/70 cursor-default'
                        : scanState === 'error'
                        ? 'border-amber-400/50 cursor-pointer hover:border-amber-400'
                        : 'border-white/15 hover:border-cyan-400/50 cursor-pointer'
                    }`}
                  >
                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    {/* Scan progress animation */}
                    {isScanning && (
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-black/30">
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-300"
                          animate={{ width: ['0%', '100%', '0%'] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </div>
                    )}

                    <div className={`text-[11px] font-mono uppercase tracking-widest mb-1 ${
                      isScanning ? 'text-cyan-400' : scanState === 'error' ? 'text-amber-400' : 'text-cyan-400'
                    }`}>
                      {isScanning ? SCAN_MESSAGES[scanState] : scanState === 'error' ? '⚠ SCAN COMPLETE' : 'RESUME / PROFILE'}
                    </div>

                    <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight mb-2">
                      {isScanning
                        ? uploadedFileName ?? 'PROCESSING...'
                        : scanState === 'error'
                        ? 'NO PROFILE MATCH'
                        : uploadedFileName ?? 'DROP PROFILE HERE'}
                    </h3>

                    {scanState === 'error' ? (
                      <p className="text-xs font-mono text-amber-300/80 uppercase tracking-widest mb-6">
                        UNRECOGNIZED FILE — ROLE-ONLY MODE WILL BE USED
                      </p>
                    ) : (
                      <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-6">
                        PDF / DOC / DOCX
                      </p>
                    )}

                    {!isScanning && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-6 py-2.5 bg-black/60 hover:bg-cyan-950/80 text-white font-mono text-xs uppercase tracking-wider font-bold rounded border border-cyan-400/50 hover:border-cyan-400 transition-all shadow-glow-cyan-sm"
                      >
                        {uploadedFileName ? 'CHANGE FILE' : 'SELECT FILE'}
                      </button>
                    )}

                    {isScanning && (
                      <div className="flex items-center justify-center space-x-1.5 mt-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Bottom Skip Option */}
                    <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                      <span className="text-slate-400">
                        NO RESUME? <span className="text-slate-500 text-[10px]">ROLE-ONLY ASSESSMENT WILL BE USED</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearResume(e);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-bold tracking-wider inline-flex items-center space-x-1 transition-colors"
                      >
                        <span>CONTINUE WITHOUT RESUME</span>
                        <span>→</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </article>

            {/* 04 SENIORITY LEVEL */}
            <article className="space-y-4" data-purpose="step-04-seniority-level">
              <div className="flex items-center justify-between border-b border-white/15 pb-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-cyan-400 font-bold text-sm tracking-wider">04</span>
                  <h2 className="text-white font-tech font-bold text-sm uppercase tracking-widest">
                    SENIORITY LEVEL
                  </h2>
                </div>
              </div>

              {/* 4-Segment Grid Control */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {LEVELS.map((lvl) => {
                  const isActive = selectedLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setSelectedLevel(lvl.id)}
                      className={`${
                        isActive ? 'glass-card-active' : 'glass-card-interactive'
                      } p-4 rounded-lg text-left relative overflow-hidden group`}
                    >
                      {isActive && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#00f0ff]" />
                      )}
                      <div
                        className={`font-tech font-bold text-sm uppercase tracking-wider ${
                          isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {lvl.label}
                      </div>
                      <div
                        className={`text-[10px] font-mono mt-1 uppercase ${
                          isActive ? 'text-cyan-300 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {lvl.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>

            {/* 05 FOCUS COMPETENCIES */}
            <article className="space-y-4" data-purpose="step-05-focus-competencies">
              <div className="flex items-center justify-between border-b border-white/15 pb-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-cyan-400 font-bold text-sm tracking-wider">05</span>
                  <h2 className="text-white font-tech font-bold text-sm uppercase tracking-widest">
                    FOCUS COMPETENCIES
                  </h2>
                </div>
                {resumeProfile && (
                  <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">
                    ↑ AUTO-SET FROM PROFILE
                  </span>
                )}
              </div>

              {/* Filter Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {DEFAULT_COMPETENCIES.map((comp) => {
                  const isChecked = selectedCompetencies.includes(comp.name);
                  return (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => toggleCompetency(comp.name)}
                      className={`px-3.5 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition ${
                        isChecked
                          ? 'bg-black/80 text-white border border-cyan-400/80 shadow-glow-cyan-sm'
                          : 'bg-black/40 text-slate-400 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      {comp.name}
                    </button>
                  );
                })}
              </div>
              <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                ALL COMPETENCIES INCLUDED BY DEFAULT
              </div>

              {/* IRT Calibrated Thresholds Gauge Panel */}
              <div className="glass-panel p-6 rounded-lg border border-cyan-500/20 space-y-4 mt-3">
                <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-white/10">
                  <span className="text-slate-300 font-semibold tracking-wider uppercase">
                    COMPETENCY MODEL — {activeRoleObj.title.replace('\n', ' ')}
                  </span>
                  <span className="text-cyan-400 uppercase text-[10px] tracking-widest font-bold">
                    IRT CALIBRATED THRESHOLDS
                  </span>
                </div>

                {DEFAULT_COMPETENCIES.map((comp) => (
                  <div key={comp.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300 uppercase tracking-wider">{comp.name}</span>
                      <span className="text-cyan-300 font-bold">{comp.score}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900/80 rounded overflow-hidden p-[1px] border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-sm shadow-[0_0_10px_#00f0ff]"
                        style={{ width: `${comp.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* 06 ASSESSMENT DEPTH */}
            <article className="space-y-4" data-purpose="step-06-assessment-depth">
              <div className="flex items-center justify-between border-b border-white/15 pb-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-cyan-400 font-bold text-sm tracking-wider">06</span>
                  <h2 className="text-white font-tech font-bold text-sm uppercase tracking-widest">
                    ASSESSMENT DEPTH <span className="text-slate-500 font-mono text-xs font-normal">— SELECT ADAPTIVE QUESTION VOLUME</span>
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Quick */}
                <div
                  onClick={() => setSelectedDepth('quick')}
                  className={`${
                    selectedDepth === 'quick' ? 'glass-card-active' : 'glass-card-interactive'
                  } p-6 rounded-lg text-center flex flex-col justify-between cursor-pointer group`}
                >
                  <div>
                    <h3 className="font-tech font-bold text-xl text-white uppercase tracking-wider">QUICK</h3>
                    <div className="text-xs text-slate-300 font-mono mt-2">~5 adaptive questions</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">Voice interview (~10 min)</div>
                  </div>
                  <div className="mt-6 pt-3 border-t border-white/10 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                    RAPID TRIAGE
                  </div>
                </div>

                {/* Standard (Recommended) */}
                <div
                  onClick={() => setSelectedDepth('standard')}
                  className={`${
                    selectedDepth === 'standard' ? 'glass-card-active' : 'glass-card-interactive'
                  } p-6 rounded-lg text-center flex flex-col justify-between cursor-pointer relative overflow-hidden group`}
                >
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-cyan-500/20 blur-xl pointer-events-none" />
                  <div>
                    <h3 className="font-tech font-bold text-xl text-white uppercase tracking-wider">STANDARD</h3>
                    <div className="text-xs text-cyan-300 font-mono mt-2 font-semibold">~10 adaptive questions</div>
                    <div className="text-[11px] text-cyan-200/90 font-mono mt-1">Voice interview (~20 min)</div>
                  </div>
                  <div className="mt-6 pt-3 border-t border-cyan-400/20 text-[10px] text-cyan-400 font-mono uppercase tracking-widest font-bold">
                    RECOMMENDED FIDELITY
                  </div>
                </div>

                {/* Deep */}
                <div
                  onClick={() => setSelectedDepth('deep')}
                  className={`${
                    selectedDepth === 'deep' ? 'glass-card-active' : 'glass-card-interactive'
                  } p-6 rounded-lg text-center flex flex-col justify-between cursor-pointer group`}
                >
                  <div>
                    <h3 className="font-tech font-bold text-xl text-white uppercase tracking-wider">DEEP</h3>
                    <div className="text-xs text-slate-300 font-mono mt-2">~15 adaptive questions</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">Voice interview (~35 min)</div>
                  </div>
                  <div className="mt-6 pt-3 border-t border-white/10 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                    HIGH PRECISION IRT
                  </div>
                </div>
              </div>
            </article>

            {/* 07 INTERVIEW MODE & LANGUAGE */}
            <article className="space-y-4" data-purpose="step-07-interview-mode">
              <div className="flex items-center justify-between border-b border-white/15 pb-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-cyan-400 font-bold text-sm tracking-wider">07</span>
                  <h2 className="text-white font-tech font-bold text-sm uppercase tracking-widest">
                    INTERVIEW MODE &amp; LANGUAGE
                  </h2>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
                  ELEVENLABS MULTILINGUAL V2 + SPEECH ENGINE
                </span>
              </div>

              {/* Mode Selection Cards: Exactly TWO Modes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MODE 1: IN MY LANGUAGE */}
                <div
                  id="mode-1-native-card"
                  onClick={() => setInterviewMode('native')}
                  className={`${
                    isNativeMode
                      ? 'glass-card-active border-cyan-400/80 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                      : 'glass-card-interactive'
                  } p-5 rounded-lg flex flex-col justify-between cursor-pointer group transition-all duration-200`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🗣️</span>
                        <h3 className="font-tech font-bold text-base text-cyan-300 uppercase tracking-wider">
                          MODE 1: IN MY LANGUAGE
                        </h3>
                      </div>
                      {isNativeMode && (
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                      )}
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-2 leading-relaxed">
                      Hear questions and speak answers entirely in your chosen language.
                    </div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-white/10 text-[10px] text-cyan-400 font-mono uppercase tracking-widest font-bold flex items-center justify-between">
                    <span>NATIVE VOICE INTERVIEW</span>
                    <span className="text-slate-400 font-normal">
                      {isNativeMode ? `[${selectedLangObj.name.toUpperCase()}]` : ''}
                    </span>
                  </div>
                </div>

                {/* MODE 2: ANSWER IN ANY LANGUAGE */}
                <div
                  id="mode-2-any-lang-card"
                  onClick={() => setInterviewMode('any_language')}
                  className={`${
                    !isNativeMode
                      ? 'glass-card-active border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                      : 'glass-card-interactive'
                  } p-5 rounded-lg flex flex-col justify-between cursor-pointer group transition-all duration-200`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🚀</span>
                        <h3 className="font-tech font-bold text-base text-amber-300 uppercase tracking-wider">
                          MODE 2: ANSWER IN ANY LANGUAGE
                        </h3>
                      </div>
                      {!isNativeMode && (
                        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                      )}
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-2 leading-relaxed">
                      AI asks in English → answer in any supported Indian language → system evaluates the answer and shows how to express it professionally in English.
                    </div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-white/10 text-[10px] text-amber-400 font-mono uppercase tracking-widest font-bold flex items-center justify-between">
                    <span>BILINGUAL CAREER ACCELERATOR</span>
                    <span className="text-slate-400 font-normal">
                      {!isNativeMode ? '[AUTO-DETECT]' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mode-Dependent Language Selection UI */}
              <AnimatePresence mode="wait">
                {isNativeMode ? (
                  /* MODE 1 UI: Select Interview Language */
                  <motion.div
                    key="mode1-language-panel"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="glass-panel p-5 rounded-lg border border-cyan-400/40 space-y-3.5 mt-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono border-b border-white/10 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-200 font-bold uppercase tracking-wider">
                          SELECT INTERVIEW LANGUAGE:
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          (QUESTION &amp; VOICE INTERACTION)
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-slate-400 uppercase">SELECTED:</span>
                        <motion.span
                          key={selectedLanguage}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.15 }}
                          className="text-cyan-400 font-bold uppercase text-[11px] px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/50 shadow-glow-cyan-sm"
                        >
                          {selectedLangObj.name.toUpperCase()}
                        </motion.span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
                      {INDIAN_LANGUAGES.map((lang) => {
                        const isSelected = selectedLanguage === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => setSelectedLanguage(lang.code)}
                            aria-label={`Select ${lang.name} — ${lang.nativeName}`}
                            className={`px-3.5 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-between group ${
                              isSelected
                                ? 'bg-cyan-500 text-black border border-cyan-300 shadow-glow-cyan-sm font-black'
                                : 'bg-black/60 text-slate-300 border border-white/15 hover:border-cyan-400/60 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2 overflow-hidden">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                  isSelected
                                    ? 'bg-black text-cyan-400'
                                    : 'bg-white/10 text-slate-300 group-hover:text-cyan-300 group-hover:bg-white/20'
                                }`}
                              >
                                {lang.displayTag}
                              </span>
                              <motion.span
                                key={`${lang.code}-${isSelected}`}
                                initial={{ opacity: 0.8 }}
                                animate={{ opacity: 1 }}
                                className="font-semibold text-sm truncate"
                              >
                                {lang.nativeName}
                              </motion.span>
                            </div>
                            <span
                              className={`text-[10px] font-normal tracking-normal ml-1.5 ${
                                isSelected ? 'text-black/85 font-bold' : 'text-slate-400'
                              }`}
                            >
                              ({lang.name.toUpperCase()})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  /* MODE 2 UI: Question Language English + Auto-detect Indian Answer Languages */
                  <motion.div
                    key="mode2-language-panel"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="glass-panel p-5 rounded-lg border border-amber-400/40 space-y-4 mt-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono border-b border-white/10 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-300 font-bold uppercase tracking-wider">
                          SELECT INTERVIEW LANGUAGE:
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          (ENGLISH QUESTIONS → ANY INDIAN LANGUAGE ANSWERS)
                        </span>
                      </div>
                      <span className="text-amber-400 font-bold uppercase text-[11px] px-2.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40">
                        MULTILINGUAL
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Question Language Card */}
                      <div className="bg-black/50 p-4 rounded border border-white/10 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                          QUESTION LANGUAGE
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base">🌐</span>
                          <span className="text-white font-bold text-sm tracking-wide">ENGLISH</span>
                          <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800">
                            en-IN
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono leading-relaxed pt-1">
                          Interviewer speaks questions in standard professional English.
                        </p>
                      </div>

                      {/* Answer Language Card */}
                      <div className="bg-black/50 p-4 rounded border border-white/10 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                          ANSWER LANGUAGE
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base">⚡</span>
                          <span className="text-emerald-300 font-bold text-sm tracking-wide">AUTO-DETECT</span>
                          <span className="text-[10px] text-emerald-400 font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                            ANY INDIAN LANG
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono leading-relaxed pt-1">
                          Speak naturally in any supported language. Answers are evaluated and reformulated into professional English.
                        </p>
                      </div>
                    </div>

                    {/* Supported Regional Languages Badges */}
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>SUPPORTED:</span>
                        <span className="text-slate-500">6 REGIONAL INDIAN LANGUAGES</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {MODE_2_SUPPORTED_LANGUAGES.map((lang) => (
                          <div
                            key={lang.code}
                            className="px-3 py-1.5 rounded bg-black/60 border border-white/15 text-slate-200 text-xs font-mono flex items-center space-x-2"
                          >
                            <span className="text-[10px] font-bold text-amber-400 px-1 py-0.5 rounded bg-amber-950/50">
                              {lang.displayTag}
                            </span>
                            <span className="font-semibold text-white">{lang.nativeName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({lang.name.toUpperCase()})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </article>
          </section>
        </div>
      </main>

      {/* BEGIN: Sticky Interactive Launch Bar */}
      <aside
        className="fixed bottom-0 inset-x-0 z-40 bg-black/85 backdrop-blur-2xl border-t border-cyan-400/20 px-4 lg:px-8 py-3.5 shadow-2xl"
        data-purpose="sticky-launch-bar"
      >
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Primary Launch CTA */}
          <button
            id="begin-assessment-btn"
            onClick={handleLaunchAssessment}
            disabled={isLaunching || isScanning}
            className={`w-full md:w-auto px-8 py-3 font-tech font-bold text-sm tracking-wider uppercase rounded border transition-all duration-200 shadow-glow-cyan flex items-center justify-center space-x-2 group ${
              isLaunching || isScanning
                ? 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-white text-black border-white hover:bg-cyan-300 hover:border-cyan-300 hover:text-black'
            }`}
            type="button"
          >
            <span>{isLaunching ? 'INITIALIZING...' : isScanning ? 'SCANNING RESUME...' : 'BEGIN ADAPTIVE INTERVIEW'}</span>
            {!isLaunching && !isScanning && <span className="group-hover:translate-x-1 transition-transform">→</span>}
          </button>

          {/* Active Selection Telemetry Recap */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-1 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-white font-bold tracking-wider">{activeRoleObj.title.replace('\n', ' ')}</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400 font-semibold">{selectedLevel.toUpperCase()}</span>
            </div>
            <span className="hidden sm:inline text-slate-700">|</span>
            <div className="text-slate-300 flex items-center space-x-1.5">
              <span className="text-cyan-300 font-bold">
                {isNativeMode ? selectedLangObj.name.toUpperCase() : 'MULTILINGUAL'}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                {isNativeMode ? 'NATIVE' : 'BILINGUAL'}
              </span>
            </div>
            <span className="hidden sm:inline text-slate-700">|</span>
            <div className="text-slate-300">
              {selectedDepth === 'quick' ? '~5' : selectedDepth === 'deep' ? '~15' : '~10'} ADAPTIVE QUESTIONS{' '}
              <span className="text-slate-600">·</span> VOICE INTERVIEW
            </div>
            <span className="hidden sm:inline text-slate-700">|</span>
            {resumeProfile ? (
              <div className="text-emerald-400 font-bold uppercase tracking-wider">
                ✓ PROFILE: {resumeProfile.candidateName.split(' ')[0].toUpperCase()}
              </div>
            ) : (
              <div className="text-cyan-400 font-bold uppercase tracking-wider">
                ESTIMATED RUNTIME: {selectedDepth === 'quick' ? '~10' : selectedDepth === 'deep' ? '~35' : '~20'} MINUTES
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* System Telemetry Footer */}
      <footer className="border-t border-white/10 bg-black/95 pt-8 pb-20 px-4 lg:px-8 text-xs font-mono text-slate-400" data-purpose="system-telemetry-footer">
        <div className="max-w-[1720px] mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-white/5">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest">SYSTEM LATENCY</span>
              <span className="text-slate-200 font-semibold">180MS [p99]</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest">PSYCHOMETRIC MODEL</span>
              <span className="text-slate-200 font-semibold">IRT 3-PARAMETER</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest">INTERVIEW ENGINE</span>
              <span className="text-slate-200 font-semibold">VOICE-STREAM V2</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest">SYSTEM STATUS</span>
              <span className="text-cyan-400 font-semibold flex items-center space-x-1.5">
                <span className="inline-block w-2 h-2 bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse" />
                <span>ALL ENGINES ONLINE</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              <span className="text-slate-300 font-bold">ADAPTIVE</span> © 2025 ADAPTIVE ASSESSMENT SYSTEMS INC. RAW BLOCK ARCHITECTURE.
            </div>
            <div className="flex items-center space-x-6">
              <a className="hover:text-cyan-400 transition" href="#privacy">PRIVACY PROTOCOL</a>
              <a className="hover:text-cyan-400 transition" href="#api">API DOCUMENTATION</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
