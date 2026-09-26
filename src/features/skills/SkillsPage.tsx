import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSkillProfile } from '../../hooks/useSkillProfile';
import { mockRoles } from '../../mock/roles';
import { formatConfidence } from '../../lib/utils';
import { SystemFooter } from '../../components/layout/SystemFooter';

const competencyNameMap: Record<string, string> = {
  'comp-dsa': 'DSA',
  'comp-python': 'PYTHON',
  'comp-sql': 'SQL',
  'comp-debugging': 'DEBUGGING',
  'comp-system-design': 'SYSTEM DESIGN',
};

export function SkillsPage() {
  const { data: estimates, isLoading } = useSkillProfile();
  const role = mockRoles[0];

  return (
    <main className="text-white min-h-screen selection:bg-cyan-500 selection:text-black relative flex flex-col justify-between">
      <div className="max-w-[1720px] mx-auto w-full px-4 lg:px-8 py-10 space-y-10">
        {/* Page Header */}
        <div className="glass-panel p-8 sm:p-10 rounded-lg border-t-2 border-t-cyan-400 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse rounded-full" />
                <span>SKILL PROFILE // TELEMETRY RECAP</span>
              </div>
              <h1 className="font-headline text-4xl sm:text-6xl uppercase tracking-tighter text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                SKILL<br />PROFILE
              </h1>
            </div>
            <div className="flex flex-col md:items-end font-mono text-xs space-y-1.5 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <span className="text-slate-400 uppercase tracking-widest text-[10px]">TARGET ROLE</span>
              <span className="font-bold text-white text-sm tracking-wider">
                {role.title.toUpperCase()}
              </span>
              <span className="text-cyan-400 font-semibold">
                3 ADAPTIVE SESSIONS RECORDED
              </span>
            </div>
          </div>
        </div>

        {/* Competency Estimates Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/15 pb-2 font-mono">
            <span className="text-cyan-400 font-bold text-sm tracking-wider">01</span>
            <h2 className="text-white font-tech font-bold text-sm uppercase tracking-widest">
              CURRENT IRT ABILITY ESTIMATES <span className="text-slate-500 text-xs font-normal">— 5 DIMENSIONS TRACKED</span>
            </h2>
          </div>

          <div className="glass-panel p-6 rounded-lg space-y-6">
            {isLoading ? (
              <div className="text-center py-8 font-mono text-cyan-400 animate-pulse text-xs tracking-widest">
                FETCHING TELEMETRY RECORDS...
              </div>
            ) : (
              <div className="space-y-5">
                {estimates?.map((est, i) => {
                  const name = competencyNameMap[est.competencyId] ?? est.competencyId;
                  const req = role.requirements.find((r) => r.competencyId === est.competencyId);
                  const targetLevel = req?.targetLevel ?? 70;
                  const gap = est.score - targetLevel;
                  const isExceeding = gap >= 0;
                  const isCritical = gap < -15;

                  return (
                    <motion.div
                      key={est.competencyId}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="glass-card-interactive p-4 sm:p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono"
                    >
                      <div className="w-full md:w-48 shrink-0">
                        <div className="font-tech font-bold text-white text-base tracking-wider">
                          {name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          CONF: <strong className="text-cyan-300">{formatConfidence(est.confidence)}</strong>
                        </div>
                      </div>

                      {/* Visual gauge bar */}
                      <div className="flex-1 w-full space-y-1">
                        <div className="relative w-full h-4 bg-black/50 border border-white/20 rounded overflow-hidden">
                          {/* Target line */}
                          <div
                            className="absolute top-0 bottom-0 w-[2px] bg-white z-20 shadow-[0_0_4px_#FFF]"
                            style={{ left: `${targetLevel}%` }}
                            title={`Target: ${targetLevel}`}
                          />
                          {/* Score fill */}
                          <div
                            className={`h-full ${
                              isCritical
                                ? 'bg-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_#00f0ff]'
                            }`}
                            style={{ width: `${est.score}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>SCORE: <strong className="text-white">{est.score}</strong></span>
                          <span>TARGET: <strong className="text-white">{targetLevel}</strong></span>
                        </div>
                      </div>

                      {/* Delta status badge */}
                      <div className="text-right md:w-36 shrink-0">
                        <span
                          className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase rounded border ${
                            isExceeding
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-glow-cyan-sm'
                              : isCritical
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                              : 'bg-slate-800 text-slate-300 border-white/10'
                          }`}
                        >
                          {gap > 0 ? `+${gap} ABOVE` : `${gap} GAP`}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Gap Analysis & Action CTAs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/15 pb-2 font-mono">
            <span className="text-cyan-400 font-bold text-sm tracking-wider">02</span>
            <h2 className="text-white font-tech font-bold text-sm uppercase tracking-widest">
              GAP ANALYSIS &amp; ACTIONABLE CALIBRATION
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-lg space-y-4 font-mono">
              <h3 className="font-tech text-base font-bold text-white uppercase tracking-wider text-cyan-300">
                RECOMMENDED FOCUS AREAS
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The IRT psychometric model indicates your highest ROI calibration is in <strong className="text-white">Debugging</strong> and <strong className="text-white">System Design</strong>. Closing these deltas will align your profile with standard Junior Software Engineer baselines.
              </p>
              <div className="pt-4 border-t border-white/10 flex gap-4">
                <Link to="/assess" className="btn-brutal-primary px-6 py-3 text-xs w-full sm:w-auto text-center">
                  CALIBRATE GAPS →
                </Link>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-lg space-y-4 font-mono">
              <h3 className="font-tech text-base font-bold text-white uppercase tracking-wider text-cyan-300">
                ENGINE BENCHMARK PROTOCOL
              </h3>
              <div className="text-xs text-slate-300 space-y-2">
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span>DISCRIMINATION PARAM (a):</span>
                  <span className="text-white font-bold">1.45 [HIGH]</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span>UNCERTAINTY INTERVAL (SE):</span>
                  <span className="text-white font-bold">± 0.28</span>
                </div>
                <div className="flex justify-between">
                  <span>TEST RELIABILITY:</span>
                  <span className="text-emerald-400 font-bold">0.91 [CRONBACH α]</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <SystemFooter />
    </main>
  );
}
