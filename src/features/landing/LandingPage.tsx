import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { AdaptivePathDiagram } from '../../components/charts/AdaptivePathDiagram';

const processSteps = [
  { num: '01', label: 'TARGET' },
  { num: '02', label: 'COMPETENCY MAP' },
  { num: '03', label: 'ASSESSMENT' },
  { num: '04', label: 'EVIDENCE' },
  { num: '05', label: 'SKILL ESTIMATE' },
  { num: '06', label: 'GAP ANALYSIS' },
  { num: '07', label: 'IMPROVEMENT' },
  { num: '08', label: 'REASSESS' },
];

const mockSkillDisplay = [
  { name: 'DSA', score: 78, conf: 0.89, target: 72 },
  { name: 'Python', score: 71, conf: 0.84, target: 74 },
  { name: 'SQL', score: 63, conf: 0.76, target: 68 },
  { name: 'Debugging', score: 46, conf: 0.71, target: 74 },
  { name: 'System Design', score: 39, conf: 0.57, target: 55 },
];

export function LandingPage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const sectionInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const skillsRef = useRef<HTMLDivElement>(null);
  const skillsInView = useInView(skillsRef, { once: true, margin: '-80px' });

  return (
    <main className="page-shell" style={{ background: 'var(--c-paper)' }}>
      {/* ── HERO ── */}
      <section
        style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          gap: 'var(--space-12)',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: 'var(--space-24) var(--space-8)',
        }}
      >
        {/* Left — typography */}
        <div>
          <motion.div
            className="hero-label"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Adaptive Assessment Engine / v0.1
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            KNOW<br />WHERE<br />YOU STAND.
          </motion.h1>

          <motion.p
            className="hero-sub"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            An adaptive voice assessment that measures demonstrated ability against the role you're trying to reach.
          </motion.p>

          <motion.div
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <Link to="/assess">
              <button className="btn btn-primary btn-lg" aria-label="Begin your adaptive assessment">
                Begin Assessment →
              </button>
            </Link>
            <Link to="/skills">
              <button className="btn btn-ghost btn-lg">
                View Profile
              </button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            className="hero-meta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            style={{ marginTop: 'var(--space-12)', paddingTop: 'var(--space-8)', borderTop: '1px solid var(--c-rule)' }}
          >
            <div className="hero-stat">
              <span className="hero-stat-value">5+</span>
              <span className="hero-stat-label">Competencies</span>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'var(--c-rule)' }} />
            <div className="hero-stat">
              <span className="hero-stat-value">IRT</span>
              <span className="hero-stat-label">Engine</span>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'var(--c-rule)' }} />
            <div className="hero-stat">
              <span className="hero-stat-value">∞</span>
              <span className="hero-stat-label">Adaptive</span>
            </div>
          </motion.div>
        </div>

        {/* Right — adaptive path diagram */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
            alignItems: 'center',
          }}
        >
          {/* System annotation */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'flex-end',
              }}
            >
              <span className="sys-label">Assessment Engine</span>
              <span className="sys-label" style={{ color: 'var(--c-accent)' }}>
                State / Adaptive
              </span>
            </div>
          </div>

          {/* Path diagram */}
          <div style={{ width: '100%', maxWidth: '360px', padding: 'var(--space-4)' }}>
            <AdaptivePathDiagram />
          </div>

          {/* Annotations */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-3) var(--space-8)',
              borderTop: '1px solid var(--c-rule)',
              paddingTop: 'var(--space-6)',
              width: '100%',
            }}
          >
            {[
              ['QUESTION', '04 / 10'],
              ['DIFFICULTY', 'HARD'],
              ['SEARCHING', 'MED → HARD'],
              ['ESTIMATE', '72'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="sys-label">{k}</span>
                <span
                  style={{
                    fontFamily: 'var(--f-mono)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--c-ink)',
                    fontWeight: 500,
                  }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── PROCESS STRIP ── */}
      <motion.div
        className="process-strip"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <div className="process-items">
          {processSteps.map((step) => (
            <div key={step.num} className="process-item">
              <span className="process-step-num">{step.num}</span>
              <span className="process-step-label">{step.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── SKILL PROFILE PREVIEW ── */}
      <section
        ref={skillsRef}
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: 'var(--space-24) var(--space-8)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-16)',
            alignItems: 'start',
          }}
        >
          {/* Left — copy */}
          <div>
            <div className="section-label" style={{ marginBottom: 'var(--space-6)' }}>
              The Skill Model
            </div>
            <h2
              style={{
                fontFamily: 'var(--f-sans)',
                fontSize: 'clamp(36px, 5vw, 64px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                marginBottom: 'var(--space-8)',
                color: 'var(--c-ink)',
              }}
            >
              NOT A SCORE.<br />A MAP OF<br />ABILITY.
            </h2>
            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--c-mid)',
                maxWidth: '400px',
                lineHeight: 1.7,
                marginBottom: 'var(--space-8)',
              }}
            >
              Each competency is estimated independently with a confidence score. The system tracks your evolution across multiple sessions and identifies exactly where the gap is — not just whether you passed.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-4)',
                paddingTop: 'var(--space-6)',
                borderTop: '1px solid var(--c-rule)',
              }}
            >
              {[
                ['ESTIMATE', 'Per-competency score'],
                ['CONFIDENCE', 'Evidence quality'],
                ['TARGET', 'Role requirement'],
                ['GAP', 'Exact delta'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="sys-label" style={{ marginBottom: '4px' }}>{k}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--c-mid)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — skill bars */}
          <div ref={sectionRef}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-6)',
              }}
            >
              <span className="sys-label">Junior Software Engineer</span>
              <span className="sys-label" style={{ color: 'var(--c-mid-2)' }}>
                Session 03
              </span>
            </div>

            {mockSkillDisplay.map((skill, i) => (
              <motion.div
                key={skill.name}
                style={{
                  marginBottom: 'var(--space-6)',
                  paddingBottom: 'var(--space-6)',
                  borderBottom: i < mockSkillDisplay.length - 1 ? '1px solid var(--c-rule)' : 'none',
                }}
                initial={{ opacity: 0, x: -16 }}
                animate={skillsInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', alignItems: 'baseline' }}>
                  <span
                    style={{
                      fontFamily: 'var(--f-mono)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--c-ink)',
                    }}
                  >
                    {skill.name}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'baseline' }}>
                    <span
                      style={{
                        fontFamily: 'var(--f-mono)',
                        fontSize: 'var(--text-xl)',
                        fontWeight: 500,
                        color: 'var(--c-ink)',
                      }}
                    >
                      {skill.score}
                    </span>
                    {skill.score < skill.target && (
                      <span
                        style={{
                          fontFamily: 'var(--f-mono)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--c-danger)',
                        }}
                      >
                        {skill.score - skill.target}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ position: 'relative', height: '3px', background: 'var(--c-rule)' }}>
                  <motion.div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      background: skill.score >= skill.target ? 'var(--c-accent)' : 'var(--c-mid)',
                    }}
                    initial={{ width: '0%' }}
                    animate={skillsInView ? { width: `${skill.score}%` } : { width: '0%' }}
                    transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: `${skill.target}%`,
                      width: '2px',
                      height: '11px',
                      background: 'var(--c-ink)',
                    }}
                    title={`Target: ${skill.target}`}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span className="sys-label">
                    conf {skill.conf.toFixed(2)}
                  </span>
                  <span className="sys-label">
                    target {skill.target}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SYSTEM ARCHITECTURE SECTION ── */}
      <section
        style={{
          background: 'var(--c-ink)',
          padding: 'var(--space-24) 0',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 var(--space-8)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-16)',
              alignItems: 'start',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--f-mono)',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(245,244,240,0.4)',
                  marginBottom: 'var(--space-6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <span style={{ display: 'block', width: '16px', height: '1px', background: 'var(--c-accent)' }} />
                How it works
              </div>
              <h2
                style={{
                  fontFamily: 'var(--f-sans)',
                  fontSize: 'clamp(36px, 4.5vw, 60px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                  color: 'var(--c-paper)',
                  marginBottom: 'var(--space-8)',
                }}
              >
                THE SYSTEM<br />FINDS YOUR<br />BOUNDARY.
              </h2>
              <p
                style={{
                  fontSize: 'var(--text-base)',
                  color: 'rgba(245,244,240,0.5)',
                  maxWidth: '400px',
                  lineHeight: 1.7,
                  marginBottom: 'var(--space-10)',
                }}
              >
                Like a psychometric instrument, the adaptive engine continuously narrows in on the boundary between what you can and cannot reliably do — then measures the gap against your target role.
              </p>
              <Link to="/assess">
                <button
                  className="btn btn-outline"
                  style={{ borderColor: 'rgba(245,244,240,0.3)', color: 'var(--c-paper)' }}
                >
                  Start Your Assessment →
                </button>
              </Link>
            </div>

            {/* Pipeline diagram */}
            <div>
              {[
                { step: 'MICROPHONE', desc: 'Audio capture' },
                { step: 'SPEECH TO TEXT', desc: 'Transcript generation' },
                { step: 'ANSWER EVALUATION', desc: 'Concept coverage' },
                { step: 'ADAPTIVE ENGINE', desc: 'Next question selection' },
                { step: 'SKILL ESTIMATE', desc: 'IRT scoring' },
                { step: 'TEXT TO SPEECH', desc: 'AI interviewer' },
              ].map((item, i, arr) => (
                <div key={item.step}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-4)',
                      padding: 'var(--space-4) 0',
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: i === 3 ? 'var(--c-accent)' : 'rgba(245,244,240,0.3)',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'var(--f-mono)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 500,
                          letterSpacing: '0.14em',
                          color: i === 3 ? 'var(--c-accent)' : 'var(--c-paper)',
                          marginBottom: '2px',
                        }}
                      >
                        {item.step}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--f-mono)',
                          fontSize: '10px',
                          color: 'rgba(245,244,240,0.35)',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      style={{
                        marginLeft: '2px',
                        width: '1px',
                        height: '20px',
                        background: 'rgba(245,244,240,0.12)',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: 'var(--space-24) var(--space-8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--space-6)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--c-mid)',
          }}
        >
          Ready to measure your boundary?
        </div>
        <h2
          style={{
            fontFamily: 'var(--f-sans)',
            fontSize: 'clamp(40px, 6vw, 80px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            color: 'var(--c-ink)',
          }}
        >
          ASSESS.<br />IMPROVE.<br />REASSESS.
        </h2>
        <Link to="/assess">
          <button className="btn btn-primary btn-lg" style={{ marginTop: 'var(--space-4)' }}>
            Begin Assessment →
          </button>
        </Link>
      </section>
    </main>
  );
}
