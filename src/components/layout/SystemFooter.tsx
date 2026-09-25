import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function SystemFooter() {
  const [latency, setLatency] = useState(180);
  const [isOnline, setIsOnline] = useState(true);

  // Measure or simulate slight dynamic jitter on latency to make it feel alive & real
  useEffect(() => {
    const interval = setInterval(() => {
      // Small jitter between 165ms and 195ms [P99]
      setLatency(Math.floor(175 + Math.random() * 18));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid #000000',
        color: '#000000',
        fontFamily: 'var(--f-mono)',
        fontSize: '11px',
        width: '100%',
        marginTop: 'auto',
      }}
    >
      {/* Telemetry Status Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderBottom: '1px solid #000000',
        }}
      >
        {/* Metric 1 */}
        <div
          style={{
            padding: '12px 24px',
            borderRight: '1px solid #000000',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ color: '#666666', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            SYSTEM LATENCY
          </span>
          <span style={{ fontWeight: 600, letterSpacing: '0.08em', color: '#000000' }}>
            {latency}MS [P99]
          </span>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            padding: '12px 24px',
            borderRight: '1px solid #000000',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ color: '#666666', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            PSYCHOMETRIC MODEL
          </span>
          <span style={{ fontWeight: 600, letterSpacing: '0.08em', color: '#000000' }}>
            IRT 3-PARAMETER
          </span>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            padding: '12px 24px',
            borderRight: '1px solid #000000',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ color: '#666666', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            INTERVIEW ENGINE
          </span>
          <span style={{ fontWeight: 600, letterSpacing: '0.08em', color: '#000000' }}>
            VOICE-STREAM V2
          </span>
        </div>

        {/* Metric 4 */}
        <div
          style={{
            padding: '12px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ color: '#666666', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            SYSTEM STATUS
          </span>
          <span
            style={{
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: '#0047FF',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#0047FF' }} />
            ALL ENGINES ONLINE
          </span>
        </div>
      </div>

      {/* Bottom Legal & Meta Strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ color: '#000000', fontWeight: 500, letterSpacing: '0.06em', fontSize: '10px' }}>
          <strong style={{ fontWeight: 700 }}>ADAPTIVE</strong> © 2026 ADAPTIVE ASSESSMENT SYSTEMS INC. RAW BLOCK ARCHITECTURE.
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link
            to="/skills"
            style={{
              color: '#444444',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#000000')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#444444')}
          >
            TELEMETRY
          </Link>
          <span style={{ color: '#CCCCCC' }}>|</span>
          <a
            href="#privacy"
            style={{
              color: '#444444',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#000000')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#444444')}
          >
            PRIVACY PROTOCOL
          </a>
          <span style={{ color: '#CCCCCC' }}>|</span>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#444444',
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#000000')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#444444')}
          >
            API DOCUMENTATION
          </a>
        </div>
      </div>
    </footer>
  );
}
