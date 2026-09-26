import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateSession } from '../../hooks/useAssessment';
import type { AssessmentDuration } from '../../types/assessment';
import type { RoleLevel } from '../../types/roles';
import { useInterviewStore } from '../../store/interviewStore';

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

export function AssessmentPage() {
  const navigate = useNavigate();
  const createSession = useCreateSession();
  const setSession = useInterviewStore((s) => s.setSession);
  const reset = useInterviewStore((s) => s.reset);

  const [selectedSector, setSelectedSector] = useState('technology');
  const [selectedRole, setSelectedRole] = useState('role-sw-engineer');
  const [selectedLevel, setSelectedLevel] = useState<RoleLevel>('junior');
  const [selectedDepth, setSelectedDepth] = useState<AssessmentDuration>('standard');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>(
    DEFAULT_COMPETENCIES.map((c) => c.name)
  );

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
    }
  };

  const handleLaunchAssessment = async () => {
    reset();

    const estimatedQuestions = selectedDepth === 'quick' ? 5 : selectedDepth === 'deep' ? 15 : 10;

    try {
      const session = await createSession.mutateAsync({
        targetRoleId: selectedRole,
        level: selectedLevel,
        focusCompetencies: selectedCompetencies,
        duration: selectedDepth,
      });

      setSession(session.id, selectedRole, estimatedQuestions);
      navigate('/interview');
    } catch {
      // Fallback local mock session if backend is offline
      const mockSessionId = 'sess_' + Math.random().toString(36).substring(2, 9);
      setSession(mockSessionId, selectedRole, estimatedQuestions);
      navigate('/interview');
    }
  };

  const activeSectorObj = SECTORS_LIST.find((s) => s.id === selectedSector) || SECTORS_LIST[0];

  return (
    <div className="text-slate-100 font-mono antialiased relative min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden bg-transparent z-10">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx"
        className="hidden"
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
              <div className="border-l-2 border-slate-700 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">PROFILE</div>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {uploadedFileName ? uploadedFileName.toUpperCase() : 'NO RESUME'}
                </div>
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

              {/* Param: Voice Engine */}
              <div className="border-l-2 border-cyan-400 pl-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">VOICE</div>
                <div className="font-bold text-cyan-300 mt-0.5">LIVE SPOKEN INTERVIEW</div>
                <div className="text-[10px] text-slate-400">24KHZ PCM BI-DIRECTIONAL</div>
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

              {/* Dropzone Card */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="glass-panel p-8 rounded-lg border-2 border-dashed border-white/15 hover:border-cyan-400/50 transition-all duration-300 text-center relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 mb-1">
                  RESUME / PROFILE
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight mb-2">
                  {uploadedFileName ? uploadedFileName : 'DROP PROFILE HERE'}
                </h3>
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-6">
                  PDF / DOC / DOCX
                </p>
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

                {/* Bottom Skip Option */}
                <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-slate-400">
                    NO RESUME? <span className="text-slate-500 text-[10px]">ROLE-ONLY ASSESSMENT WILL BE USED</span>
                  </span>
                  <span className="text-cyan-400 hover:text-cyan-300 font-bold tracking-wider inline-flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>CONTINUE WITHOUT RESUME</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
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
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-cyan-500/20 blur-xl pointer-events-none"></div>
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
          </section>
        </div>
      </main>

      {/* BEGIN: Sticky Interactive Launch Bar */}
      <aside className="fixed bottom-0 inset-x-0 z-40 bg-black/85 backdrop-blur-2xl border-t border-cyan-400/20 px-4 lg:px-8 py-3.5 shadow-2xl" data-purpose="sticky-launch-bar">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Primary Launch CTA */}
          <button
            onClick={handleLaunchAssessment}
            className="w-full md:w-auto px-8 py-3 bg-white text-black font-tech font-bold text-sm tracking-wider uppercase rounded border border-white hover:bg-cyan-300 hover:border-cyan-300 hover:text-black transition-all duration-200 shadow-glow-cyan flex items-center justify-center space-x-2 group"
            type="button"
          >
            <span>BEGIN ADAPTIVE INTERVIEW</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>

          {/* Active Selection Telemetry Recap */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-1 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-white font-bold tracking-wider">{activeRoleObj.title.replace('\n', ' ')}</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400 font-semibold">{selectedLevel.toUpperCase()}</span>
            </div>
            <span className="hidden sm:inline text-slate-700">|</span>
            <div className="text-slate-300">
              {selectedDepth === 'quick' ? '~5' : selectedDepth === 'deep' ? '~15' : '~10'} ADAPTIVE QUESTIONS{' '}
              <span className="text-slate-600">·</span> VOICE INTERVIEW
            </div>
            <span className="hidden sm:inline text-slate-700">|</span>
            <div className="text-cyan-400 font-bold uppercase tracking-wider">
              ESTIMATED RUNTIME: {selectedDepth === 'quick' ? '~10' : selectedDepth === 'deep' ? '~35' : '~20'} MINUTES
            </div>
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
                <span className="inline-block w-2 h-2 bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse"></span>
                <span>ALL ENGINES ONLINE</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              <span className="text-slate-300 font-bold">ADAPTIVE</span> © 2025 ADAPTIVE ASSESSMENT SYSTEMS INC. RAW BLOCK ARCHITECTURE.
            </div>
            <div className="flex items-center space-x-6">
              <a className="hover:text-cyan-400 transition" href="#telemetry">TELEMETRY</a>
              <a className="hover:text-cyan-400 transition" href="#privacy">PRIVACY PROTOCOL</a>
              <a className="hover:text-cyan-400 transition" href="#api">API DOCUMENTATION</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
