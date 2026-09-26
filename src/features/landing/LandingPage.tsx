import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTargetRoles } from '../../hooks/useAssessment';

export function LandingPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [liveScore, setLiveScore] = useState(72);

  // Dynamic live ticker on estimate score to simulate active IRT calibration (from Stitch)
  useEffect(() => {
    const timer = setInterval(() => {
      const base = 72;
      const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
      setLiveScore(base + delta);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Fetch roles if available
  const { data: roles } = useTargetRoles();
  const primaryRole = roles?.[0];

  return (
    <main className="text-white min-h-screen selection:bg-cyan-500 selection:text-black relative">
      {/* BEGIN: HeroSection */}
      <section className="max-w-[1720px] mx-auto border-b border-glass">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[720px]">
          {/* Left Hero Column: Headline, Narrative & Primary Actions */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-glass bg-slate-950/30 backdrop-blur-2xl">
            <div>
              {/* Technical Tag Identifier */}
              <div className="font-mono text-xs uppercase tracking-widest text-cyan-400 mb-6 flex items-center gap-2">
                <span className="inline-block w-8 h-[2px] bg-cyan-400"></span>
                ADAPTIVE ASSESSMENT ENGINE / V0.1
              </div>
              {/* Main Punchy Brutalist Headline */}
              <h1 className="font-headline text-5xl sm:text-7xl xl:text-8xl uppercase tracking-tighter leading-[0.92] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)] mb-8">
                KNOW<br />WHERE<br />YOU STAND.
              </h1>
              {/* Explanatory Narrative */}
              <p className="font-body text-lg sm:text-xl text-neutral-200 max-w-xl leading-relaxed mb-10">
                An adaptive voice assessment that measures demonstrated ability against the role you're trying to reach.
              </p>
              {/* Dual Action CTAs */}
              <div className="flex flex-wrap items-center gap-4 mb-16">
                <button
                  onClick={() => navigate('/assess')}
                  className="btn-brutal-primary px-8 py-4 text-base"
                  type="button"
                >
                  BEGIN ASSESSMENT →
                </button>
                <button
                  onClick={() => navigate('/skills')}
                  className="btn-brutal-secondary px-8 py-4 text-base"
                  type="button"
                >
                  VIEW PROFILE
                </button>
              </div>
            </div>
            {/* Bottom Engine Stats Grid */}
            <div className="grid grid-cols-3 border-t border-glass pt-6 gap-4 font-mono">
              <div className="pr-4 border-r border-glass">
                <span className="block text-3xl sm:text-4xl font-headline text-white">5+</span>
                <span className="text-xs uppercase text-cyan-300 font-bold tracking-wider">COMPETENCIES</span>
              </div>
              <div className="px-2 sm:px-4 border-r border-glass">
                <span className="block text-3xl sm:text-4xl font-headline text-white">IRT</span>
                <span className="text-xs uppercase text-cyan-300 font-bold tracking-wider">ENGINE</span>
              </div>
              <div className="pl-2 sm:pl-4">
                <span className="block text-3xl sm:text-4xl font-headline text-white">∞</span>
                <span className="text-xs uppercase text-cyan-300 font-bold tracking-wider">ADAPTIVE</span>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Interactive Adaptive IRT Graph & Real-time Tree */}
          <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between bg-slate-900/35 backdrop-blur-2xl relative overflow-hidden" data-purpose="irt-visual-container">
            {/* System Status Bar */}
            <div className="flex items-center justify-between border-b border-glass pb-4 font-mono text-xs">
              <div className="uppercase tracking-widest text-neutral-300 font-bold">
                ASSESSMENT ENGINE
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-hyperBlue rounded-none animate-signal inline-block"></span>
                <span className="text-hyperBlue font-bold uppercase drop-shadow-[0_0_8px_#38BDF8]">
                  STATE / ADAPTIVE
                </span>
              </div>
            </div>

            {/* Visual Node Canvas / SVG Graph */}
            <div className="py-8 relative min-h-[380px] flex items-center justify-center">
              <svg className="w-full h-full max-h-[380px]" fill="none" viewBox="0 0 500 360" xmlns="http://www.w3.org/2000/svg">
                {/* Grid background tick marks */}
                <line stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2" strokeWidth="1" x1="20" x2="480" y1="180" y2="180" />
                <line stroke="rgba(255,255,255,0.1)" strokeDasharray="2 2" strokeWidth="1" x1="250" x2="250" y1="20" y2="340" />

                {/* Branching IRT lines with animated beam-flow */}
                <path d="M 250 40 L 250 110" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                <path className="flow-line" d="M 250 110 L 130 220" stroke="#38BDF8" strokeWidth="2" />
                <path d="M 250 110 L 370 220" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
                <path d="M 370 220 L 320 310" stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" strokeWidth="1.5" />
                <path d="M 370 220 L 420 310" stroke="#38BDF8" strokeWidth="2" />

                {/* Active Search Node (Blue Root) */}
                <rect fill="#38BDF8" filter="drop-shadow(0 0 6px #38BDF8)" height="16" stroke="#FFFFFF" strokeWidth="2" width="16" x="242" y="32" />

                {/* Foundational Node Q01 */}
                <g transform="translate(210, 95)">
                  <rect fill="rgba(15, 23, 42, 0.85)" height="30" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" width="80" x="0" y="0" />
                  <text fill="#FFFFFF" fontFamily="'Space Mono'" fontSize="9" fontWeight="bold" textAnchor="middle" x="40" y="16">Q01</text>
                  <text fill="#94A3B8" fontFamily="'Space Mono'" fontSize="6" textAnchor="middle" x="40" y="24">FOUNDATIONAL</text>
                </g>

                {/* Node Q02 (Easy Branch) */}
                <g transform="translate(90, 205)">
                  <rect fill="rgba(15, 23, 42, 0.85)" height="30" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" width="80" x="0" y="0" />
                  <text fill="#FFFFFF" fontFamily="'Space Mono'" fontSize="9" fontWeight="bold" textAnchor="middle" x="40" y="16">Q02</text>
                  <text fill="#94A3B8" fontFamily="'Space Mono'" fontSize="6" textAnchor="middle" x="40" y="24">EASY</text>
                </g>

                {/* Node Q03 (Hard Probe Branch - Active Target) */}
                <g transform="translate(330, 205)">
                  <rect fill="rgba(56, 189, 248, 0.2)" filter="drop-shadow(0 0 10px rgba(56,189,248,0.4))" height="30" stroke="#38BDF8" strokeWidth="2" width="80" x="0" y="0" />
                  <text fill="#FFFFFF" fontFamily="'Space Mono'" fontSize="9" fontWeight="bold" textAnchor="middle" x="40" y="16">Q03</text>
                  <text fill="#38BDF8" fontFamily="'Space Mono'" fontSize="6" textAnchor="middle" x="40" y="24">HARD [PROBE]</text>
                </g>

                {/* Branch labels */}
                <text fill="#94A3B8" fontFamily="'Space Mono'" fontSize="8" textAnchor="middle" x="170" y="150">struggles</text>
                <text fill="#38BDF8" fontFamily="'Space Mono'" fontSize="8" fontWeight="bold" textAnchor="middle" x="330" y="150">performs well</text>

                {/* Leaf Nodes */}
                <g transform="translate(390, 300)">
                  <rect fill="rgba(15, 23, 42, 0.85)" height="24" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" width="60" x="0" y="0" />
                  <text fill="#FFFFFF" fontFamily="'Space Mono'" fontSize="8" textAnchor="middle" x="30" y="15">Q04 (EST)</text>
                </g>
              </svg>
            </div>

            {/* Bottom Telemetry Readout */}
            <div className="border-t border-glass pt-4 grid grid-cols-2 gap-4 font-mono text-xs">
              <div className="border-r border-glass pr-2">
                <span className="text-neutral-400 block uppercase">QUESTION</span>
                <span className="text-xl font-headline block text-white">04 / 10</span>
                <span className="text-[10px] text-neutral-300 uppercase block mt-1">
                  SEARCHING: <strong className="text-cyan-300">MED → HARD</strong>
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block uppercase">CURRENT ESTIMATE</span>
                <span className="text-xl font-headline block text-white" id="live-hero-score">
                  {liveScore}
                </span>
                <span className="text-[10px] text-hyperBlue uppercase block mt-1 font-bold">
                  DIFFICULTY: HARD
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: HeroSection */}

      {/* BEGIN: StepperFlowBar */}
      <section aria-label="Assessment Flow Steps" className="border-b border-glass bg-slate-950/40 backdrop-blur-xl overflow-x-auto">
        <div className="max-w-[1720px] mx-auto min-w-[1100px] grid grid-cols-8 divide-x divide-glass font-mono text-xs">
          {/* Step 01 */}
          <div className="p-4 hover:bg-white/10 transition-colors group cursor-default">
            <span className="block text-hyperBlue group-hover:text-white font-bold mb-1">01</span>
            <span className="font-bold tracking-wider uppercase block text-neutral-300">TARGET</span>
          </div>
          {/* Step 02 */}
          <div className="p-4 hover:bg-white/10 transition-colors group cursor-default">
            <span className="block text-hyperBlue group-hover:text-white font-bold mb-1">02</span>
            <span className="font-bold tracking-wider uppercase block text-neutral-300">COMPETENCY MAP</span>
          </div>
          {/* Step 03 */}
          <div className="p-4 hover:bg-white/10 transition-colors group cursor-default">
            <span className="block text-hyperBlue group-hover:text-white font-bold mb-1">03</span>
            <span className="font-bold tracking-wider uppercase block text-neutral-300">ASSESSMENT</span>
          </div>
          {/* Step 04 */}
          <div className="p-4 hover:bg-white/10 transition-colors group cursor-default">
            <span className="block text-hyperBlue group-hover:text-white font-bold mb-1">04</span>
            <span className="font-bold tracking-wider uppercase block text-neutral-300">EVIDENCE</span>
          </div>
          {/* Step 05 - Active Highlighted Step */}
          <div className="p-4 bg-cyan-500/20 border-b-2 border-cyan-400 text-white cursor-default shadow-[inset_0_0_15px_rgba(56,189,248,0.25)]">
            <div className="flex items-center justify-between">
              <span className="text-hyperBlue font-bold mb-1">05</span>
              <span className="w-1.5 h-1.5 bg-hyperBlue shadow-[0_0_6px_#38BDF8]"></span>
            </div>
            <span className="font-bold tracking-wider uppercase block text-white">SKILL ESTIMATE</span>
          </div>
          {/* Step 06 */}
          <div className="p-4 hover:bg-white/10 transition-colors group cursor-default">
            <span className="block text-hyperBlue group-hover:text-white font-bold mb-1">06</span>
            <span className="font-bold tracking-wider uppercase block text-neutral-300">GAP ANALYSIS</span>
          </div>
          {/* Step 07 */}
          <div className="p-4 hover:bg-white/10 transition-colors group cursor-default">
            <span className="block text-hyperBlue group-hover:text-white font-bold mb-1">07</span>
            <span className="font-bold tracking-wider uppercase block text-neutral-300">IMPROVEMENT</span>
          </div>
          {/* Step 08 */}
          <div className="p-4 hover:bg-white/10 transition-colors group cursor-default">
            <span className="block text-hyperBlue group-hover:text-white font-bold mb-1">08</span>
            <span className="font-bold tracking-wider uppercase block text-neutral-300">REASSESS</span>
          </div>
        </div>
      </section>
      {/* END: StepperFlowBar */}

      {/* BEGIN: SkillModelSection */}
      <section className="max-w-[1720px] mx-auto border-b border-glass py-16 px-6 sm:px-10 lg:px-16" id="skill-model">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Left: Headline & Explanation */}
          <div className="lg:col-span-6">
            <div className="font-mono text-xs uppercase tracking-widest text-cyan-400 mb-4 flex items-center gap-2">
              <span className="inline-block w-6 h-[2px] bg-cyan-400"></span>
              THE SKILL MODEL
            </div>
            <h2 className="font-headline text-4xl sm:text-6xl uppercase tracking-tighter mb-6 leading-none text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
              NOT A SCORE.<br />A MAP OF ABILITY.
            </h2>
            <p className="font-body text-lg text-neutral-200 max-w-lg leading-relaxed mb-8">
              Each competency is estimated independently with a confidence score. The system tracks your evolution across multiple sessions and identifies exactly where the gap is — not just whether you passed.
            </p>
            {/* Metric definitions in brutalist cards */}
            <div className="grid grid-cols-2 gap-4 glass-card p-6 font-mono text-xs">
              <div>
                <span className="font-bold block uppercase text-cyan-300">ESTIMATE</span>
                <span className="text-neutral-300 block mt-1">Per-competency score (IRT calibrated)</span>
              </div>
              <div>
                <span className="font-bold block uppercase text-cyan-300">CONFIDENCE</span>
                <span className="text-neutral-300 block mt-1">Evidence volume and quality metric</span>
              </div>
              <div className="pt-4 border-t border-glass">
                <span className="font-bold block uppercase text-cyan-300">TARGET</span>
                <span className="text-neutral-300 block mt-1">Direct role baseline requirement</span>
              </div>
              <div className="pt-4 border-t border-glass">
                <span className="font-bold block uppercase text-cyan-300">GAP</span>
                <span className="text-neutral-300 block mt-1">Exact quantitative ability delta</span>
              </div>
            </div>
          </div>

          {/* Right: Role Context & Live Competency Gauge Stack */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            {/* Role context header */}
            <div className="flex items-center justify-between glass-card p-4 mb-8 font-mono text-xs">
              <div>
                <span className="text-neutral-400 uppercase block">TARGET BENCHMARK:</span>
                <span className="font-bold uppercase text-white text-sm">
                  {primaryRole?.title?.toUpperCase() ?? 'JUNIOR SOFTWARE ENGINEER'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-400 uppercase block">CURRENT SESSION:</span>
                <span className="font-bold uppercase text-hyperBlue text-sm">SESSION 03 / ACTIVE</span>
              </div>
            </div>

            {/* Gauges List */}
            <div className="space-y-6" data-purpose="competency-bars-container">
              {/* Gauge 1: DSA (Exceeding target) */}
              <div className="glass-card p-4 hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-baseline mb-2 font-mono">
                  <span className="font-bold uppercase tracking-wider text-sm text-white">DSA</span>
                  <div className="text-right">
                    <span className="text-3xl font-headline text-white">78</span>
                    <span className="text-xs text-neutral-400 ml-2">TARGET 72</span>
                  </div>
                </div>
                <div className="relative w-full h-5 bg-black/40 border border-white/20 mb-2 overflow-hidden">
                  <div className="absolute top-0 bottom-0 w-[2px] bg-white z-20 shadow-[0_0_4px_#FFF]" style={{ left: '72%' }} />
                  <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.5)] border-r-2 border-white" style={{ width: '78%' }} />
                </div>
                <div className="flex justify-between font-mono text-xs text-neutral-300">
                  <span>CONF: <strong className="text-white">0.89</strong></span>
                  <span className="text-hyperBlue font-bold">+6 ABOVE TARGET</span>
                </div>
              </div>

              {/* Gauge 2: PYTHON (Slight gap) */}
              <div className="glass-card p-4 hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-baseline mb-2 font-mono">
                  <span className="font-bold uppercase tracking-wider text-sm text-white">PYTHON</span>
                  <div className="text-right">
                    <span className="text-3xl font-headline text-white">71</span>
                    <span className="text-xs text-neutral-400 ml-2">TARGET 74</span>
                  </div>
                </div>
                <div className="relative w-full h-5 bg-black/40 border border-white/20 mb-2 overflow-hidden">
                  <div className="absolute top-0 bottom-0 w-[2px] bg-white z-20 shadow-[0_0_4px_#FFF]" style={{ left: '74%' }} />
                  <div className="h-full bg-cyan-700/80 border-r-2 border-cyan-400" style={{ width: '71%' }} />
                </div>
                <div className="flex justify-between font-mono text-xs text-neutral-300">
                  <span>CONF: <strong className="text-white">0.84</strong></span>
                  <span className="text-neutral-400 font-bold">-3 GAP</span>
                </div>
              </div>

              {/* Gauge 3: SQL (Boundary indicator) */}
              <div className="glass-card p-4 hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-baseline mb-2 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-wider text-sm text-white">SQL</span>
                    <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-1.5 py-0.5 text-[10px] font-mono tracking-widest font-bold">
                      BOUNDARY
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-headline text-white">63</span>
                    <span className="text-xs text-neutral-400 ml-2">TARGET 68</span>
                  </div>
                </div>
                <div className="relative w-full h-5 bg-black/40 border border-white/20 mb-2 overflow-hidden">
                  <div className="absolute top-0 bottom-0 w-[2px] bg-white z-20 shadow-[0_0_4px_#FFF]" style={{ left: '68%' }} />
                  <div className="h-full bg-cyan-800/80 border-r-2 border-cyan-400" style={{ width: '63%' }} />
                </div>
                <div className="flex justify-between font-mono text-xs text-neutral-300">
                  <span>CONF: <strong className="text-white">0.76</strong></span>
                  <span className="text-neutral-400 font-bold">-5 GAP</span>
                </div>
              </div>

              {/* Gauge 4: DEBUGGING (Critical gap) */}
              <div className="glass-card p-4 hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-baseline mb-2 font-mono">
                  <span className="font-bold uppercase tracking-wider text-sm text-white">DEBUGGING</span>
                  <div className="text-right">
                    <span className="text-3xl font-headline text-white">46</span>
                    <span className="text-xs text-neutral-400 ml-2">TARGET 74</span>
                  </div>
                </div>
                <div className="relative w-full h-5 bg-black/40 border border-white/20 mb-2 overflow-hidden">
                  <div className="absolute top-0 bottom-0 w-[2px] bg-white z-20 shadow-[0_0_4px_#FFF]" style={{ left: '74%' }} />
                  <div className="h-full bg-cyan-900/80 border-r-2 border-cyan-400" style={{ width: '46%' }} />
                </div>
                <div className="flex justify-between font-mono text-xs text-neutral-300">
                  <span>CONF: <strong className="text-white">0.71</strong></span>
                  <span className="text-amber-400 font-bold">-28 CRITICAL GAP</span>
                </div>
              </div>

              {/* Gauge 5: SYSTEM DESIGN */}
              <div className="glass-card p-4 hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-baseline mb-2 font-mono">
                  <span className="font-bold uppercase tracking-wider text-sm text-white">SYSTEM DESIGN</span>
                  <div className="text-right">
                    <span className="text-3xl font-headline text-white">39</span>
                    <span className="text-xs text-neutral-400 ml-2">TARGET 55</span>
                  </div>
                </div>
                <div className="relative w-full h-5 bg-black/40 border border-white/20 mb-2 overflow-hidden">
                  <div className="absolute top-0 bottom-0 w-[2px] bg-white z-20 shadow-[0_0_4px_#FFF]" style={{ left: '55%' }} />
                  <div className="h-full bg-cyan-950/90 border-r-2 border-cyan-400" style={{ width: '39%' }} />
                </div>
                <div className="flex justify-between font-mono text-xs text-neutral-300">
                  <span>CONF: <strong className="text-white">0.57</strong></span>
                  <span className="text-neutral-400 font-bold">-16 GAP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* END: SkillModelSection */}

      {/* BEGIN: HowItWorksInvertedSection */}
      <section className="text-white py-20 px-6 sm:px-10 lg:px-16 border-b border-glass bg-slate-950/40 backdrop-blur-2xl" id="pipeline">
        <div className="max-w-[1720px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Philosophy & Waveform Widget */}
            <div className="lg:col-span-6">
              <div className="font-mono text-xs uppercase tracking-widest text-cyan-400 mb-6 flex items-center gap-2">
                <span className="inline-block w-8 h-[2px] bg-cyan-400"></span>
                HOW IT WORKS
              </div>
              <h2 className="font-headline text-4xl sm:text-6xl xl:text-7xl uppercase tracking-tighter leading-none mb-8 text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                THE SYSTEM<br />FINDS YOUR<br />BOUNDARY.
              </h2>
              <p className="font-body text-lg text-neutral-200 max-w-lg leading-relaxed mb-10">
                Like a psychometric instrument, the adaptive engine continuously narrows in on the boundary between what you can and cannot reliably do — then measures the gap against your target role.
              </p>
              <div className="mb-12">
                <button
                  onClick={() => navigate('/assess')}
                  className="btn-brutal-inverted px-8 py-4 text-base"
                  type="button"
                >
                  START YOUR ASSESSMENT →
                </button>
              </div>

              {/* Voice waveform visualizer widget */}
              <div className="glass-card p-6 font-mono">
                <div className="text-xs uppercase text-neutral-400 mb-3 flex items-center justify-between">
                  <span>ACOUSTIC SIGNAL / ACTIVE RECEIVER</span>
                  <span className="text-hyperBlue font-bold">24kHz PCM</span>
                </div>
                <div aria-hidden="true" className="flex items-center gap-1.5 h-10 py-1">
                  <div className="w-1.5 bg-white/70 audio-bar"></div>
                  <div className="w-1.5 bg-white/70 audio-bar"></div>
                  <div className="w-1.5 bg-white/70 audio-bar"></div>
                  <div className="w-1.5 bg-white/70 audio-bar"></div>
                  <div className="w-1.5 bg-white/70 audio-bar"></div>
                  <div className="w-1.5 bg-white/70 audio-bar"></div>
                  <div className="w-1.5 bg-hyperBlue audio-bar shadow-[0_0_8px_#38BDF8]"></div>
                  <div className="w-1.5 bg-hyperBlue audio-bar shadow-[0_0_8px_#38BDF8]"></div>
                  <div className="w-1.5 bg-white/70 audio-bar"></div>
                  <div className="w-1.5 bg-white/70 audio-bar"></div>
                  <div className="w-1.5 bg-white/70 audio-bar"></div>
                  <div className="w-1.5 bg-white/70 audio-bar"></div>
                  <div className="w-1.5 bg-white/70 audio-bar"></div>
                </div>
              </div>
            </div>

            {/* Right Column: Pipeline Sequence */}
            <div className="lg:col-span-6 glass-card p-6 sm:p-10 font-mono">
              <div className="text-xs text-neutral-400 uppercase tracking-widest pb-4 border-b border-white/15 mb-6 flex justify-between">
                <span>PIPELINE ARCHITECTURE</span>
                <span className="text-cyan-300">STATE: STREAMING</span>
              </div>
              <ol className="space-y-6 relative">
                <li className="flex items-start gap-4 group">
                  <div className="w-6 h-6 border border-white/40 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-white group-hover:text-black transition-colors backdrop-blur-sm">
                    01
                  </div>
                  <div>
                    <h3 className="font-headline text-lg sm:text-xl uppercase tracking-wider text-white">MICROPHONE</h3>
                    <p className="font-body text-sm text-neutral-300 mt-0.5">Audio capture &amp; noise suppression filter</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 group">
                  <div className="w-6 h-6 border border-white/40 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-white group-hover:text-black transition-colors backdrop-blur-sm">
                    02
                  </div>
                  <div>
                    <h3 className="font-headline text-lg sm:text-xl uppercase tracking-wider text-white">SPEECH TO TEXT</h3>
                    <p className="font-body text-sm text-neutral-300 mt-0.5">Real-time phonetic transcript generation</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 group">
                  <div className="w-6 h-6 border border-white/40 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-white group-hover:text-black transition-colors backdrop-blur-sm">
                    03
                  </div>
                  <div>
                    <h3 className="font-headline text-lg sm:text-xl uppercase tracking-wider text-white">ANSWER EVALUATION</h3>
                    <p className="font-body text-sm text-neutral-300 mt-0.5">Concept coverage &amp; technical reasoning extraction</p>
                  </div>
                </li>
                {/* Active Highlight */}
                <li className="flex items-start gap-4 bg-cyan-950/40 p-4 border border-hyperBlue shadow-[0_0_15px_rgba(56,189,248,0.25)]">
                  <div className="w-6 h-6 bg-hyperBlue text-black flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-[0_0_8px_#38BDF8]">
                    04
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline text-lg sm:text-xl uppercase tracking-wider text-hyperBlue">ADAPTIVE ENGINE</h3>
                      <span className="w-2 h-2 bg-hyperBlue animate-signal"></span>
                    </div>
                    <p className="font-body text-sm text-neutral-100 mt-0.5">IRT maximum information item selection algorithm</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 group">
                  <div className="w-6 h-6 border border-white/40 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-white group-hover:text-black transition-colors backdrop-blur-sm">
                    05
                  </div>
                  <div>
                    <h3 className="font-headline text-lg sm:text-xl uppercase tracking-wider text-white">SKILL ESTIMATE</h3>
                    <p className="font-body text-sm text-neutral-300 mt-0.5">Continuous theta re-estimation with uncertainty bounds</p>
                  </div>
                </li>
                <li className="flex items-start gap-4 group">
                  <div className="w-6 h-6 border border-white/40 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-white group-hover:text-black transition-colors backdrop-blur-sm">
                    06
                  </div>
                  <div>
                    <h3 className="font-headline text-lg sm:text-xl uppercase tracking-wider text-white">TEXT TO SPEECH</h3>
                    <p className="font-body text-sm text-neutral-300 mt-0.5">Low-latency synthetic voice probe delivery</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>
      {/* END: HowItWorksInvertedSection */}

      {/* BEGIN: FinalCTASection */}
      <section className="max-w-[1720px] mx-auto py-24 sm:py-32 px-6 sm:px-10 lg:px-16 border-b border-glass text-center" id="assessment">
        <div className="max-w-4xl mx-auto glass-card p-8 sm:p-16 border-2 border-white/25">
          <span className="font-mono text-xs sm:text-sm uppercase tracking-widest text-cyan-300 mb-4 block font-bold">
            READY TO MEASURE YOUR BOUNDARY?
          </span>
          <h2 className="font-headline text-5xl sm:text-7xl lg:text-8xl uppercase tracking-tighter leading-none mb-10 text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
            ASSESS.<br />IMPROVE.<br />REASSESS.
          </h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              className="btn-brutal-primary px-10 py-5 text-lg w-full sm:w-auto"
              onClick={() => setModalOpen(true)}
              type="button"
            >
              BEGIN ASSESSMENT →
            </button>
          </div>
          <div className="mt-8 font-mono text-xs text-neutral-300 uppercase tracking-widest">
            ESTIMATED RUNTIME: ~12 MINUTES • AUDIO INTERACTION REQUIRED
          </div>
        </div>
      </section>
      {/* END: FinalCTASection */}

      {/* BEGIN: Calibration Simulation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="glass-card max-w-xl w-full p-8 font-mono border-2 border-white/30 relative">
            <div className="flex items-center justify-between border-b border-glass pb-4 mb-6">
              <span className="font-headline text-xl uppercase text-white">CALIBRATING ENGINE</span>
              <button
                className="text-xl font-bold font-mono px-2 border border-white/30 hover:bg-white hover:text-black transition-colors"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="font-body text-base mb-6 text-neutral-200">
              Connecting to high-frequency audio websocket. Ensure your input device is calibrated and background ambient noise is minimal.
            </p>
            <div className="glass-card-subtle p-4 border border-white/20 mb-6 text-xs space-y-2">
              <div className="flex justify-between">
                <span>CHECK AUDIO DEVICE:</span>
                <span className="text-emerald-400 font-bold">READY</span>
              </div>
              <div className="flex justify-between">
                <span>LATENCY HANDSHAKE:</span>
                <span className="text-hyperBlue font-bold">34ms</span>
              </div>
              <div className="flex justify-between">
                <span>ITEM SEED DIFFICULTY:</span>
                <span className="font-bold text-white">THETA 0.0</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="btn-brutal-secondary px-6 py-2.5 text-xs"
                onClick={() => setModalOpen(false)}
              >
                CANCEL
              </button>
              <button
                className="btn-brutal-primary px-6 py-2.5 text-xs"
                onClick={() => {
                  setModalOpen(false);
                  navigate('/assess');
                }}
              >
                COMMENCE TEST →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BEGIN: Footer */}
      <footer className="text-white font-mono text-xs border-t border-glass bg-slate-950/60 backdrop-blur-xl" id="telemetry">
        <div className="max-w-[1720px] mx-auto p-6 sm:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-8 border-b border-glass uppercase">
            <div>
              <span className="text-neutral-400 block mb-1">SYSTEM LATENCY</span>
              <span className="font-bold text-white text-sm">180ms [P99]</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-1">PSYCHOMETRIC MODEL</span>
              <span className="font-bold text-white text-sm">IRT 3-PARAMETER</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-1">INTERVIEW ENGINE</span>
              <span className="font-bold text-white text-sm">VOICE-STREAM V2</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-1">SYSTEM STATUS</span>
              <span className="font-bold text-hyperBlue text-sm flex items-center gap-1.5 drop-shadow-[0_0_6px_#38BDF8]">
                <span className="w-2 h-2 bg-hyperBlue inline-block shadow-[0_0_6px_#38BDF8]"></span>
                ALL ENGINES ONLINE
              </span>
            </div>
          </div>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-headline text-lg text-white">ADAPTIVE</span>
              <span className="text-neutral-400">© 2025 ADAPTIVE ASSESSMENT SYSTEMS INC. RAW BLOCK ARCHITECTURE.</span>
            </div>
            <div className="flex items-center gap-6 underline font-bold uppercase text-neutral-300">
              <a className="hover:text-hyperBlue" href="#telemetry">TELEMETRY</a>
              <a className="hover:text-hyperBlue" href="#privacy">PRIVACY PROTOCOL</a>
              <a className="hover:text-hyperBlue" href="#api">API DOCUMENTATION</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
