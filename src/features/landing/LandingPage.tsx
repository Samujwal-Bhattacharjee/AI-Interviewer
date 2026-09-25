import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { AdaptivePathDiagram } from '../../components/charts/AdaptivePathDiagram';
import { SystemFooter } from '../../components/layout/SystemFooter';
import { useTargetRoles } from '../../hooks/useAssessment';

const processSteps = [
  { num: '01', label: 'TARGET' },
  { num: '02', label: 'COMPETENCY MAP' },
  { num: '03', label: 'ASSESSMENT' },
  { num: '04', label: 'EVIDENCE' },
  { num: '05', label: 'SKILL ESTIMATE', active: true },
  { num: '06', label: 'GAP ANALYSIS' },
  { num: '07', label: 'IMPROVEMENT' },
  { num: '08', label: 'REASSESS' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const skillsRef = useRef<HTMLDivElement>(null);
  const skillsInView = useInView(skillsRef, { once: true, margin: '-60px' });

  // Load real target role from backend
  const { data: roles } = useTargetRoles();
  const primaryRole = roles?.[0]; // Junior Software Engineer

  // Competency display using real backend data if available, with calibrated defaults
  const competencies = primaryRole?.competencies?.length
    ? primaryRole.competencies.map((c) => {
        const req = primaryRole.requirements.find((r) => r.competencyId === c.id);
        const target = req?.targetLevel ?? 70;
        // Default demo scores reflecting realistic IRT estimation
        const demoScores: Record<string, { score: number; conf: number; tag?: string }> = {
          'comp-dsa': { score: 78, conf: 0.89 },
          'comp-python': { score: 71, conf: 0.84 },
          'comp-sql': { score: 63, conf: 0.76, tag: 'STRENGTH' },
          'comp-debugging': { score: 46, conf: 0.71 },
          'comp-system-design': { score: 39, conf: 0.57 },
        };
        const demo = demoScores[c.id] ?? { score: Math.round(target * 0.9), conf: 0.8 };
        return {
          id: c.id,
          name: c.name.toUpperCase(),
          score: demo.score,
          target,
          conf: demo.conf,
          tag: demo.tag,
        };
      })
    : [
        { id: '1', name: 'DSA', score: 78, target: 72, conf: 0.89 },
        { id: '2', name: 'PYTHON', score: 71, target: 74, conf: 0.84 },
        { id: '3', name: 'SQL', score: 63, target: 68, conf: 0.76, tag: 'STRENGTH' },
        { id: '4', name: 'DEBUGGING', score: 46, target: 74, conf: 0.71 },
        { id: '5', name: 'SYSTEM DESIGN', score: 39, target: 60, conf: 0.57 },
      ];

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── HERO SECTION ── */}
      <section
        style={{
          borderBottom: '1px solid #000000',
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            minHeight: 'calc(100vh - 52px)',
          }}
        >
          {/* Left Column — Editorial Typography */}
          <div
            style={{
              padding: '64px 48px 48px',
              borderRight: '1px solid #000000',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#555555',
                  marginBottom: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>—</span> ADAPTIVE ASSESSMENT ENGINE / V0.1
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{
                  fontFamily: 'var(--f-sans)',
                  fontSize: 'clamp(56px, 6.5vw, 92px)',
                  fontWeight: 900,
                  lineHeight: 0.94,
                  letterSpacing: '-0.04em',
                  color: '#000000',
                  textTransform: 'uppercase',
                  margin: '0 0 28px 0',
                }}
              >
                KNOW<br />WHERE<br />YOU STAND.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{
                  fontFamily: 'var(--f-sans)',
                  fontSize: '16px',
                  lineHeight: 1.6,
                  color: '#333333',
                  maxWidth: '460px',
                  marginBottom: '36px',
                }}
              >
                An adaptive voice assessment that measures demonstrated ability against the role you're trying to reach.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}
              >
                <button
                  onClick={() => navigate('/assess')}
                  style={{
                    background: '#000000',
                    color: '#FFFFFF',
                    border: '1px solid #000000',
                    padding: '12px 28px',
                    fontFamily: 'var(--f-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.color = '#000000';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#000000';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                >
                  BEGIN ASSESSMENT →
                </button>

                <button
                  onClick={() => navigate('/skills')}
                  style={{
                    background: '#FFFFFF',
                    color: '#000000',
                    border: '1px solid #000000',
                    padding: '12px 28px',
                    fontFamily: 'var(--f-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
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
                  VIEW PROFILE
                </button>
              </motion.div>
            </div>

            {/* Bottom 3-Stat Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                borderTop: '1px solid #000000',
                paddingTop: '28px',
                marginTop: '48px',
              }}
            >
              <div style={{ borderRight: '1px solid #000000', paddingRight: '20px' }}>
                <div style={{ fontFamily: 'var(--f-sans)', fontSize: '32px', fontWeight: 900, color: '#000000', lineHeight: 1 }}>
                  5+
                </div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', letterSpacing: '0.16em', color: '#666666', marginTop: '6px', textTransform: 'uppercase' }}>
                  COMPETENCIES
                </div>
              </div>

              <div style={{ borderRight: '1px solid #000000', padding: '0 20px' }}>
                <div style={{ fontFamily: 'var(--f-sans)', fontSize: '32px', fontWeight: 900, color: '#000000', lineHeight: 1 }}>
                  IRT
                </div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', letterSpacing: '0.16em', color: '#666666', marginTop: '6px', textTransform: 'uppercase' }}>
                  ENGINE
                </div>
              </div>

              <div style={{ paddingLeft: '20px' }}>
                <div style={{ fontFamily: 'var(--f-sans)', fontSize: '32px', fontWeight: 900, color: '#000000', lineHeight: 1 }}>
                  ∞
                </div>
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', letterSpacing: '0.16em', color: '#666666', marginTop: '6px', textTransform: 'uppercase' }}>
                  ADAPTIVE
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Blueprint Path Diagram & Telemetry */}
          <div
            style={{
              padding: '36px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Header Box */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #000000',
                  fontFamily: 'var(--f-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ fontWeight: 600, color: '#000000' }}>ASSESSMENT SYSTEM</span>
                <span style={{ color: '#0047FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#0047FF' }} />
                  STATE / ADAPTIVE
                </span>
              </div>

              {/* Diagram */}
              <div style={{ padding: '24px 0 16px' }}>
                <AdaptivePathDiagram />
              </div>
            </div>

            {/* Bottom Metrics Box */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                borderTop: '1px solid #000000',
                paddingTop: '20px',
                fontFamily: 'var(--f-mono)',
              }}
            >
              <div style={{ borderRight: '1px solid #000000', paddingRight: '20px' }}>
                <div style={{ fontSize: '9px', color: '#666666', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  QUESTION
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#000000', marginTop: '2px' }}>
                  04 / 10
                </div>
                <div style={{ fontSize: '9px', color: '#666666', marginTop: '4px', letterSpacing: '0.08em' }}>
                  SEARCHING: MED → HARD
                </div>
              </div>

              <div style={{ paddingLeft: '20px' }}>
                <div style={{ fontSize: '9px', color: '#666666', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  CURRENT ESTIMATE
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#000000', marginTop: '2px' }}>
                  73
                </div>
                <div style={{ fontSize: '9px', color: '#0047FF', fontWeight: 600, marginTop: '4px', letterSpacing: '0.08em' }}>
                  ESTIMATED: ±12
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS STRIP (8 STEPS) ── */}
      <section style={{ borderBottom: '1px solid #000000', background: '#FFFFFF' }}>
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            fontFamily: 'var(--f-mono)',
            fontSize: '10px',
          }}
        >
          {processSteps.map((step, idx) => (
            <div
              key={step.num}
              style={{
                padding: '14px 12px',
                borderRight: idx < 7 ? '1px solid #000000' : 'none',
                background: step.active ? '#000000' : 'transparent',
                color: step.active ? '#FFFFFF' : '#000000',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: step.active ? '#0047FF' : '#666666', fontWeight: 700, fontSize: '9px' }}>
                {step.num}
              </span>
              <span style={{ fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── NOT A SCORE. A MAP OF ABILITY. ── */}
      <section style={{ borderBottom: '1px solid #000000', background: '#FFFFFF' }} ref={skillsRef}>
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
          }}
        >
          {/* Left Column */}
          <div
            style={{
              padding: '64px 48px',
              borderRight: '1px solid #000000',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#666666',
                  marginBottom: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>—</span> THE SKILL MODEL
              </div>

              <h2
                style={{
                  fontFamily: 'var(--f-sans)',
                  fontSize: 'clamp(44px, 5vw, 68px)',
                  fontWeight: 900,
                  lineHeight: 0.96,
                  letterSpacing: '-0.03em',
                  color: '#000000',
                  textTransform: 'uppercase',
                  margin: '0 0 24px 0',
                }}
              >
                NOT A SCORE.<br />A MAP OF<br />ABILITY.
              </h2>

              <p
                style={{
                  fontFamily: 'var(--f-sans)',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  color: '#333333',
                  maxWidth: '460px',
                  marginBottom: '40px',
                }}
              >
                Each competency is estimated independently with a confidence score. The system tracks your evolution across multiple sessions and identifies exactly where the gap is — not just whether you passed.
              </p>

              {/* 4 Parameter Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1px',
                  background: '#000000',
                  border: '1px solid #000000',
                }}
              >
                <div style={{ background: '#FFFFFF', padding: '16px' }}>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', color: '#666666' }}>
                    ESTIMATE
                  </div>
                  <div style={{ fontFamily: 'var(--f-sans)', fontSize: '11px', color: '#333333', marginTop: '4px' }}>
                    Per-competency score (IRT calibrated)
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '16px' }}>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', color: '#666666' }}>
                    EVIDENCE
                  </div>
                  <div style={{ fontFamily: 'var(--f-sans)', fontSize: '11px', color: '#333333', marginTop: '4px' }}>
                    Evidence volume and quality metric
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '16px' }}>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', color: '#666666' }}>
                    TARGET
                  </div>
                  <div style={{ fontFamily: 'var(--f-sans)', fontSize: '11px', color: '#333333', marginTop: '4px' }}>
                    Direct role baseline requirement
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', padding: '16px' }}>
                  <div style={{ fontFamily: 'var(--f-mono)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', color: '#666666' }}>
                    GAP
                  </div>
                  <div style={{ fontFamily: 'var(--f-sans)', fontSize: '11px', color: '#333333', marginTop: '4px' }}>
                    True quantitative ability delta
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 5 Competency Skill Bars */}
          <div style={{ padding: '48px 40px' }}>
            {/* Header info */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                border: '1px solid #000000',
                marginBottom: '20px',
                fontFamily: 'var(--f-mono)',
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              <span>
                TARGET BENCHMARK: <strong style={{ color: '#000000' }}>JUNIOR SOFTWARE ENGINEER</strong>
              </span>
              <span style={{ color: '#0047FF', fontWeight: 700 }}>
                SESSION 03 / ACTIVE
              </span>
            </div>

            {/* Skill Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {competencies.map((skill, idx) => {
                const diff = skill.score - skill.target;
                const isOver = diff >= 0;
                const isCritical = diff <= -20;

                return (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={skillsInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    style={{
                      border: '1px solid #000000',
                      padding: '14px 16px',
                      background: '#FFFFFF',
                    }}
                  >
                    {/* Top Row: Name + Score + Target */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        marginBottom: '8px',
                        fontFamily: 'var(--f-mono)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#000000', letterSpacing: '0.08em' }}>
                          {skill.name}
                        </span>
                        {skill.tag && (
                          <span
                            style={{
                              background: '#000000',
                              color: '#FFFFFF',
                              fontSize: '8px',
                              padding: '1px 5px',
                              fontWeight: 700,
                              letterSpacing: '0.1em',
                            }}
                          >
                            {skill.tag}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#000000' }}>
                          {skill.score}
                        </span>
                        <span style={{ fontSize: '9px', color: '#777777', letterSpacing: '0.1em' }}>
                          TARGET {skill.target}
                        </span>
                      </div>
                    </div>

                    {/* Bar visualization */}
                    <div
                      style={{
                        height: '14px',
                        background: '#EEEEEE',
                        border: '1px solid #000000',
                        position: 'relative',
                        marginBottom: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Filled Progress */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={skillsInView ? { width: `${skill.score}%` } : { width: 0 }}
                        transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: idx === 0 ? '#0047FF' : '#000000',
                        }}
                      />

                      {/* Target Notch line */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          left: `${skill.target}%`,
                          width: '2px',
                          background: '#FF0000',
                          zIndex: 2,
                        }}
                        title={`Target: ${skill.target}`}
                      />
                    </div>

                    {/* Bottom Metadata */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: 'var(--f-mono)',
                        fontSize: '9px',
                        letterSpacing: '0.12em',
                      }}
                    >
                      <span style={{ color: '#777777' }}>CONF. {skill.conf.toFixed(2)}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: isOver ? '#0047FF' : isCritical ? '#D90429' : '#000000',
                        }}
                      >
                        {isOver ? `+${diff} ABOVE TARGET` : isCritical ? `${diff} CRITICAL GAP` : `${diff} GAP`}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── THE SYSTEM FINDS YOUR BOUNDARY. (DARK SECTION) ── */}
      <section style={{ background: '#000000', color: '#FFFFFF', padding: '80px 0' }}>
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '0 48px',
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: '64px',
            alignItems: 'center',
          }}
        >
          {/* Left Column */}
          <div>
            <div
              style={{
                fontFamily: 'var(--f-mono)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#888888',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>—</span> HOW IT WORKS
            </div>

            <h2
              style={{
                fontFamily: 'var(--f-sans)',
                fontSize: 'clamp(44px, 5.5vw, 72px)',
                fontWeight: 900,
                lineHeight: 0.94,
                letterSpacing: '-0.04em',
                color: '#FFFFFF',
                textTransform: 'uppercase',
                margin: '0 0 28px 0',
              }}
            >
              THE SYSTEM<br />FINDS YOUR<br />BOUNDARY.
            </h2>

            <p
              style={{
                fontFamily: 'var(--f-sans)',
                fontSize: '16px',
                lineHeight: 1.6,
                color: '#AAAAAA',
                maxWidth: '480px',
                marginBottom: '40px',
              }}
            >
              Like a psychometric instrument, the adaptive engine continuously narrows in on the boundary between what you can and cannot reliably do — then measures the gap against your target role.
            </p>

            <button
              onClick={() => navigate('/assess')}
              style={{
                background: '#FFFFFF',
                color: '#000000',
                border: '1px solid #FFFFFF',
                padding: '14px 32px',
                fontFamily: 'var(--f-mono)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: '36px',
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
              START YOUR ASSESSMENT →
            </button>

            {/* Telemetry card */}
            <div
              style={{
                border: '1px solid #333333',
                padding: '16px 20px',
                fontFamily: 'var(--f-mono)',
                fontSize: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                maxWidth: '440px',
              }}
            >
              <span style={{ color: '#888888', letterSpacing: '0.12em' }}>ADAPTIVE ENGINE / ACTIVE SESSION</span>
              <span style={{ color: '#0047FF', fontWeight: 700 }}>CALIB 210</span>
            </div>
          </div>

          {/* Right Column: Pipeline Architecture Box */}
          <div
            style={{
              border: '1px solid #FFFFFF',
              padding: '24px',
              fontFamily: 'var(--f-mono)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid #333333',
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: '20px',
              }}
            >
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>PIPELINE ARCHITECTURE</span>
              <span style={{ color: '#888888' }}>STATE / STREAMING</span>
            </div>

            {/* 6 Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { num: '01', name: 'MICROPHONE', desc: 'Audio capture & noise suppression filter' },
                { num: '02', name: 'SPEECH TO TEXT', desc: 'Real-time phonetic transcript generation' },
                { num: '03', name: 'ANSWER EVALUATION', desc: 'Concept coverage & technical reasoning extraction' },
                {
                  num: '04',
                  name: 'ADAPTIVE ENGINE *',
                  desc: 'IRT maximum information item selection algorithm',
                  highlight: true,
                },
                { num: '05', name: 'SKILL ESTIMATE', desc: 'Continuous theta re-estimation with uncertainty bounds' },
                { num: '06', name: 'TEXT TO SPEECH', desc: 'Low-latency synthetic voice probe delivery' },
              ].map((step) => (
                <div
                  key={step.num}
                  style={{
                    border: step.highlight ? '1px solid #0047FF' : '1px solid #222222',
                    background: step.highlight ? 'rgba(0, 71, 255, 0.08)' : 'transparent',
                    padding: '12px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: step.highlight ? '#0047FF' : '#FFFFFF',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span>[{step.num}]</span>
                    <span>{step.name}</span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#777777', marginTop: '4px', letterSpacing: '0.04em' }}>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ASSESS. IMPROVE. REASSESS. CTA BOX ── */}
      <section style={{ padding: '80px 24px', background: '#FFFFFF' }}>
        <div
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            border: '2px solid #000000',
            padding: '72px 48px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#555555',
              marginBottom: '20px',
            }}
          >
            READY TO MEASURE YOUR BOUNDARY?
          </div>

          <h2
            style={{
              fontFamily: 'var(--f-sans)',
              fontSize: 'clamp(52px, 7vw, 84px)',
              fontWeight: 900,
              lineHeight: 0.94,
              letterSpacing: '-0.04em',
              color: '#000000',
              textTransform: 'uppercase',
              margin: '0 0 32px 0',
            }}
          >
            ASSESS.<br />IMPROVE.<br />REASSESS.
          </h2>

          <button
            onClick={() => navigate('/assess')}
            style={{
              background: '#000000',
              color: '#FFFFFF',
              border: '1px solid #000000',
              padding: '14px 36px',
              fontFamily: 'var(--f-mono)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              marginBottom: '24px',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.color = '#000000';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#000000';
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            BEGIN ASSESSMENT →
          </button>

          <div
            style={{
              fontFamily: 'var(--f-mono)',
              fontSize: '9px',
              letterSpacing: '0.14em',
              color: '#666666',
              textTransform: 'uppercase',
            }}
          >
            ESTIMATED RUNTIME: ~20 MINUTES • AUDIO INPUT/OUTPUT REQUIRED
          </div>
        </div>
      </section>

      {/* Global Telemetry System Footer */}
      <SystemFooter />
    </div>
  );
}
